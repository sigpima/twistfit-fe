# Forum: Bookmark ("Đã lưu") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in user save a forum post for later and browse everything they've saved on a dedicated "Đã lưu" page — making the homepage's "save posts to reference later" promise true.

**Architecture:** Backend adds one new table (`forum_bookmarks`) that mirrors the existing `ForumLike` toggle pattern exactly, plus a `GET /forum/posts/saved` listing endpoint. Frontend adds a bookmark toggle to the existing post list (icon-only) and detail page (icon+text, next to the like button), a new `/forum/saved` page reusing the same list-row markup, and a small nav row so `/forum/new`, `/forum/my-posts`, and `/forum/saved` are all reachable from `/forum`.

**Tech Stack:** FastAPI + SQLAlchemy + Alembic + pytest (real Postgres test DB), Next.js + TypeScript + Vitest/Testing Library.

**Spec:** `frontend/docs/superpowers/specs/2026-09-16-forum-bookmark-design.md`

## Global Constraints

- One bookmark per `(user, post)` pair, enforced by a DB unique constraint; bookmarking again toggles it off.
- Only `published` posts can be bookmarked/commented/liked — gated through the existing `service.can_view_post`.
- No named collections/boards in v1 — one flat "Đã lưu" list per user.
- Bookmark button is icon-only in the post list (already carries thumbnail/author/like/comment metadata) with `aria-label` + `aria-pressed`; icon+text on the detail page, matching the existing like button there.
- Every backend test runs against the real Postgres test DB (`backend/tests/conftest.py`) — no mocking the ORM.

---

## Task 1: Data model — the `forum_bookmarks` table

**Files:**
- Modify: `backend/app/domains/forum/models.py`
- Create: `backend/alembic/versions/<generated>_add_forum_bookmarks.py`
- Modify: `backend/tests/domains/forum/test_models.py`

**Interfaces:**
- Consumes: nothing new (mirrors `ForumLike` from the prior sub-project).
- Produces: `ForumBookmark(id, post_id, user_id, created_at)` with a unique `(post_id, user_id)` constraint. Task 2 and Task 3 depend on it.

- [ ] **Step 1: Write the failing model test**

Update the import line at the top of `backend/tests/domains/forum/test_models.py`:

```python
from app.domains.forum.models import ForumBookmark, ForumComment, ForumLike, ForumPost, ForumReport
```

Append to the same file:

```python
def test_forum_bookmark_enforces_one_bookmark_per_user_per_post(db_session):
    user, post = _make_user_and_post(db_session, "forum-model-bookmark@example.com")

    db_session.add(ForumBookmark(post_id=post.id, user_id=user.id))
    db_session.commit()

    db_session.add(ForumBookmark(post_id=post.id, user_id=user.id))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_models.py -v -k bookmark
```

Expected: FAIL — `ForumBookmark` doesn't exist.

- [ ] **Step 3: Add the model**

Append to `backend/app/domains/forum/models.py` (after `ForumLike`, at the end of the file):

```python
class ForumBookmark(Base):
    __tablename__ = "forum_bookmarks"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_forum_bookmarks_post_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(
        ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
```

(`user_id` is indexed here — unlike `ForumLike.user_id` — because Task 3's "list my saved posts" query filters by `user_id` directly, whereas likes are only ever queried by `post_id`.)

- [ ] **Step 4: Generate and apply the migration**

```bash
cd backend && source venv/bin/activate
alembic revision --autogenerate -m "add forum bookmarks"
```

Open the generated file under `backend/alembic/versions/` and confirm it contains (adjust only if column/constraint order differs):

```python
def upgrade() -> None:
    op.create_table('forum_bookmarks',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('post_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['forum_posts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('post_id', 'user_id', name='uq_forum_bookmarks_post_user')
    )
    op.create_index(op.f('ix_forum_bookmarks_post_id'), 'forum_bookmarks', ['post_id'], unique=False)
    op.create_index(op.f('ix_forum_bookmarks_user_id'), 'forum_bookmarks', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_forum_bookmarks_user_id'), table_name='forum_bookmarks')
    op.drop_index(op.f('ix_forum_bookmarks_post_id'), table_name='forum_bookmarks')
    op.drop_table('forum_bookmarks')
```

If autogenerate also proposes unrelated changes (e.g. `alter_column` statements on `quiz_attempts` columns — this has happened before, see the comment left in `backend/alembic/versions/77a65c326cf3_add_forum_image_comments_and_likes.py`), delete those lines; they're pre-existing drift, not part of this change.

Then apply it:

```bash
alembic upgrade head
```

Expected: succeeds without error (brand-new empty table).

- [ ] **Step 5: Run the model test to verify it passes**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_models.py -v
```

Expected: PASS (all tests, including the new one).

- [ ] **Step 6: Commit**

```bash
git add backend/app/domains/forum/models.py backend/tests/domains/forum/test_models.py backend/alembic/versions/
git commit -m "feat: add forum_bookmarks table"
```

---

## Task 2: Bookmark toggle endpoint

**Files:**
- Modify: `backend/app/domains/forum/schemas.py`
- Modify: `backend/app/domains/forum/service.py`
- Modify: `backend/app/domains/forum/router.py`
- Modify: `backend/tests/domains/forum/test_service.py`
- Modify: `backend/tests/domains/forum/test_router.py`

**Interfaces:**
- Consumes: `ForumBookmark` from Task 1.
- Produces: `service.toggle_bookmark(db, post_id, user_id) -> bool`, `service.user_has_bookmarked(db, post_id, user_id) -> bool`, `ForumPostResponse.bookmarked_by_me: bool` (every post-returning endpoint now includes it, via `build_post_response`), `POST /forum/posts/{post_id}/bookmark` returning `ForumBookmarkResponse {bookmarked: bool}`. Task 3's `/forum/posts/saved` endpoint returns posts through the same `build_post_response`, so it picks up `bookmarked_by_me` automatically once this task lands.

- [ ] **Step 1: Write the failing service tests**

Append to `backend/tests/domains/forum/test_service.py`:

```python
def test_toggle_bookmark_creates_then_removes_a_bookmark(db_session):
    user = _make_user(db_session, "forum-svc-bookmark1@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)

    assert service.toggle_bookmark(db_session, post.id, user.id) is True
    assert service.toggle_bookmark(db_session, post.id, user.id) is False


def test_build_post_response_reflects_bookmarked_by_me(db_session):
    user = _make_user(db_session, "forum-svc-bookmark2@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)

    data = service.build_post_response(db_session, post, viewer_id=user.id)
    assert data["bookmarked_by_me"] is False

    service.toggle_bookmark(db_session, post.id, user.id)
    data = service.build_post_response(db_session, post, viewer_id=user.id)
    assert data["bookmarked_by_me"] is True
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v -k bookmark
```

Expected: FAIL — `toggle_bookmark` doesn't exist, `build_post_response` has no `bookmarked_by_me` key.

- [ ] **Step 3: Add the service functions and wire `build_post_response`**

Update the top import line in `backend/app/domains/forum/service.py`:

```python
from app.domains.forum.models import ForumBookmark, ForumComment, ForumLike, ForumPost, ForumReport
```

Add near `user_has_liked`/`toggle_like`:

```python
def user_has_bookmarked(db: Session, post_id: int, user_id: int) -> bool:
    return (
        db.query(ForumBookmark)
        .filter(ForumBookmark.post_id == post_id, ForumBookmark.user_id == user_id)
        .first()
        is not None
    )


def toggle_bookmark(db: Session, post_id: int, user_id: int) -> bool:
    existing = (
        db.query(ForumBookmark)
        .filter(ForumBookmark.post_id == post_id, ForumBookmark.user_id == user_id)
        .first()
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
        return False
    db.add(ForumBookmark(post_id=post_id, user_id=user_id))
    db.commit()
    return True
```

Update `build_post_response` to add one key (right after `comment_count`):

```python
def build_post_response(db: Session, post: ForumPost, viewer_id: int | None) -> dict:
    return {
        "id": post.id,
        "title": post.title,
        "body": post.body,
        "image_url": post.image_url,
        "category": post.category,
        "status": post.status,
        "author_id": post.author_id,
        "author_name": post.author.name,
        "like_count": count_likes(db, post.id),
        "liked_by_me": viewer_id is not None and user_has_liked(db, post.id, viewer_id),
        "comment_count": count_comments(db, post.id),
        "bookmarked_by_me": viewer_id is not None and user_has_bookmarked(db, post.id, viewer_id),
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    }
```

- [ ] **Step 4: Add `bookmarked_by_me` to the schema**

In `backend/app/domains/forum/schemas.py`, add the field to `ForumPostResponse` (right after `comment_count`):

```python
class ForumPostResponse(CamelModel):
    id: int
    title: str
    body: str
    image_url: str | None
    category: str
    status: str
    author_id: int
    author_name: str
    like_count: int
    liked_by_me: bool
    comment_count: int
    bookmarked_by_me: bool
    created_at: datetime
    updated_at: datetime
```

Add `ForumBookmarkResponse` at the end of the file:

```python
class ForumBookmarkResponse(CamelModel):
    bookmarked: bool
```

- [ ] **Step 5: Run the service tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v
```

Expected: PASS (all tests).

- [ ] **Step 6: Write the failing router tests**

Append to `backend/tests/domains/forum/test_router.py`:

```python
def test_bookmark_post_requires_authentication(client):
    assert client.post("/forum/posts/1/bookmark").status_code == 401


def test_bookmark_post_toggles_and_reflects_in_the_post_response(client, db_session):
    _register_and_login(client, "forum-bookmark-owner@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])

    response = client.post(f"/forum/posts/{post['id']}/bookmark")
    assert response.status_code == 200
    assert response.json() == {"bookmarked": True}

    fetched = client.get(f"/forum/posts/{post['id']}").json()
    assert fetched["bookmarkedByMe"] is True

    response2 = client.post(f"/forum/posts/{post['id']}/bookmark")
    assert response2.json() == {"bookmarked": False}


def test_bookmark_post_returns_404_for_a_non_visible_post(client):
    _register_and_login(client, "forum-bookmark-owner2@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-bookmark-stranger@example.com")
    assert client.post(f"/forum/posts/{post['id']}/bookmark").status_code == 404


def test_bookmark_post_returns_404_for_a_nonexistent_post(client):
    _register_and_login(client, "forum-bookmark-owner3@example.com")
    assert client.post("/forum/posts/999999/bookmark").status_code == 404
```

- [ ] **Step 7: Add the router endpoint**

Update the schemas import in `backend/app/domains/forum/router.py`:

```python
from app.domains.forum.schemas import (
    FORUM_CATEGORIES,
    ForumBookmarkResponse,
    ForumCommentCreate,
    ForumCommentResponse,
    ForumLikeResponse,
    ForumPostCreate,
    ForumPostResponse,
    ForumPostStatusUpdate,
    ForumReportCreate,
    ForumReportResponse,
)
```

Add the endpoint right after `like_post`:

```python
@router.post("/posts/{post_id}/bookmark", response_model=ForumBookmarkResponse)
def bookmark_post(post_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = service.get_post(db, post_id)
    if post is None or not service.can_view_post(post, user.id, user.role):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    bookmarked = service.toggle_bookmark(db, post_id, user.id)
    return {"bookmarked": bookmarked}
```

- [ ] **Step 8: Run the router tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_router.py -v
```

Expected: PASS (all tests — including every pre-existing one, since the response shape change is additive).

- [ ] **Step 9: Commit**

```bash
git add backend/app/domains/forum/ backend/tests/domains/forum/test_service.py backend/tests/domains/forum/test_router.py
git commit -m "feat: add toggleable bookmarks to forum posts"
```

---

## Task 3: List saved posts

**Files:**
- Modify: `backend/app/domains/forum/service.py`
- Modify: `backend/app/domains/forum/router.py`
- Modify: `backend/tests/domains/forum/test_service.py`
- Modify: `backend/tests/domains/forum/test_router.py`

**Interfaces:**
- Consumes: `ForumBookmark`, `service.build_post_response` from Tasks 1-2.
- Produces: `service.list_saved_posts(db, user_id) -> list[ForumPost]`, `GET /forum/posts/saved` returning `list[ForumPostResponse]`. Frontend Task 6 (`SavedForumPostList.tsx`) consumes this endpoint directly.

- [ ] **Step 1: Write the failing service tests**

Append to `backend/tests/domains/forum/test_service.py`:

```python
def test_list_saved_posts_returns_only_the_caller_bookmarked_posts(db_session):
    user = _make_user(db_session, "forum-svc-saved1@example.com")
    other = _make_user(db_session, "forum-svc-saved2@example.com")
    mine = service.create_post(db_session, user.id, VALID_POST)
    others_post = service.create_post(db_session, other.id, VALID_POST)

    service.toggle_bookmark(db_session, mine.id, user.id)
    service.toggle_bookmark(db_session, others_post.id, other.id)

    saved = service.list_saved_posts(db_session, user.id)
    assert [p.id for p in saved] == [mine.id]


def test_list_saved_posts_orders_newest_bookmark_first(db_session):
    user = _make_user(db_session, "forum-svc-saved3@example.com")
    first = service.create_post(db_session, user.id, VALID_POST)
    second = service.create_post(db_session, user.id, VALID_POST)

    service.toggle_bookmark(db_session, first.id, user.id)
    service.toggle_bookmark(db_session, second.id, user.id)

    saved = service.list_saved_posts(db_session, user.id)
    assert [p.id for p in saved] == [second.id, first.id]
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v -k saved
```

Expected: FAIL — `list_saved_posts` doesn't exist.

- [ ] **Step 3: Implement `list_saved_posts`**

Add to `backend/app/domains/forum/service.py` (near `list_posts_by_author`):

```python
def list_saved_posts(db: Session, user_id: int) -> list[ForumPost]:
    return (
        db.query(ForumPost)
        .join(ForumBookmark, ForumBookmark.post_id == ForumPost.id)
        .filter(ForumBookmark.user_id == user_id)
        .order_by(ForumBookmark.id.desc())
        .all()
    )
```

- [ ] **Step 4: Run the service tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v -k saved
```

Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing router tests**

Append to `backend/tests/domains/forum/test_router.py`:

```python
def test_list_saved_posts_requires_authentication(client):
    assert client.get("/forum/posts/saved").status_code == 401


def test_list_saved_posts_returns_the_caller_bookmarked_posts(client, db_session):
    _register_and_login(client, "forum-saved-owner@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])

    _register_and_login(client, "forum-saved-other@example.com")
    other_post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, other_post["id"])
    client.post(f"/forum/posts/{other_post['id']}/bookmark")

    response = client.get("/forum/posts/saved")
    assert response.status_code == 200
    assert [p["id"] for p in response.json()] == [other_post["id"]]
    assert response.json()[0]["bookmarkedByMe"] is True
```

- [ ] **Step 6: Add the router endpoint**

Add to `backend/app/domains/forum/router.py`, right after `list_my_posts` (both must precede `/posts/{post_id}` — a literal `saved` segment would otherwise be swallowed by the path parameter, same reasoning as the existing comment on `list_my_posts`):

```python
@router.get("/posts/saved", response_model=list[ForumPostResponse])
def list_saved_posts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    posts = service.list_saved_posts(db, user.id)
    return [service.build_post_response(db, post, user.id) for post in posts]
```

- [ ] **Step 7: Run the full forum backend test suite to verify everything passes**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/ -v
```

Expected: PASS (every test in `test_models.py`, `test_service.py`, `test_router.py`).

- [ ] **Step 8: Commit**

```bash
git add backend/app/domains/forum/ backend/tests/domains/forum/test_service.py backend/tests/domains/forum/test_router.py
git commit -m "feat: add endpoint to list a user's saved forum posts"
```

---

## Task 4: Frontend types, stale-fixture fixes, and the list bookmark button

**Files:**
- Modify: `frontend/lib/forum.ts`
- Modify: `frontend/components/forum/ForumPostList.tsx`
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/forum/ForumPostList.test.tsx`
- Modify: `frontend/components/forum/ForumPostForm.test.tsx` (fixture field only)
- Modify: `frontend/components/forum/ForumPostDetail.test.tsx` (fixture field only)
- Modify: `frontend/components/forum/MyForumPostList.test.tsx` (fixture field only)
- Modify: `frontend/app/forum/[id]/page.test.tsx` (fixture field only)
- Modify: `frontend/app/forum/[id]/edit/page.test.tsx` (fixture field only)
- Modify: `frontend/components/admin/ForumModerationQueue.test.tsx` (fixture field only)

**Interfaces:**
- Consumes: `POST /forum/posts/{id}/bookmark` (Task 2), `ForumPostResponse.bookmarked_by_me` (Task 2).
- Produces: `ForumPost` type gains `bookmarkedByMe: boolean` — every later frontend task builds on this shape.

- [ ] **Step 1: Update the shared forum type**

In `frontend/lib/forum.ts`, add the field to `ForumPost` (right after `commentCount`):

```ts
export type ForumPost = {
  id: number
  title: string
  body: string
  imageUrl: string | null
  category: ForumCategory
  status: ForumPostStatus
  authorId: number
  authorName: string
  likeCount: number
  likedByMe: boolean
  commentCount: number
  bookmarkedByMe: boolean
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Fix the now-stale `ForumPost` fixtures**

Add `bookmarkedByMe: false` to each literal `ForumPost` object below (insert right after each object's `commentCount` line — no other change in these six files for this task):

`frontend/components/forum/ForumPostForm.test.tsx` (`EXISTING_POST`), `frontend/components/forum/ForumPostDetail.test.tsx` (`POST`), `frontend/app/forum/[id]/page.test.tsx` (`POST`), `frontend/app/forum/[id]/edit/page.test.tsx` (`POST`), `frontend/components/forum/MyForumPostList.test.tsx` (`POSTS[0]`), `frontend/components/admin/ForumModerationQueue.test.tsx` (`POSTS[0]`).

For example, in `frontend/components/forum/ForumPostDetail.test.tsx`:

```ts
const POST: ForumPost = {
  id: 9,
  title: 'Bài chi tiết',
  body: 'Nội dung chi tiết',
  imageUrl: 'https://example.com/outfit.jpg',
  category: 'general',
  status: 'published',
  authorId: 1,
  authorName: 'Lan Anh',
  likeCount: 2,
  likedByMe: false,
  commentCount: 0,
  bookmarkedByMe: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
```

Apply the same one-line addition (`bookmarkedByMe: false,` after `commentCount`) to the other five fixtures listed above, keeping every other field exactly as it already is.

- [ ] **Step 3: Write the failing test for the list bookmark button**

In `frontend/components/forum/ForumPostList.test.tsx`, add `bookmarkedByMe: false` to the `POSTS` fixture's single entry (after `commentCount: 2,`), then add this test inside the `describe` block:

```tsx
it('toggles the bookmark button', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ bookmarked: true }) })
      }
      return Promise.resolve({ ok: true, json: async () => POSTS })
    })
  )
  renderWithIntl(<ForumPostList />)
  await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())

  const saveButton = screen.getByRole('button', { name: 'Lưu bài viết' })
  expect(saveButton).toHaveAttribute('aria-pressed', 'false')
  fireEvent.click(saveButton)

  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Bỏ lưu bài viết' })).toHaveAttribute('aria-pressed', 'true')
  )
  expect(fetch).toHaveBeenCalledWith(
    '/forum/posts/1/bookmark',
    expect.objectContaining({ method: 'POST', credentials: 'include' })
  )
})
```

- [ ] **Step 4: Run the tests to verify the new one fails**

```bash
cd frontend && npx vitest run components/forum/ForumPostList.test.tsx
```

Expected: FAIL — no button named "Lưu bài viết" exists yet; every other test in the file still passes.

- [ ] **Step 5: Add the bookmark translations**

In `frontend/messages/vi.json`, add a `Bookmark` object to `Forum` (insert it right after `Comments`):

```json
"Bookmark": {
  "saveButton": "Lưu",
  "savedButton": "Đã lưu",
  "saveAriaLabel": "Lưu bài viết",
  "savedAriaLabel": "Bỏ lưu bài viết"
},
```

- [ ] **Step 6: Add the bookmark button to `ForumPostList.tsx`**

Replace the `<li>` block inside `posts.map(...)`:

```tsx
{posts.map((post) => (
  <li
    key={post.id}
    className="flex items-center gap-space-md rounded-2xl border border-outline-variant p-space-lg"
  >
    {post.imageUrl && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={post.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
    )}
    <div className="min-w-0 flex-1">
      <Link
        href={`/forum/${post.id}`}
        className="text-headline-sm font-semibold text-on-surface hover:underline"
      >
        {post.title}
      </Link>
      <p className="mt-space-xs text-label-sm text-on-surface-variant">
        {t(`categories.${post.category}`)} · {post.authorName}
      </p>
      <p className="mt-space-xs text-label-sm text-on-surface-variant">
        {post.likeCount} {t('Public.likesLabel')} · {post.commentCount} {t('Public.commentsLabel')}
      </p>
    </div>
    <button
      type="button"
      onClick={() => handleToggleBookmark(post.id)}
      aria-pressed={post.bookmarkedByMe}
      aria-label={post.bookmarkedByMe ? t('Bookmark.savedAriaLabel') : t('Bookmark.saveAriaLabel')}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
    >
      <span
        className="material-symbols-outlined text-[22px]"
        aria-hidden="true"
        style={post.bookmarkedByMe ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        bookmark
      </span>
    </button>
  </li>
))}
```

Add the handler function right after the existing `useEffect`:

```tsx
async function handleToggleBookmark(postId: number) {
  const response = await apiFetch(`/forum/posts/${postId}/bookmark`, { method: 'POST' })
  if (!response.ok) return
  const { bookmarked } = (await response.json()) as { bookmarked: boolean }
  setPosts(
    (current) => current?.map((post) => (post.id === postId ? { ...post, bookmarkedByMe: bookmarked } : post)) ?? null
  )
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/forum/ForumPostList.test.tsx components/forum/ForumPostForm.test.tsx components/forum/ForumPostDetail.test.tsx components/forum/MyForumPostList.test.tsx components/admin/ForumModerationQueue.test.tsx app/forum/
```

Expected: PASS (all tests, including the new bookmark test and every fixed fixture).

- [ ] **Step 8: Commit**

```bash
git add frontend/lib/forum.ts frontend/components/forum/ForumPostList.tsx frontend/components/forum/ForumPostList.test.tsx frontend/components/forum/ForumPostForm.test.tsx frontend/components/forum/ForumPostDetail.test.tsx frontend/components/forum/MyForumPostList.test.tsx frontend/app/forum/ frontend/components/admin/ForumModerationQueue.test.tsx frontend/messages/vi.json
git commit -m "feat: add a bookmark toggle to the forum post list"
```

---

## Task 5: Detail-page bookmark button

**Files:**
- Modify: `frontend/components/forum/ForumPostDetail.tsx`
- Modify: `frontend/components/forum/ForumPostDetail.test.tsx`

**Interfaces:**
- Consumes: `POST /forum/posts/{id}/bookmark` (Task 2), `ForumPost.bookmarkedByMe` (Task 4).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Add this test inside the `describe` block in `frontend/components/forum/ForumPostDetail.test.tsx`, right after the existing `'lets a signed-in user toggle the like button'` test:

```tsx
it('lets a signed-in user toggle the bookmark button', async () => {
  window.localStorage.setItem(
    'twistfit.auth',
    JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
  )
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
  renderDetail()
  await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Lưu' })).toHaveAttribute('aria-pressed', 'false')

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ bookmarked: true }) }))
  fireEvent.click(screen.getByRole('button', { name: 'Lưu' }))

  await waitFor(() => expect(screen.getByRole('button', { name: 'Đã lưu' })).toHaveAttribute('aria-pressed', 'true'))
  expect(fetch).toHaveBeenCalledWith(
    '/forum/posts/9/bookmark',
    expect.objectContaining({ method: 'POST', credentials: 'include' })
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx
```

Expected: FAIL — no button named "Lưu" exists yet.

- [ ] **Step 3: Add the bookmark button next to the like button**

In `frontend/components/forum/ForumPostDetail.tsx`, add a handler right after `handleToggleLike`:

```tsx
async function handleToggleBookmark() {
  const response = await apiFetch(`/forum/posts/${id}/bookmark`, { method: 'POST' })
  if (!response.ok || !post) return
  const { bookmarked } = (await response.json()) as { bookmarked: boolean }
  setPost({ ...post, bookmarkedByMe: bookmarked })
}
```

Replace the like-button block (the `{user && (<button ... favorite ...</button>)}` right after the post body) with a wrapping row containing both buttons:

```tsx
          {user && (
            <div className="mt-space-md flex items-center gap-space-sm">
              <button
                type="button"
                onClick={handleToggleLike}
                aria-pressed={post.likedByMe}
                className={`inline-flex items-center gap-1 rounded-full px-space-lg py-space-sm text-label-md font-semibold transition-colors ${
                  post.likedByMe
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                  style={post.likedByMe ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
                {post.likedByMe
                  ? t('Like.likedButton', { count: post.likeCount })
                  : t('Like.likeButton', { count: post.likeCount })}
              </button>
              <button
                type="button"
                onClick={handleToggleBookmark}
                aria-pressed={post.bookmarkedByMe}
                className={`inline-flex items-center gap-1 rounded-full px-space-lg py-space-sm text-label-md font-semibold transition-colors ${
                  post.bookmarkedByMe
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  aria-hidden="true"
                  style={post.bookmarkedByMe ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  bookmark
                </span>
                {post.bookmarkedByMe ? t('Bookmark.savedButton') : t('Bookmark.saveButton')}
              </button>
            </div>
          )}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx
```

Expected: PASS (all tests, including the new one).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/forum/ForumPostDetail.tsx frontend/components/forum/ForumPostDetail.test.tsx
git commit -m "feat: add a bookmark button to the forum post detail page"
```

---

## Task 6: The "Đã lưu" page

**Files:**
- Create: `frontend/components/forum/SavedForumPostList.tsx`
- Create: `frontend/components/forum/SavedForumPostList.test.tsx`
- Create: `frontend/app/forum/saved/page.tsx`
- Create: `frontend/app/forum/saved/page.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: `GET /forum/posts/saved` (Task 3), `POST /forum/posts/{id}/bookmark` (Task 2), `ForumPost` type (Task 4), `AuthGate` (`frontend/components/auth/AuthGate.tsx`, unchanged).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Write the failing tests**

Create `frontend/components/forum/SavedForumPostList.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import SavedForumPostList from './SavedForumPostList'
import type { ForumPost } from '@/lib/forum'

const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài đã lưu',
    body: 'Nội dung',
    imageUrl: null,
    category: 'general',
    status: 'published',
    authorId: 2,
    authorName: 'Tác giả',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    bookmarkedByMe: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('SavedForumPostList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders saved posts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<SavedForumPostList />)

    await waitFor(() => expect(screen.getByText('Bài đã lưu')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/forum/posts/saved', { credentials: 'include' })
  })

  it('shows an empty state when nothing is saved', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<SavedForumPostList />)
    await waitFor(() => expect(screen.getByText('Bạn chưa lưu bài viết nào.')).toBeInTheDocument())
  })

  it('removes a post from the list when unbookmarked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    renderWithIntl(<SavedForumPostList />)
    await waitFor(() => expect(screen.getByText('Bài đã lưu')).toBeInTheDocument())

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ bookmarked: false }) }))
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ lưu bài viết' }))

    await waitFor(() => expect(screen.queryByText('Bài đã lưu')).not.toBeInTheDocument())
  })
})
```

Create `frontend/app/forum/saved/page.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { AuthProvider } from '@/components/auth/AuthProvider'
import SavedForumPostsPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('SavedForumPostsPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'twistfit.auth',
      JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
    )
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders the heading for a signed-in user', async () => {
    renderWithIntl(
      <AuthProvider>
        <SavedForumPostsPage />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Đã lưu' })).toBeInTheDocument())
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/forum/SavedForumPostList.test.tsx app/forum/saved/page.test.tsx
```

Expected: FAIL — neither `SavedForumPostList.tsx` nor `app/forum/saved/page.tsx` exist yet.

- [ ] **Step 3: Add the `Saved` translations**

In `frontend/messages/vi.json`, add a `Saved` object to `Forum` (insert it right after `Bookmark`):

```json
"Saved": {
  "title": "Đã lưu",
  "loading": "Đang tải...",
  "emptyState": "Bạn chưa lưu bài viết nào."
},
```

- [ ] **Step 4: Create `SavedForumPostList.tsx`**

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { ForumPost } from '@/lib/forum'

export default function SavedForumPostList() {
  const t = useTranslations('Forum')
  const [posts, setPosts] = useState<ForumPost[] | null>(null)

  useEffect(() => {
    apiFetch('/forum/posts/saved')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleToggleBookmark(postId: number) {
    const response = await apiFetch(`/forum/posts/${postId}/bookmark`, { method: 'POST' })
    if (!response.ok) return
    const { bookmarked } = (await response.json()) as { bookmarked: boolean }
    if (!bookmarked) {
      setPosts((current) => current?.filter((post) => post.id !== postId) ?? null)
    }
  }

  if (posts === null) {
    return <p className="text-body-md text-on-surface-variant">{t('Saved.loading')}</p>
  }

  if (posts.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('Saved.emptyState')}</p>
  }

  return (
    <ul className="space-y-space-md">
      {posts.map((post) => (
        <li
          key={post.id}
          className="flex items-center gap-space-md rounded-2xl border border-outline-variant p-space-lg"
        >
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <Link
              href={`/forum/${post.id}`}
              className="text-headline-sm font-semibold text-on-surface hover:underline"
            >
              {post.title}
            </Link>
            <p className="mt-space-xs text-label-sm text-on-surface-variant">
              {t(`categories.${post.category}`)} · {post.authorName}
            </p>
            <p className="mt-space-xs text-label-sm text-on-surface-variant">
              {post.likeCount} {t('Public.likesLabel')} · {post.commentCount} {t('Public.commentsLabel')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggleBookmark(post.id)}
            aria-pressed={post.bookmarkedByMe}
            aria-label={post.bookmarkedByMe ? t('Bookmark.savedAriaLabel') : t('Bookmark.saveAriaLabel')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
          >
            <span
              className="material-symbols-outlined text-[22px]"
              aria-hidden="true"
              style={post.bookmarkedByMe ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              bookmark
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 5: Create `app/forum/saved/page.tsx`**

```tsx
'use client'

import { useTranslations } from 'next-intl'
import AuthGate from '@/components/auth/AuthGate'
import SavedForumPostList from '@/components/forum/SavedForumPostList'

export default function SavedForumPostsPage() {
  const t = useTranslations('Forum')

  return (
    <main className="w-full bg-surface">
      <AuthGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <h1 className="mb-6 text-headline-md font-bold text-on-surface">{t('Saved.title')}</h1>
          <SavedForumPostList />
        </section>
      </AuthGate>
    </main>
  )
}
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/forum/SavedForumPostList.test.tsx app/forum/saved/page.test.tsx
```

Expected: PASS (all tests).

- [ ] **Step 7: Commit**

```bash
git add frontend/components/forum/SavedForumPostList.tsx frontend/components/forum/SavedForumPostList.test.tsx frontend/app/forum/saved/ frontend/messages/vi.json
git commit -m "feat: add the saved-posts forum page"
```

---

## Task 7: Navigation and homepage copy fix

**Files:**
- Modify: `frontend/app/forum/page.tsx`
- Modify: `frontend/app/forum/page.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: `/forum/new`, `/forum/my-posts` (existing), `/forum/saved` (Task 6).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Add this test inside the `describe` block in `frontend/app/forum/page.test.tsx`, right after the existing test:

```tsx
it('links to new post, my posts, and saved pages', () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  renderWithIntl(<ForumPage />)
  expect(screen.getByRole('link', { name: 'Đăng bài mới' })).toHaveAttribute('href', '/forum/new')
  expect(screen.getByRole('link', { name: 'Bài của tôi' })).toHaveAttribute('href', '/forum/my-posts')
  expect(screen.getByRole('link', { name: 'Đã lưu' })).toHaveAttribute('href', '/forum/saved')
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd frontend && npx vitest run app/forum/page.test.tsx
```

Expected: FAIL — none of the three links exist yet on `/forum`.

- [ ] **Step 3: Add the nav-link translations**

In `frontend/messages/vi.json`, add three keys to the `Forum.Public` object (after `commentsLabel`):

```json
"Public": {
  "title": "Diễn đàn TwistFit",
  "subtitle": "Nơi chia sẻ và xin tư vấn phối đồ cùng cộng đồng TwistFit.",
  "loading": "Đang tải...",
  "emptyState": "Chưa có bài viết nào trong chuyên mục này.",
  "likesLabel": "lượt thích",
  "commentsLabel": "bình luận",
  "newPostLink": "Đăng bài mới",
  "myPostsLink": "Bài của tôi",
  "savedLink": "Đã lưu"
},
```

- [ ] **Step 4: Add the nav row to `app/forum/page.tsx`**

Replace the full contents of `frontend/app/forum/page.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import ForumPostList from '@/components/forum/ForumPostList'

export default function ForumPage() {
  const t = useTranslations('Forum')

  return (
    <main className="w-full bg-surface">
      <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
        <div className="mb-6 text-center">
          <h1 className="text-headline-lg font-bold text-on-surface">{t('Public.title')}</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">{t('Public.subtitle')}</p>
        </div>
        <nav className="mb-6 flex flex-wrap justify-center gap-space-md text-label-md font-semibold">
          <Link href="/forum/new" className="text-primary hover:underline">
            {t('Public.newPostLink')}
          </Link>
          <Link href="/forum/my-posts" className="text-primary hover:underline">
            {t('Public.myPostsLink')}
          </Link>
          <Link href="/forum/saved" className="text-primary hover:underline">
            {t('Public.savedLink')}
          </Link>
        </nav>
        <ForumPostList />
      </section>
    </main>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd frontend && npx vitest run app/forum/page.test.tsx
```

Expected: PASS (both tests).

- [ ] **Step 6: Fix the homepage copy**

In `frontend/messages/vi.json`, find the `FeatureShowcase` "save" step under the community/forum section and replace:

```json
            "save": {
              "title": "Lưu giữ outfit tâm đắc",
              "body": "Tạo các bộ sưu tập riêng và lưu lại những bài đăng ấn tượng để mở ra tham khảo bất cứ khi nào cần lên đồ."
            }
```

with:

```json
            "save": {
              "title": "Lưu giữ outfit tâm đắc",
              "body": "Lưu lại những bài đăng ấn tượng để mở ra tham khảo bất cứ khi nào cần lên đồ."
            }
```

(No test currently asserts on this exact copy — confirmed via `grep -rl "Tạo các bộ sưu tập riêng"` across `.tsx`/`.ts` returning nothing — so this is a safe text-only change.)

- [ ] **Step 7: Commit**

```bash
git add frontend/app/forum/page.tsx frontend/app/forum/page.test.tsx frontend/messages/vi.json
git commit -m "feat: link forum nav pages and fix homepage save-feature copy"
```

---

## Task 8: Final integration

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend test suite**

```bash
cd backend && source venv/bin/activate && python3 -m pytest -v
```

Expected: PASS, no regressions outside `tests/domains/forum/`.

- [ ] **Step 2: Run the full frontend test suite**

```bash
cd frontend && npx vitest run
```

Expected: PASS, no regressions outside the forum-related files.

- [ ] **Step 3: Run the TypeScript compiler as a final check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors. If any remain (a `ForumPost` literal in a file not listed in Task 4), fix it the same way — add `bookmarkedByMe: false` — and re-run.

- [ ] **Step 4: Manual smoke test**

With both dev servers running (backend `uvicorn app.main:app --host 0.0.0.0 --port 8000` — **restart it if it was already running before this plan's backend changes**, since it does not auto-reload; confirm with `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/forum/posts/1/bookmark` returning `401`, not `404`, before proceeding — and frontend `npm run dev`), as a logged-in user:
1. On `/forum`, confirm the three nav links ("Đăng bài mới", "Bài của tôi", "Đã lưu") are visible and work.
2. Click the bookmark icon on a post in the list; confirm it fills in and `aria-pressed` flips (inspect via devtools or the accessibility tree).
3. Open that post's detail page; confirm the "Đã lưu" button (next to "Thích") shows the same saved state.
4. Go to `/forum/saved`; confirm the post appears.
5. Click its bookmark button again (from either the list or detail page) to un-save it; confirm it disappears from `/forum/saved` on next visit (or immediately, if un-saved from the saved page itself).

Report the outcome; fix any issue found before considering this sub-project done.

- [ ] **Step 5: Invoke `finishing-a-development-branch`**

Announce: "I'm using the finishing-a-development-branch skill to complete this work." and follow that skill (verify tests, present the merge/PR/keep-as-is menu, act on the choice) for both the `frontend` (branch `master`) and `backend` (branch `main`) repos.
