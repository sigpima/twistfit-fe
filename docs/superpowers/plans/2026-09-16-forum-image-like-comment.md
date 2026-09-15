# Forum: Image Attachment + Like + Comment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage's forum promise ("hình ảnh + caption", "thả tim", "bình luận") true by adding an optional image attachment, a toggleable like, and flat comments to forum posts.

**Architecture:** Backend adds two new tables (`forum_comments`, `forum_likes`) and one nullable column (`forum_posts.image_url`), reuses the existing wardrobe SAS-upload pattern for images, and introduces a `build_post_response`/`build_comment_response` pair of service helpers that assemble the per-viewer response shape (author name, like count, whether the viewer liked it, comment count) since those fields can't live as plain ORM attributes. Frontend adds an image picker to the post form, a like button and comment thread to the post detail page, and lightweight metadata (thumbnail/author/counts) to the post list.

**Tech Stack:** FastAPI + SQLAlchemy + Alembic + pytest (real Postgres test DB), Next.js + TypeScript + Vitest/Testing Library, Azure Blob Storage (Azurite locally).

**Spec:** `frontend/docs/superpowers/specs/2026-09-16-forum-image-like-comment-design.md`

## Global Constraints

- Comments are visible immediately on creation — no moderation queue.
- Comments are flat (no nested replies).
- One like per `(user, post)` pair, enforced by a DB unique constraint; liking again toggles it off.
- Comment/post delete rule: author or admin only (403 otherwise).
- No comment reporting, no image gallery (exactly one image per post), no bookmark/collection feature — all out of scope for this plan.
- `image_url` is a plain resolved string handed to the client by `POST /forum/upload-url` (mirrors `WardrobeItemCreate.blob_url` — no blob-path bookkeeping on the post schemas).
- Every backend test runs against the real Postgres test DB (`backend/tests/conftest.py`) — no mocking the ORM. The upload-url test hits the real Azurite emulator, no mocking blob storage (mirrors `backend/tests/domains/wardrobe/test_upload_flow.py`).
- UI additions (Tasks 5-8) were reviewed against `ui-ux-pro-max` guidance before being written into this plan: the like button carries `aria-pressed` and a `material-symbols-outlined` icon (the same icon font already loaded globally, see `app/layout.tsx`) rather than an emoji glyph; the detail-page image reserves space via `aspect-[4/3]` to avoid layout shift while it loads; the file input disables itself during upload and its error is announced via `role="alert"`; list rows get `min-w-0` on their text column so long titles/names wrap instead of forcing horizontal overflow at ~400px width; and the comment submit button gets a `submitting` guard against double-posting, mirroring the pattern `ForumPostForm.tsx` already uses. Touch-target sizing for the new like button matches the existing pill-button convention (`px-space-lg py-space-sm`, well above the 24×24 CSS px minimum); the comment-delete and remove-image links intentionally stay plain text links to match the sibling "Sửa"/"Xóa" links already used throughout this domain (`MyForumPostList.tsx`) rather than introducing an inconsistent one-off style.

---

## Task 1: Data model — image column, comments table, likes table

**Files:**
- Modify: `backend/app/domains/forum/models.py`
- Create: `backend/alembic/versions/<generated>_add_forum_image_comments_and_likes.py`
- Modify: `backend/tests/domains/forum/test_models.py`

**Interfaces:**
- Consumes: nothing new.
- Produces: `ForumPost.image_url: str | None`, `ForumPost.author` (relationship to `User`), `ForumComment(id, post_id, author_id, body, created_at, updated_at, author)`, `ForumLike(id, post_id, user_id, created_at)` with a unique `(post_id, user_id)` constraint. Tasks 2-4 depend on all three.

- [ ] **Step 1: Write the failing model tests**

Append to `backend/tests/domains/forum/test_models.py`:

```python
import pytest
from sqlalchemy.exc import IntegrityError

from app.domains.forum.models import ForumComment, ForumLike


def _make_user_and_post(db_session, email: str) -> tuple[User, ForumPost]:
    user = User(name="Author", email=email, password_hash=hash_password("password123"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    post = ForumPost(title="Bài test", body="Nội dung", category="general", author_id=user.id)
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)
    return user, post


def test_forum_post_image_url_defaults_to_none(db_session):
    _, post = _make_user_and_post(db_session, "forum-model-image@example.com")
    assert post.image_url is None


def test_forum_comment_persists_and_exposes_its_author(db_session):
    user, post = _make_user_and_post(db_session, "forum-model-comment@example.com")

    comment = ForumComment(post_id=post.id, author_id=user.id, body="Đẹp quá!")
    db_session.add(comment)
    db_session.commit()
    db_session.refresh(comment)

    assert comment.id is not None
    assert comment.author.name == "Author"
    assert comment.created_at is not None
    assert comment.updated_at is not None


def test_forum_like_enforces_one_like_per_user_per_post(db_session):
    user, post = _make_user_and_post(db_session, "forum-model-like@example.com")

    db_session.add(ForumLike(post_id=post.id, user_id=user.id))
    db_session.commit()

    db_session.add(ForumLike(post_id=post.id, user_id=user.id))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_models.py -v
```

Expected: FAIL — `ForumPost` has no `image_url`, `ForumComment`/`ForumLike` don't exist yet.

- [ ] **Step 3: Add the model changes**

In `backend/app/domains/forum/models.py`, update the import line and add the new fields/classes:

```python
from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
```

Add `image_url` and an `author` relationship to `ForumPost` (insert right after the `body` field and right after the `updated_at` field respectively):

```python
class ForumPost(Base):
    __tablename__ = "forum_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    author: Mapped["User"] = relationship()
```

Add the two new classes at the end of the file (after `ForumReport`):

```python
class ForumComment(Base):
    __tablename__ = "forum_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(
        ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    author: Mapped["User"] = relationship()


class ForumLike(Base):
    __tablename__ = "forum_likes"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_forum_likes_post_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(
        ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
```

(`author: Mapped["User"] = relationship()` resolves via SQLAlchemy's mapper registry by class name, the same forward-reference style already used by `ForumReport.post` in this file — no `User` import needed here.)

- [ ] **Step 4: Generate and apply the migration**

```bash
cd backend && source venv/bin/activate
alembic revision --autogenerate -m "add forum image, comments, and likes"
```

Open the generated file under `backend/alembic/versions/` and confirm it contains (adjust only if column/constraint order differs):

```python
def upgrade() -> None:
    op.add_column('forum_posts', sa.Column('image_url', sa.String(length=1000), nullable=True))
    op.create_table(
        'forum_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['post_id'], ['forum_posts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_forum_comments_post_id'), 'forum_comments', ['post_id'])
    op.create_table(
        'forum_likes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['forum_posts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('post_id', 'user_id', name='uq_forum_likes_post_user'),
    )
    op.create_index(op.f('ix_forum_likes_post_id'), 'forum_likes', ['post_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_forum_likes_post_id'), table_name='forum_likes')
    op.drop_table('forum_likes')
    op.drop_index(op.f('ix_forum_comments_post_id'), table_name='forum_comments')
    op.drop_table('forum_comments')
    op.drop_column('forum_posts', 'image_url')
```

Then apply it:

```bash
alembic upgrade head
```

Expected: succeeds without error (adding a nullable column and creating brand-new tables — nothing to violate).

- [ ] **Step 5: Run the model tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_models.py -v
```

Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/app/domains/forum/models.py backend/tests/domains/forum/test_models.py backend/alembic/versions/
git commit -m "feat: add forum image column, comments table, and likes table"
```

---

## Task 2: Post response shape — author name, image, like count, comment count

**Files:**
- Modify: `backend/app/domains/forum/schemas.py`
- Modify: `backend/app/domains/forum/service.py`
- Modify: `backend/app/domains/forum/router.py`
- Modify: `backend/tests/domains/forum/test_service.py`
- Modify: `backend/tests/domains/forum/test_router.py`

**Interfaces:**
- Consumes: `ForumPost.image_url`, `ForumPost.author`, `ForumComment`, `ForumLike` from Task 1.
- Produces: `service.build_post_response(db, post, viewer_id) -> dict` (keys: `id, title, body, image_url, category, status, author_id, author_name, like_count, liked_by_me, comment_count, created_at, updated_at`) and `service.count_likes`, `service.user_has_liked`, `service.count_comments` — Tasks 3 and 4 call these same counting functions. Every router endpoint that returns a post now returns `build_post_response(...)`, not a raw ORM object.

- [ ] **Step 1: Write the failing service test**

Append to `backend/tests/domains/forum/test_service.py`:

```python
def test_build_post_response_includes_author_name_and_zeroed_counts(db_session):
    user = _make_user(db_session, "forum-svc-shape1@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)

    data = service.build_post_response(db_session, post, viewer_id=None)

    assert data["author_name"] == "Author"
    assert data["image_url"] is None
    assert data["like_count"] == 0
    assert data["liked_by_me"] is False
    assert data["comment_count"] == 0


def test_create_post_persists_an_image_url(db_session):
    user = _make_user(db_session, "forum-svc-shape2@example.com")
    post = service.create_post(
        db_session, user.id, VALID_POST.model_copy(update={"image_url": "https://example.com/a.jpg"})
    )
    assert post.image_url == "https://example.com/a.jpg"


def test_update_post_can_replace_the_image_url(db_session):
    user = _make_user(db_session, "forum-svc-shape3@example.com")
    post = service.create_post(
        db_session, user.id, VALID_POST.model_copy(update={"image_url": "https://example.com/old.jpg"})
    )
    updated = service.update_post(
        db_session, post.id, VALID_POST.model_copy(update={"image_url": "https://example.com/new.jpg"})
    )
    assert updated.image_url == "https://example.com/new.jpg"
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v -k "shape"
```

Expected: FAIL — `build_post_response` doesn't exist, `ForumPostCreate` has no `image_url`.

- [ ] **Step 3: Add `image_url` to the schemas**

In `backend/app/domains/forum/schemas.py`, add the field to `ForumPostCreate` (right after `category`) and to `ForumPostResponse`:

```python
class ForumPostCreate(CamelModel):
    title: str
    body: str
    category: str
    image_url: str | None = None

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Tiêu đề không được để trống")
        return stripped

    @field_validator("body")
    @classmethod
    def body_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Nội dung không được để trống")
        return stripped

    @field_validator("category")
    @classmethod
    def category_valid(cls, value: str) -> str:
        if value not in FORUM_CATEGORIES:
            raise ValueError("Chuyên mục không hợp lệ")
        return value


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
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 4: Wire `image_url` through `create_post`/`update_post` and add the response-building helpers**

In `backend/app/domains/forum/service.py`, update `create_post`/`update_post` and add the new helpers (add these below `can_view_post`, keep `create_post`/`update_post` where they are):

```python
def create_post(db: Session, author_id: int, data: ForumPostCreate) -> ForumPost:
    post = ForumPost(
        title=data.title,
        body=data.body,
        category=data.category,
        image_url=data.image_url,
        status="pending",
        author_id=author_id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def update_post(db: Session, post_id: int, data: ForumPostCreate) -> ForumPost | None:
    post = get_post(db, post_id)
    if post is None:
        return None
    post.title = data.title
    post.body = data.body
    post.category = data.category
    post.image_url = data.image_url
    post.status = "pending"
    db.commit()
    db.refresh(post)
    return post
```

Add near the bottom of the file:

```python
def count_likes(db: Session, post_id: int) -> int:
    return db.query(ForumLike).filter(ForumLike.post_id == post_id).count()


def user_has_liked(db: Session, post_id: int, user_id: int) -> bool:
    return (
        db.query(ForumLike).filter(ForumLike.post_id == post_id, ForumLike.user_id == user_id).first()
        is not None
    )


def count_comments(db: Session, post_id: int) -> int:
    return db.query(ForumComment).filter(ForumComment.post_id == post_id).count()


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
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    }
```

Update the top import line:

```python
from app.domains.forum.models import ForumComment, ForumLike, ForumPost, ForumReport
```

- [ ] **Step 5: Route every post-returning endpoint through `build_post_response`, and add `POST /forum/upload-url`**

Replace the whole of `backend/app/domains/forum/router.py` with:

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.blob_storage import blob_public_url, ensure_container, generate_upload_sas_url
from app.db.session import get_db
from app.deps import get_current_user, get_current_user_optional, require_admin
from app.domains.auth.models import User
from app.domains.forum import service
from app.domains.forum.schemas import (
    FORUM_CATEGORIES,
    ForumPostCreate,
    ForumPostResponse,
    ForumPostStatusUpdate,
    ForumReportCreate,
    ForumReportResponse,
)

router = APIRouter(prefix="/forum", tags=["forum"])


@router.post("/upload-url")
def get_upload_url(user: User = Depends(get_current_user)):
    ensure_container("forum")
    blob_path = f"{user.id}/{uuid.uuid4()}.jpg"
    upload_url = generate_upload_sas_url("forum", blob_path)
    return {"uploadUrl": upload_url, "blobPath": blob_path, "imageUrl": blob_public_url("forum", blob_path)}


@router.get("/posts", response_model=list[ForumPostResponse])
def list_posts(
    category: str | None = None,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    valid_category = category if category in FORUM_CATEGORIES else None
    posts = service.list_published_posts(db, valid_category)
    viewer_id = viewer.id if viewer else None
    return [service.build_post_response(db, post, viewer_id) for post in posts]


@router.post("/posts", response_model=ForumPostResponse, status_code=status.HTTP_201_CREATED)
def create_post(body: ForumPostCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = service.create_post(db, user.id, body)
    return service.build_post_response(db, post, user.id)


# Registered before /posts/{post_id} — a literal "mine" segment would
# otherwise be swallowed by the {post_id} path parameter.
@router.get("/posts/mine", response_model=list[ForumPostResponse])
def list_my_posts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    posts = service.list_posts_by_author(db, user.id)
    return [service.build_post_response(db, post, user.id) for post in posts]


@router.get("/posts/{post_id}", response_model=ForumPostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    post = service.get_post(db, post_id)
    viewer_id = viewer.id if viewer else None
    viewer_role = viewer.role if viewer else None
    if post is None or not service.can_view_post(post, viewer_id, viewer_role):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    return service.build_post_response(db, post, viewer_id)


@router.put("/posts/{post_id}", response_model=ForumPostResponse)
def update_post(
    post_id: int,
    body: ForumPostCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = service.get_post(db, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    if post.author_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền sửa bài này")
    updated = service.update_post(db, post_id, body)
    return service.build_post_response(db, updated, user.id)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = service.get_post(db, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    if post.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xóa bài này")
    service.delete_post(db, post_id)


@router.patch("/posts/{post_id}", response_model=ForumPostResponse)
def update_post_status(
    post_id: int,
    body: ForumPostStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    try:
        updated = service.set_post_status(db, post_id, body.status)
    except service.InvalidStatusTransitionError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="INVALID_STATUS_TRANSITION")
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    return service.build_post_response(db, updated, admin.id)


@router.post("/posts/{post_id}/report", response_model=ForumReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    post_id: int,
    body: ForumReportCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = service.get_post(db, post_id)
    if post is None or not service.can_view_post(post, user.id, user.role):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    return service.create_report(db, post_id, user.id, body.reason)


@router.get("/moderation/pending", response_model=list[ForumPostResponse])
def list_pending_posts(db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    posts = service.list_pending_posts(db)
    return [service.build_post_response(db, post, admin.id) for post in posts]


@router.get("/moderation/reports", response_model=list[ForumReportResponse])
def list_open_reports(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return service.list_open_reports(db)


@router.patch("/reports/{report_id}", response_model=ForumReportResponse)
def resolve_report(report_id: int, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    resolved = service.resolve_report(db, report_id)
    if resolved is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy báo cáo")
    return resolved
```

(Tasks 3 and 4 will append the like and comment endpoints below `create_report` / above `list_pending_posts` — the file above intentionally has no like/comment routes yet.)

- [ ] **Step 6: Run the service tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v
```

Expected: PASS (all tests, including the 3 new ones).

- [ ] **Step 7: Write the failing router tests**

Append to `backend/tests/domains/forum/test_router.py`:

```python
def test_upload_url_requires_authentication(client):
    assert client.post("/forum/upload-url").status_code == 401


def test_upload_url_returns_a_writable_sas_url_and_final_image_url(client):
    _register_and_login(client, "forum-upload@example.com")
    response = client.post("/forum/upload-url")
    assert response.status_code == 200
    body = response.json()
    assert "sig=" in body["uploadUrl"]
    assert body["blobPath"] in body["imageUrl"]


def test_create_post_accepts_an_optional_image_url(client):
    _register_and_login(client, "forum-image@example.com")
    response = client.post("/forum/posts", json={**VALID_BODY, "imageUrl": "https://example.com/a.jpg"})
    assert response.status_code == 201
    assert response.json()["imageUrl"] == "https://example.com/a.jpg"


def test_post_response_includes_author_name_and_zeroed_counts(client):
    _register_and_login(client, "forum-shape@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    assert post["authorName"] == "User"
    assert post["imageUrl"] is None
    assert post["likeCount"] == 0
    assert post["likedByMe"] is False
    assert post["commentCount"] == 0
```

- [ ] **Step 8: Run the router tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_router.py -v
```

Expected: PASS (all tests — including every pre-existing test, since the response shape change is additive).

- [ ] **Step 9: Commit**

```bash
git add backend/app/domains/forum/ backend/tests/domains/forum/test_service.py backend/tests/domains/forum/test_router.py
git commit -m "feat: attach images to forum posts and expose author/like/comment counts"
```

---

## Task 3: Like toggle

**Files:**
- Modify: `backend/app/domains/forum/schemas.py`
- Modify: `backend/app/domains/forum/service.py`
- Modify: `backend/app/domains/forum/router.py`
- Modify: `backend/tests/domains/forum/test_service.py`
- Modify: `backend/tests/domains/forum/test_router.py`

**Interfaces:**
- Consumes: `service.count_likes`, `ForumLike` from Task 2/1.
- Produces: `service.toggle_like(db, post_id, user_id) -> tuple[bool, int]` (liked, like_count) and `POST /forum/posts/{post_id}/like` returning `ForumLikeResponse {liked, like_count}`. No later task depends on this beyond the frontend.

- [ ] **Step 1: Write the failing service tests**

Append to `backend/tests/domains/forum/test_service.py`:

```python
def test_toggle_like_creates_then_removes_a_like(db_session):
    user = _make_user(db_session, "forum-svc-like1@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)

    liked, count = service.toggle_like(db_session, post.id, user.id)
    assert (liked, count) == (True, 1)

    liked, count = service.toggle_like(db_session, post.id, user.id)
    assert (liked, count) == (False, 0)


def test_toggle_like_counts_multiple_users_independently(db_session):
    user = _make_user(db_session, "forum-svc-like2@example.com")
    other = _make_user(db_session, "forum-svc-like3@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)

    service.toggle_like(db_session, post.id, user.id)
    liked, count = service.toggle_like(db_session, post.id, other.id)
    assert (liked, count) == (True, 2)
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v -k toggle_like
```

Expected: FAIL — `toggle_like` doesn't exist.

- [ ] **Step 3: Implement `toggle_like`**

Add to `backend/app/domains/forum/service.py` (near `count_likes`/`user_has_liked`):

```python
def toggle_like(db: Session, post_id: int, user_id: int) -> tuple[bool, int]:
    existing = (
        db.query(ForumLike).filter(ForumLike.post_id == post_id, ForumLike.user_id == user_id).first()
    )
    if existing is not None:
        db.delete(existing)
        db.commit()
        return False, count_likes(db, post_id)

    db.add(ForumLike(post_id=post_id, user_id=user_id))
    db.commit()
    return True, count_likes(db, post_id)
```

- [ ] **Step 4: Run the service tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v -k toggle_like
```

Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing router tests**

Append to `backend/tests/domains/forum/test_router.py`:

```python
def test_like_post_requires_authentication(client):
    assert client.post("/forum/posts/1/like").status_code == 401


def test_like_post_toggles_and_reflects_in_the_post_response(client, db_session):
    _register_and_login(client, "forum-like-owner@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])

    response = client.post(f"/forum/posts/{post['id']}/like")
    assert response.status_code == 200
    assert response.json() == {"liked": True, "likeCount": 1}

    fetched = client.get(f"/forum/posts/{post['id']}").json()
    assert fetched["likeCount"] == 1
    assert fetched["likedByMe"] is True

    response2 = client.post(f"/forum/posts/{post['id']}/like")
    assert response2.json() == {"liked": False, "likeCount": 0}


def test_like_post_returns_404_for_a_non_visible_post(client):
    _register_and_login(client, "forum-like-owner2@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-like-stranger@example.com")
    assert client.post(f"/forum/posts/{post['id']}/like").status_code == 404


def test_like_post_returns_404_for_a_nonexistent_post(client):
    _register_and_login(client, "forum-like-owner3@example.com")
    assert client.post("/forum/posts/999999/like").status_code == 404
```

- [ ] **Step 6: Add `ForumLikeResponse` and the router endpoint**

Add to `backend/app/domains/forum/schemas.py` (end of file):

```python
class ForumLikeResponse(CamelModel):
    liked: bool
    like_count: int
```

In `backend/app/domains/forum/router.py`, add the import and the endpoint (insert right after `create_report`, before `list_pending_posts`):

```python
from app.domains.forum.schemas import (
    FORUM_CATEGORIES,
    ForumLikeResponse,
    ForumPostCreate,
    ForumPostResponse,
    ForumPostStatusUpdate,
    ForumReportCreate,
    ForumReportResponse,
)
```

```python
@router.post("/posts/{post_id}/like", response_model=ForumLikeResponse)
def like_post(post_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = service.get_post(db, post_id)
    if post is None or not service.can_view_post(post, user.id, user.role):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    liked, like_count = service.toggle_like(db, post_id, user.id)
    return {"liked": liked, "like_count": like_count}
```

- [ ] **Step 7: Run the router tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_router.py -v -k like
```

Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add backend/app/domains/forum/ backend/tests/domains/forum/test_service.py backend/tests/domains/forum/test_router.py
git commit -m "feat: add toggleable likes to forum posts"
```

---

## Task 4: Comments — create, list, delete

**Files:**
- Modify: `backend/app/domains/forum/schemas.py`
- Modify: `backend/app/domains/forum/service.py`
- Modify: `backend/app/domains/forum/router.py`
- Modify: `backend/tests/domains/forum/test_service.py`
- Modify: `backend/tests/domains/forum/test_router.py`

**Interfaces:**
- Consumes: `ForumComment`, `service.count_comments` from Task 1/2.
- Produces: `service.create_comment(db, post_id, author_id, data: ForumCommentCreate) -> ForumComment`, `service.list_comments(db, post_id) -> list[ForumComment]`, `service.get_comment(db, comment_id) -> ForumComment | None`, `service.delete_comment(db, comment_id) -> bool`, `service.build_comment_response(comment, viewer_id, viewer_role) -> dict` (keys: `id, post_id, author_id, author_name, body, created_at, updated_at, can_delete`). `POST /forum/posts/{post_id}/comments`, `GET /forum/posts/{post_id}/comments`, `DELETE /forum/comments/{comment_id}`. Frontend Task 8 consumes this API directly.

- [ ] **Step 1: Write the failing service tests**

Update the existing `from app.domains.forum.schemas import ForumPostCreate` import line near the top of `backend/tests/domains/forum/test_service.py` to:

```python
from app.domains.forum.schemas import ForumCommentCreate, ForumPostCreate
```

Then append to the same file:

```python
def test_create_comment_persists_it(db_session):
    user = _make_user(db_session, "forum-svc-comment1@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)

    comment = service.create_comment(db_session, post.id, user.id, ForumCommentCreate(body="Đẹp quá!"))
    assert comment.id is not None
    assert comment.post_id == post.id
    assert comment.author_id == user.id


def test_list_comments_orders_oldest_first(db_session):
    user = _make_user(db_session, "forum-svc-comment2@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    first = service.create_comment(db_session, post.id, user.id, ForumCommentCreate(body="Đầu tiên"))
    second = service.create_comment(db_session, post.id, user.id, ForumCommentCreate(body="Thứ hai"))

    comments = service.list_comments(db_session, post.id)
    assert [c.id for c in comments] == [first.id, second.id]


def test_delete_comment_removes_it(db_session):
    user = _make_user(db_session, "forum-svc-comment3@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    comment = service.create_comment(db_session, post.id, user.id, ForumCommentCreate(body="Xoá tôi"))

    assert service.delete_comment(db_session, comment.id) is True
    assert service.get_comment(db_session, comment.id) is None
    assert service.delete_comment(db_session, comment.id) is False


def test_build_comment_response_allows_delete_for_the_author(db_session):
    user = _make_user(db_session, "forum-svc-comment4@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    comment = service.create_comment(db_session, post.id, user.id, ForumCommentCreate(body="Của tôi"))

    data = service.build_comment_response(comment, viewer_id=user.id, viewer_role="user")
    assert data["can_delete"] is True
    assert data["author_name"] == "Author"


def test_build_comment_response_allows_delete_for_an_admin(db_session):
    user = _make_user(db_session, "forum-svc-comment5@example.com")
    other = _make_user(db_session, "forum-svc-comment6@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    comment = service.create_comment(db_session, post.id, user.id, ForumCommentCreate(body="Của tôi"))

    data = service.build_comment_response(comment, viewer_id=other.id, viewer_role="admin")
    assert data["can_delete"] is True


def test_build_comment_response_forbids_delete_for_a_stranger(db_session):
    user = _make_user(db_session, "forum-svc-comment7@example.com")
    other = _make_user(db_session, "forum-svc-comment8@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    comment = service.create_comment(db_session, post.id, user.id, ForumCommentCreate(body="Của tôi"))

    data = service.build_comment_response(comment, viewer_id=other.id, viewer_role="user")
    assert data["can_delete"] is False
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v -k comment
```

Expected: FAIL — `ForumCommentCreate`, `create_comment`, etc. don't exist.

- [ ] **Step 3: Add `ForumCommentCreate`/`ForumCommentResponse` and the service functions**

Add to `backend/app/domains/forum/schemas.py` (end of file):

```python
class ForumCommentCreate(CamelModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Nội dung bình luận không được để trống")
        return stripped


class ForumCommentResponse(CamelModel):
    id: int
    post_id: int
    author_id: int
    author_name: str
    body: str
    created_at: datetime
    updated_at: datetime
    can_delete: bool
```

Add to `backend/app/domains/forum/service.py` (below `count_comments`):

```python
def create_comment(db: Session, post_id: int, author_id: int, data: ForumCommentCreate) -> ForumComment:
    comment = ForumComment(post_id=post_id, author_id=author_id, body=data.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


def list_comments(db: Session, post_id: int) -> list[ForumComment]:
    return db.query(ForumComment).filter(ForumComment.post_id == post_id).order_by(ForumComment.id.asc()).all()


def get_comment(db: Session, comment_id: int) -> ForumComment | None:
    return db.get(ForumComment, comment_id)


def delete_comment(db: Session, comment_id: int) -> bool:
    comment = get_comment(db, comment_id)
    if comment is None:
        return False
    db.delete(comment)
    db.commit()
    return True


def build_comment_response(comment: ForumComment, viewer_id: int | None, viewer_role: str | None) -> dict:
    can_delete = viewer_id is not None and (viewer_id == comment.author_id or viewer_role == "admin")
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "author_id": comment.author_id,
        "author_name": comment.author.name,
        "body": comment.body,
        "created_at": comment.created_at,
        "updated_at": comment.updated_at,
        "can_delete": can_delete,
    }
```

Update the top import line in `service.py` to include `ForumCommentCreate`:

```python
from app.domains.forum.schemas import ForumCommentCreate, ForumPostCreate
```

- [ ] **Step 4: Run the service tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/test_service.py -v -k comment
```

Expected: PASS (6 tests).

- [ ] **Step 5: Write the failing router tests**

Append to `backend/tests/domains/forum/test_router.py`:

```python
def test_create_comment_requires_authentication(client):
    assert client.post("/forum/posts/1/comments", json={"body": "Hay quá"}).status_code == 401


def test_create_comment_rejects_a_blank_body(client, db_session):
    _register_and_login(client, "forum-comment-owner@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])
    response = client.post(f"/forum/posts/{post['id']}/comments", json={"body": "   "})
    assert response.status_code == 422


def test_create_comment_succeeds_for_a_visible_post(client, db_session):
    _register_and_login(client, "forum-comment-owner2@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])

    _register_and_login(client, "forum-commenter@example.com")
    response = client.post(f"/forum/posts/{post['id']}/comments", json={"body": "Đẹp quá!"})
    assert response.status_code == 201
    body = response.json()
    assert body["body"] == "Đẹp quá!"
    assert body["authorName"] == "User"
    assert body["canDelete"] is True


def test_create_comment_returns_404_for_a_non_visible_post(client):
    _register_and_login(client, "forum-comment-owner3@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-commenter2@example.com")
    response = client.post(f"/forum/posts/{post['id']}/comments", json={"body": "Đẹp quá!"})
    assert response.status_code == 404


def test_list_comments_is_public_for_a_published_post(client, db_session):
    _register_and_login(client, "forum-comment-owner4@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])
    client.post(f"/forum/posts/{post['id']}/comments", json={"body": "Bình luận công khai"})

    response = client.get(f"/forum/posts/{post['id']}/comments")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["canDelete"] is False


def test_list_comments_returns_404_for_a_non_visible_post(client):
    _register_and_login(client, "forum-comment-owner5@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-commenter3@example.com")
    assert client.get(f"/forum/posts/{post['id']}/comments").status_code == 404


def test_post_response_comment_count_reflects_comments(client, db_session):
    _register_and_login(client, "forum-comment-owner6@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])
    client.post(f"/forum/posts/{post['id']}/comments", json={"body": "Một"})
    client.post(f"/forum/posts/{post['id']}/comments", json={"body": "Hai"})

    fetched = client.get(f"/forum/posts/{post['id']}").json()
    assert fetched["commentCount"] == 2


def test_delete_comment_requires_authentication(client):
    assert client.delete("/forum/comments/1").status_code == 401


def test_delete_comment_allowed_for_the_author(client, db_session):
    _register_and_login(client, "forum-comment-owner7@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])
    comment = client.post(f"/forum/posts/{post['id']}/comments", json={"body": "Xoá tôi"}).json()

    assert client.delete(f"/forum/comments/{comment['id']}").status_code == 204


def test_delete_comment_allowed_for_an_admin(client, db_session):
    _register_and_login(client, "forum-comment-owner8@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])

    _register_and_login(client, "forum-commenter4@example.com")
    comment = client.post(f"/forum/posts/{post['id']}/comments", json={"body": "Của người khác"}).json()

    _register_and_login(client, "forum-comment-admin@example.com")
    _promote_to_admin_and_relogin(client, db_session, "forum-comment-admin@example.com")
    assert client.delete(f"/forum/comments/{comment['id']}").status_code == 204


def test_delete_comment_forbidden_for_a_stranger(client, db_session):
    _register_and_login(client, "forum-comment-owner9@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])
    comment = client.post(f"/forum/posts/{post['id']}/comments", json={"body": "Của tôi"}).json()

    _register_and_login(client, "forum-comment-stranger@example.com")
    assert client.delete(f"/forum/comments/{comment['id']}").status_code == 403


def test_delete_comment_returns_404_when_missing(client):
    _register_and_login(client, "forum-comment-owner10@example.com")
    assert client.delete("/forum/comments/999999").status_code == 404
```

- [ ] **Step 6: Add the comment endpoints to the router**

Update the schemas import in `backend/app/domains/forum/router.py`:

```python
from app.domains.forum.schemas import (
    FORUM_CATEGORIES,
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

Add these endpoints right after `like_post` (still before `list_pending_posts`):

```python
@router.post("/posts/{post_id}/comments", response_model=ForumCommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    body: ForumCommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    post = service.get_post(db, post_id)
    if post is None or not service.can_view_post(post, user.id, user.role):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    comment = service.create_comment(db, post_id, user.id, body)
    return service.build_comment_response(comment, user.id, user.role)


@router.get("/posts/{post_id}/comments", response_model=list[ForumCommentResponse])
def list_comments(
    post_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    post = service.get_post(db, post_id)
    viewer_id = viewer.id if viewer else None
    viewer_role = viewer.role if viewer else None
    if post is None or not service.can_view_post(post, viewer_id, viewer_role):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    comments = service.list_comments(db, post_id)
    return [service.build_comment_response(c, viewer_id, viewer_role) for c in comments]


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    comment = service.get_comment(db, comment_id)
    if comment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bình luận")
    if comment.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xóa bình luận này")
    service.delete_comment(db, comment_id)
```

- [ ] **Step 7: Run the full forum backend test suite to verify everything passes**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/forum/ -v
```

Expected: PASS (every test in `test_models.py`, `test_service.py`, `test_router.py`).

- [ ] **Step 8: Commit**

```bash
git add backend/app/domains/forum/ backend/tests/domains/forum/test_service.py backend/tests/domains/forum/test_router.py
git commit -m "feat: add comments to forum posts"
```

---

## Task 5: Frontend types, stale-fixture fixes, and the image picker

**Files:**
- Modify: `frontend/lib/forum.ts`
- Modify: `frontend/components/forum/ForumPostForm.tsx`
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/forum/ForumPostForm.test.tsx`
- Modify: `frontend/components/forum/ForumPostList.test.tsx` (fixture fields only)
- Modify: `frontend/components/forum/MyForumPostList.test.tsx` (fixture fields only)
- Modify: `frontend/components/forum/ForumPostDetail.test.tsx` (fixture fields only)
- Modify: `frontend/app/forum/[id]/page.test.tsx` (fixture fields only)
- Modify: `frontend/app/forum/[id]/edit/page.test.tsx` (fixture fields only)
- Modify: `frontend/components/admin/ForumModerationQueue.test.tsx` (fixture fields only)

**Interfaces:**
- Consumes: `POST /forum/upload-url` (Task 2), `ForumPostCreate.image_url`/`ForumPostResponse.image_url` (Task 2).
- Produces: `ForumPost` type gains `imageUrl: string | null`, `authorName: string`, `likeCount: number`, `likedByMe: boolean`, `commentCount: number` — every later frontend task builds on this shape.

- [ ] **Step 1: Write the failing test for the image picker**

Append to `frontend/components/forum/ForumPostForm.test.tsx` (add `type ChangeEvent` is not needed here — this is the test file). First add a small helper at the top of the file, right after the existing imports:

```tsx
function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}
```

Then add the test itself inside the `describe('ForumPostForm', ...)` block:

```tsx
it('uploads a picked image and submits its resolved URL', async () => {
  const putMock = vi.fn().mockResolvedValue(jsonResponse({}))
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') return putMock(url, init)
      if (url === '/forum/upload-url') {
        return Promise.resolve(
          jsonResponse({
            uploadUrl: 'https://blob.example.com/upload?sig=abc',
            blobPath: 'u1/x.jpg',
            imageUrl: 'https://blob.example.com/u1/x.jpg',
          })
        )
      }
      if (url === '/forum/posts') return Promise.resolve(jsonResponse({ id: 1 }, { status: 201 }))
      return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
    })
  )
  renderWithIntl(<ForumPostForm />)

  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài mới' } })
  fireEvent.change(screen.getByLabelText('Nội dung'), { target: { value: 'Nội dung mới' } })
  const file = new File(['fake'], 'outfit.jpg', { type: 'image/jpeg' })
  fireEvent.change(screen.getByLabelText('Hình ảnh (không bắt buộc)'), { target: { files: [file] } })

  await waitFor(() =>
    expect(putMock).toHaveBeenCalledWith(
      'https://blob.example.com/upload?sig=abc',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': 'image/jpeg' },
      })
    )
  )

  fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))

  await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/forum/my-posts'))
  expect(fetch).toHaveBeenCalledWith(
    '/forum/posts',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        title: 'Bài mới',
        body: 'Nội dung mới',
        category: 'general',
        imageUrl: 'https://blob.example.com/u1/x.jpg',
      }),
    })
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd frontend && npx vitest run components/forum/ForumPostForm.test.tsx
```

Expected: FAIL — there is no `"Hình ảnh (không bắt buộc)"` labeled input yet.

- [ ] **Step 3: Update the shared forum types**

Replace the `ForumPost`/`ForumPostInput` types in `frontend/lib/forum.ts`:

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
  createdAt: string
  updatedAt: string
}

export type ForumPostInput = {
  title: string
  body: string
  category: ForumCategory
  imageUrl: string | null
}
```

- [ ] **Step 4: Fix the now-stale `ForumPost` fixtures in the other frontend test files**

These files construct literal `ForumPost` objects that are now missing the new required fields. Add the same five fields to each (values chosen per file below); no other change is needed in these files for this task.

In `frontend/components/forum/ForumPostList.test.tsx`, replace the `POSTS` array entry:

```ts
const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài công khai',
    body: 'Nội dung',
    imageUrl: null,
    category: 'styling-help',
    status: 'published',
    authorId: 1,
    authorName: 'Tác giả',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]
```

In `frontend/components/forum/MyForumPostList.test.tsx`, replace the `POSTS` array entry:

```ts
const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài của tôi',
    body: 'Nội dung',
    imageUrl: null,
    category: 'general',
    status: 'pending',
    authorId: 5,
    authorName: 'Tôi',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]
```

In `frontend/components/forum/ForumPostDetail.test.tsx`, replace the `POST` object:

```ts
const POST: ForumPost = {
  id: 9,
  title: 'Bài chi tiết',
  body: 'Nội dung chi tiết',
  imageUrl: null,
  category: 'general',
  status: 'published',
  authorId: 1,
  authorName: 'Tác giả',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
```

In `frontend/app/forum/[id]/page.test.tsx`, replace the `POST` object:

```ts
const POST: ForumPost = {
  id: 4,
  title: 'Bài test route',
  body: 'Nội dung',
  imageUrl: null,
  category: 'general',
  status: 'published',
  authorId: 1,
  authorName: 'Tác giả',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
```

In `frontend/app/forum/[id]/edit/page.test.tsx`, replace the `POST` object:

```ts
const POST: ForumPost = {
  id: 3,
  title: 'Bài cần sửa',
  body: 'Nội dung cần sửa',
  imageUrl: null,
  category: 'general',
  status: 'pending',
  authorId: 1,
  authorName: 'Tác giả',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
```

In `frontend/components/admin/ForumModerationQueue.test.tsx`, replace the `POSTS` array entry:

```ts
const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài chờ duyệt',
    body: 'Nội dung',
    imageUrl: null,
    category: 'general',
    status: 'pending',
    authorId: 5,
    authorName: 'Tác giả',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]
```

- [ ] **Step 5: Add the image-field translations**

In `frontend/messages/vi.json`, replace the `PostForm` object under `Forum` with:

```json
"PostForm": {
  "fields": {
    "title": "Tiêu đề",
    "category": "Chuyên mục",
    "body": "Nội dung",
    "image": "Hình ảnh (không bắt buộc)"
  },
  "imageUploading": "Đang tải ảnh lên...",
  "imageUploadError": "Tải ảnh lên thất bại, vui lòng thử lại.",
  "removeImageButton": "Xóa ảnh",
  "submitCreate": "Đăng bài",
  "submitEdit": "Lưu thay đổi",
  "unauthorizedError": "Bạn không có quyền thực hiện thao tác này.",
  "genericError": "Có lỗi xảy ra, vui lòng thử lại."
},
```

- [ ] **Step 6: Add the image picker to `ForumPostForm.tsx`**

Replace the full contents of `frontend/components/forum/ForumPostForm.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { FORUM_CATEGORIES, type ForumCategory, type ForumPost } from '@/lib/forum'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function ForumPostForm({ initialPost }: { initialPost?: ForumPost }) {
  const t = useTranslations('Forum')
  const router = useRouter()
  const isEditing = Boolean(initialPost)

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [category, setCategory] = useState<ForumCategory>(initialPost?.category ?? FORUM_CATEGORIES[0])
  const [body, setBody] = useState(initialPost?.body ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(initialPost?.imageUrl ?? null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setErrors((current) => ({ ...current, image: '' }))

    const uploadUrlResponse = await apiFetch('/forum/upload-url', { method: 'POST' })
    if (!uploadUrlResponse.ok) {
      setUploadingImage(false)
      setErrors((current) => ({ ...current, image: t('PostForm.imageUploadError') }))
      return
    }
    const { uploadUrl, imageUrl: resolvedUrl } = (await uploadUrlResponse.json()) as {
      uploadUrl: string
      blobPath: string
      imageUrl: string
    }

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': file.type },
      body: file,
    })
    setUploadingImage(false)
    if (!putResponse.ok) {
      setErrors((current) => ({ ...current, image: t('PostForm.imageUploadError') }))
      return
    }
    setImageUrl(resolvedUrl)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const requestBody = { title, body, category, imageUrl }

    const response = await apiFetch(isEditing ? `/forum/posts/${initialPost!.id}` : '/forum/posts', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    setSubmitting(false)

    if (response.status === 401 || response.status === 403) {
      setErrors({ form: t('PostForm.unauthorizedError') })
      return
    }

    if (!response.ok) {
      setErrors({ form: t('PostForm.genericError') })
      return
    }

    router.push('/forum/my-posts')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="forum-title" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.title')}
        </label>
        <input
          id="forum-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClass}
        />
        {errors.title && <p className="text-label-sm text-error">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="forum-category" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.category')}
        </label>
        <select
          id="forum-category"
          value={category}
          onChange={(event) => setCategory(event.target.value as ForumCategory)}
          className={inputClass}
        >
          {FORUM_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {t(`categories.${value}`)}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-label-sm text-error">{errors.category}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="forum-body" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.body')}
        </label>
        <textarea
          id="forum-body"
          rows={8}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className={inputClass}
        />
        {errors.body && <p className="text-label-sm text-error">{errors.body}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="forum-image" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.image')}
        </label>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-40 w-40 rounded-xl object-cover" />
        )}
        <input
          id="forum-image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={uploadingImage}
        />
        {uploadingImage && <p className="text-label-sm text-on-surface-variant">{t('PostForm.imageUploading')}</p>}
        {imageUrl && !uploadingImage && (
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="text-label-sm font-semibold text-error hover:underline"
          >
            {t('PostForm.removeImageButton')}
          </button>
        )}
        {errors.image && (
          <p role="alert" className="text-label-sm text-error">
            {errors.image}
          </p>
        )}
      </div>

      {errors.form && <p className="text-label-sm text-error">{errors.form}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
      >
        {isEditing ? t('PostForm.submitEdit') : t('PostForm.submitCreate')}
      </button>
    </form>
  )
}
```

- [ ] **Step 7: Run the forum frontend tests to verify they pass**

```bash
cd frontend && npx vitest run components/forum/ components/admin/ForumModerationQueue.test.tsx app/forum/
```

Expected: PASS (all tests, including the new upload test and every fixed fixture).

- [ ] **Step 8: Commit**

```bash
git add frontend/lib/forum.ts frontend/components/forum/ frontend/components/admin/ForumModerationQueue.test.tsx frontend/app/forum/ frontend/messages/vi.json
git commit -m "feat: add optional image upload to forum posts"
```

---

## Task 6: Post list metadata — thumbnail, author, counts

**Files:**
- Modify: `frontend/components/forum/ForumPostList.tsx`
- Modify: `frontend/components/forum/MyForumPostList.tsx`
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/forum/ForumPostList.test.tsx`
- Modify: `frontend/components/forum/MyForumPostList.test.tsx`

**Interfaces:**
- Consumes: `ForumPost.imageUrl`/`authorName`/`likeCount`/`commentCount` from Task 5.
- Produces: nothing new consumed by later tasks (this is a leaf display task).

- [ ] **Step 1: Write the failing tests**

In `frontend/components/forum/ForumPostList.test.tsx`, update the `POSTS` fixture to carry real values and add a new test. First, update the fixture's new fields:

```ts
const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài công khai',
    body: 'Nội dung',
    imageUrl: 'https://example.com/outfit.jpg',
    category: 'styling-help',
    status: 'published',
    authorId: 1,
    authorName: 'Lan Anh',
    likeCount: 3,
    likedByMe: false,
    commentCount: 2,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]
```

Add this test inside the `describe` block:

```tsx
it('shows the thumbnail, author, and counts for a post', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
  renderWithIntl(<ForumPostList />)

  await waitFor(() => expect(screen.getByText('Bài công khai')).toBeInTheDocument())
  expect(screen.getByText(/Lan Anh/)).toBeInTheDocument()
  expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.com/outfit.jpg')
  expect(screen.getByText('3 lượt thích · 2 bình luận')).toBeInTheDocument()
})
```

In `frontend/components/forum/MyForumPostList.test.tsx`, update the fixture and add a thumbnail test:

```ts
const POSTS: ForumPost[] = [
  {
    id: 1,
    title: 'Bài của tôi',
    body: 'Nội dung',
    imageUrl: 'https://example.com/mine.jpg',
    category: 'general',
    status: 'pending',
    authorId: 5,
    authorName: 'Tôi',
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]
```

```tsx
it('shows a thumbnail when the post has an image', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
  renderWithIntl(<MyForumPostList />)

  await waitFor(() => expect(screen.getByText('Bài của tôi')).toBeInTheDocument())
  expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.com/mine.jpg')
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/forum/ForumPostList.test.tsx components/forum/MyForumPostList.test.tsx
```

Expected: FAIL — the two new tests fail (no thumbnail/author/counts rendered yet); every other test in these files still passes.

- [ ] **Step 3: Update `ForumPostList.tsx`**

Replace the `<li>` block inside the `posts.map(...)` in `frontend/components/forum/ForumPostList.tsx`:

```tsx
{posts.map((post) => (
  <li key={post.id} className="flex gap-space-md rounded-2xl border border-outline-variant p-space-lg">
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
  </li>
))}
```

- [ ] **Step 4: Update `MyForumPostList.tsx`**

Replace the `<li>` block inside the `posts.map(...)` in `frontend/components/forum/MyForumPostList.tsx`:

```tsx
{posts.map((post) => (
  <li key={post.id} className="flex gap-space-md rounded-2xl border border-outline-variant p-space-lg">
    {post.imageUrl && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={post.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
    )}
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-space-md">
        <h2 className="min-w-0 flex-1 text-headline-sm font-semibold text-on-surface">{post.title}</h2>
        <span className="shrink-0 rounded-full bg-surface-container px-space-md py-space-xs text-label-sm text-on-surface-variant">
          {t(`MyPosts.status.${post.status}`)}
        </span>
      </div>
      <div className="mt-space-sm flex gap-space-md">
        <Link href={`/forum/${post.id}/edit`} className="font-semibold text-primary hover:underline">
          {t('MyPosts.editButton')}
        </Link>
        <button
          type="button"
          onClick={() => handleDelete(post.id)}
          className="font-semibold text-error hover:underline"
        >
          {t('MyPosts.deleteButton')}
        </button>
      </div>
    </div>
  </li>
))}
```

- [ ] **Step 5: Add the `commentsLabel` translation**

In `frontend/messages/vi.json`, add `"commentsLabel": "bình luận"` to the `Forum.Public` object:

```json
"Public": {
  "title": "Diễn đàn TwistFit",
  "subtitle": "Nơi chia sẻ và xin tư vấn phối đồ cùng cộng đồng TwistFit.",
  "loading": "Đang tải...",
  "emptyState": "Chưa có bài viết nào trong chuyên mục này.",
  "likesLabel": "lượt thích",
  "commentsLabel": "bình luận"
},
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/forum/ForumPostList.test.tsx components/forum/MyForumPostList.test.tsx
```

Expected: PASS (all tests in both files).

- [ ] **Step 7: Commit**

```bash
git add frontend/components/forum/ForumPostList.tsx frontend/components/forum/MyForumPostList.tsx frontend/components/forum/ForumPostList.test.tsx frontend/components/forum/MyForumPostList.test.tsx frontend/messages/vi.json
git commit -m "feat: show thumbnail, author, and like/comment counts in forum post lists"
```

---

## Task 7: Post detail — image, author, and the like button

**Files:**
- Modify: `frontend/components/forum/ForumPostDetail.tsx`
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/forum/ForumPostDetail.test.tsx`

**Interfaces:**
- Consumes: `POST /forum/posts/{id}/like` (Task 3), `ForumPost.imageUrl`/`authorName`/`likeCount`/`likedByMe` (Task 5).
- Produces: nothing new consumed by later tasks (Task 8 adds a sibling section to the same component but doesn't depend on this task's internals beyond the existing `post` state).

- [ ] **Step 1: Write the failing tests**

In `frontend/components/forum/ForumPostDetail.test.tsx`, update the `POST` fixture:

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
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
```

Add these tests inside the `describe` block:

```tsx
it('renders the image and author name', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
  renderDetail()
  await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
  expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.com/outfit.jpg')
  expect(screen.getByText('Lan Anh')).toBeInTheDocument()
})

it('does not show a like button when signed out', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
  renderDetail()
  await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
  expect(screen.queryByRole('button', { name: /Thích/ })).not.toBeInTheDocument()
})

it('lets a signed-in user toggle the like button', async () => {
  window.localStorage.setItem(
    'twistfit.auth',
    JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
  )
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
  renderDetail()
  await waitFor(() => expect(screen.getByText('Bài chi tiết')).toBeInTheDocument())
  expect(screen.getByRole('button', { name: /Thích \(2\)/ })).toHaveAttribute('aria-pressed', 'false')

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ liked: true, likeCount: 3 }) })
  )
  fireEvent.click(screen.getByRole('button', { name: /Thích \(2\)/ }))

  await waitFor(() => expect(screen.getByRole('button', { name: /Đã thích \(3\)/ })).toBeInTheDocument())
  expect(screen.getByRole('button', { name: /Đã thích \(3\)/ })).toHaveAttribute('aria-pressed', 'true')
  expect(fetch).toHaveBeenCalledWith(
    '/forum/posts/9/like',
    expect.objectContaining({ method: 'POST', credentials: 'include' })
  )
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx
```

Expected: FAIL — no image, no author name, no like button rendered yet.

- [ ] **Step 3: Add the like translations**

In `frontend/messages/vi.json`, add a `Like` object to `Forum` (insert it right after `Report`):

```json
"Like": {
  "likeButton": "Thích ({count})",
  "likedButton": "Đã thích ({count})"
},
```

- [ ] **Step 4: Update `ForumPostDetail.tsx`**

Replace the full contents of `frontend/components/forum/ForumPostDetail.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { apiFetch } from '@/lib/apiClient'
import type { ForumPost } from '@/lib/forum'

export default function ForumPostDetail({ id }: { id: string }) {
  const t = useTranslations('Forum')
  const { user } = useAuth()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reason, setReason] = useState('')
  const [reportMessage, setReportMessage] = useState<string | null>(null)

  useEffect(() => {
    apiFetch(`/forum/posts/${id}`).then((response) => {
      if (!response.ok) {
        setNotFound(true)
        return
      }
      response.json().then(setPost)
    })
  }, [id])

  async function handleSubmitReport() {
    const response = await apiFetch(`/forum/posts/${id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (!response.ok) {
      setReportMessage(t('Report.genericError'))
      return
    }
    setReportMessage(t('Report.successMessage'))
    setShowReportForm(false)
    setReason('')
  }

  async function handleToggleLike() {
    const response = await apiFetch(`/forum/posts/${id}/like`, { method: 'POST' })
    if (!response.ok || !post) return
    const { liked, likeCount } = (await response.json()) as { liked: boolean; likeCount: number }
    setPost({ ...post, likedByMe: liked, likeCount })
  }

  return (
    <article className="mx-auto max-w-3xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
      <Link href="/forum" className="text-label-md font-semibold text-primary hover:underline">
        {t('Detail.backLink')}
      </Link>
      {notFound && (
        <div className="mt-space-lg">
          <h1 className="text-headline-md font-bold text-on-surface">{t('Detail.notFoundTitle')}</h1>
          <p className="mt-space-xs text-body-md text-on-surface-variant">{t('Detail.notFoundBody')}</p>
        </div>
      )}
      {post && (
        <>
          <h1 className="mt-space-md text-headline-lg font-bold text-on-surface">{post.title}</h1>
          <p className="mt-space-xs text-label-sm text-on-surface-variant">{post.authorName}</p>
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="mt-space-md aspect-[4/3] w-full rounded-2xl object-cover"
            />
          )}
          <p className="mt-space-md whitespace-pre-wrap text-body-md text-on-surface">{post.body}</p>

          {user && (
            <button
              type="button"
              onClick={handleToggleLike}
              aria-pressed={post.likedByMe}
              className={`mt-space-md inline-flex items-center gap-1 rounded-full px-space-lg py-space-sm text-label-md font-semibold transition-colors ${
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
          )}

          {user && (
            <div className="mt-space-lg">
              {!showReportForm && !reportMessage && (
                <button
                  type="button"
                  onClick={() => setShowReportForm(true)}
                  className="text-label-sm font-semibold text-on-surface-variant hover:underline"
                >
                  {t('Report.reportButton')}
                </button>
              )}
              {showReportForm && (
                <div className="space-y-2">
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t('Report.reasonPlaceholder')}
                    rows={3}
                    className="w-full rounded-xl bg-surface-container px-4 py-3 text-body-sm text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    disabled={!reason.trim()}
                    className="rounded-full bg-primary px-6 py-2 text-label-md text-on-primary disabled:opacity-60"
                  >
                    {t('Report.submitButton')}
                  </button>
                </div>
              )}
              {reportMessage && <p className="text-label-sm text-on-surface-variant">{reportMessage}</p>}
            </div>
          )}
        </>
      )}
    </article>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx
```

Expected: PASS (all tests, including the 3 new ones).

- [ ] **Step 6: Commit**

```bash
git add frontend/components/forum/ForumPostDetail.tsx frontend/components/forum/ForumPostDetail.test.tsx frontend/messages/vi.json
git commit -m "feat: show forum post image, author, and a like button"
```

---

## Task 8: Post detail — comments

**Files:**
- Modify: `frontend/lib/forum.ts`
- Modify: `frontend/components/forum/ForumPostDetail.tsx`
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/forum/ForumPostDetail.test.tsx`

**Interfaces:**
- Consumes: `POST/GET /forum/posts/{id}/comments`, `DELETE /forum/comments/{id}` (Task 4).
- Produces: `ForumComment` type — final piece of this sub-project's frontend surface.

- [ ] **Step 1: Add the `ForumComment` type**

Append to `frontend/lib/forum.ts`:

```ts
export type ForumComment = {
  id: number
  postId: number
  authorId: number
  authorName: string
  body: string
  createdAt: string
  updatedAt: string
  canDelete: boolean
}
```

- [ ] **Step 2: Write the failing tests**

Add this helper near the top of `frontend/components/forum/ForumPostDetail.test.tsx` (alongside the existing `renderDetail` function) and a `COMMENTS` fixture:

```ts
import type { ForumComment } from '@/lib/forum'

const COMMENTS: ForumComment[] = [
  {
    id: 1,
    postId: 9,
    authorId: 2,
    authorName: 'Minh',
    body: 'Phối đồ đẹp quá!',
    createdAt: '2026-01-02',
    updatedAt: '2026-01-02',
    canDelete: false,
  },
]

function stubForumFetches(comments: ForumComment[] = COMMENTS) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (url === '/forum/posts/9') return Promise.resolve({ ok: true, json: async () => POST })
      if (url === '/forum/posts/9/comments' && (!init || init.method === undefined)) {
        return Promise.resolve({ ok: true, json: async () => comments })
      }
      return Promise.resolve({ ok: true, json: async () => ({}) })
    })
  )
}
```

Add these tests inside the `describe` block:

```tsx
it('fetches and renders the comment list', async () => {
  stubForumFetches()
  renderDetail()
  await waitFor(() => expect(screen.getByText('Phối đồ đẹp quá!')).toBeInTheDocument())
  expect(screen.getByText('Minh')).toBeInTheDocument()
})

it('does not show a comment composer when signed out', async () => {
  stubForumFetches()
  renderDetail()
  await waitFor(() => expect(screen.getByText('Phối đồ đẹp quá!')).toBeInTheDocument())
  expect(screen.queryByPlaceholderText('Viết bình luận...')).not.toBeInTheDocument()
})

it('lets a signed-in user post a comment', async () => {
  window.localStorage.setItem(
    'twistfit.auth',
    JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
  )
  stubForumFetches()
  renderDetail()
  await waitFor(() => expect(screen.getByText('Phối đồ đẹp quá!')).toBeInTheDocument())

  fireEvent.change(screen.getByPlaceholderText('Viết bình luận...'), { target: { value: 'Đẹp!' } })

  const newComment: ForumComment = {
    id: 2,
    postId: 9,
    authorId: 3,
    authorName: 'Người dùng Test',
    body: 'Đẹp!',
    createdAt: '2026-01-03',
    updatedAt: '2026-01-03',
    canDelete: true,
  }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => newComment }))
  fireEvent.click(screen.getByRole('button', { name: 'Gửi bình luận' }))

  await waitFor(() => expect(screen.getByText('Đẹp!')).toBeInTheDocument())
  expect(fetch).toHaveBeenCalledWith(
    '/forum/posts/9/comments',
    expect.objectContaining({ method: 'POST', credentials: 'include', body: JSON.stringify({ body: 'Đẹp!' }) })
  )
})

it('shows a delete button only for deletable comments and removes it on click', async () => {
  const deletableComment: ForumComment = { ...COMMENTS[0], canDelete: true }
  stubForumFetches([deletableComment])
  window.localStorage.setItem(
    'twistfit.auth',
    JSON.stringify({ name: 'Người dùng Test', email: 'user@twistfit.vn', role: 'user' })
  )
  renderDetail()
  await waitFor(() => expect(screen.getByText('Phối đồ đẹp quá!')).toBeInTheDocument())

  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => ({}) }))
  fireEvent.click(screen.getByRole('button', { name: 'Xóa bình luận' }))

  await waitFor(() => expect(screen.queryByText('Phối đồ đẹp quá!')).not.toBeInTheDocument())
  expect(fetch).toHaveBeenCalledWith(
    '/forum/comments/1',
    expect.objectContaining({ method: 'DELETE', credentials: 'include' })
  )
})
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx
```

Expected: FAIL — no comment list, composer, or delete button rendered yet. (The pre-existing tests that stub a single generic `fetch` mock will still pass once the component is updated in Step 5, since `GET /forum/posts/9/comments` resolves to whatever that mock returns and the component tolerates an empty/whatever list — this is confirmed in Step 6 below.)

- [ ] **Step 4: Add the comment translations**

In `frontend/messages/vi.json`, add a `Comments` object to `Forum` (insert it right after `Like`):

```json
"Comments": {
  "title": "Bình luận",
  "placeholder": "Viết bình luận...",
  "submitButton": "Gửi bình luận",
  "deleteButton": "Xóa bình luận",
  "emptyState": "Chưa có bình luận nào."
},
```

- [ ] **Step 5: Add the comment list, composer, and delete button to `ForumPostDetail.tsx`**

Update the imports and add comment state/handlers in `frontend/components/forum/ForumPostDetail.tsx`:

```tsx
import type { ForumComment, ForumPost } from '@/lib/forum'
```

Add state and effects right after the existing `reportMessage` state:

```tsx
  const [comments, setComments] = useState<ForumComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    apiFetch(`/forum/posts/${id}/comments`)
      .then((response) => (response.ok ? response.json() : []))
      .then(setComments)
  }, [id])
```

Add a submit handler right after `handleToggleLike`:

```tsx
  async function handleSubmitComment() {
    setSubmittingComment(true)
    const response = await apiFetch(`/forum/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newComment }),
    })
    setSubmittingComment(false)
    if (!response.ok) return
    const comment = (await response.json()) as ForumComment
    setComments((current) => [...current, comment])
    setNewComment('')
  }

  async function handleDeleteComment(commentId: number) {
    const response = await apiFetch(`/forum/comments/${commentId}`, { method: 'DELETE' })
    if (!response.ok) return
    setComments((current) => current.filter((comment) => comment.id !== commentId))
  }
```

Add the comment section at the end of the `{post && (...)}` block, right after the report `<div>`:

```tsx
          <div className="mt-space-xl">
            <h2 className="text-headline-sm font-semibold text-on-surface">{t('Comments.title')}</h2>
            {comments.length === 0 && (
              <p className="mt-space-sm text-body-sm text-on-surface-variant">{t('Comments.emptyState')}</p>
            )}
            <ul className="mt-space-sm space-y-space-sm">
              {comments.map((comment) => (
                <li key={comment.id} className="rounded-xl bg-surface-container p-space-sm">
                  <p className="text-label-sm font-semibold text-on-surface">{comment.authorName}</p>
                  <p className="text-body-sm text-on-surface">{comment.body}</p>
                  {comment.canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="mt-1 text-label-sm font-semibold text-error hover:underline"
                    >
                      {t('Comments.deleteButton')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {user && (
              <div className="mt-space-md space-y-2">
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder={t('Comments.placeholder')}
                  rows={2}
                  className="w-full rounded-xl bg-surface-container px-4 py-3 text-body-sm text-on-surface"
                />
                <button
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="rounded-full bg-primary px-6 py-2 text-label-md text-on-primary disabled:opacity-60"
                >
                  {t('Comments.submitButton')}
                </button>
              </div>
            )}
          </div>
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx
```

Expected: PASS (all tests, including the 4 new ones). The pre-existing tests still pass because they now also trigger a `GET /forum/posts/9/comments` call that resolves via the same generic mock (returning the post object as the comments payload is tolerated — `.then((response) => (response.ok ? response.json() : []))` just sets whatever comes back; none of those tests assert on the comment list).

- [ ] **Step 7: Commit**

```bash
git add frontend/lib/forum.ts frontend/components/forum/ForumPostDetail.tsx frontend/components/forum/ForumPostDetail.test.tsx frontend/messages/vi.json
git commit -m "feat: add comments to forum post detail page"
```

---

## Task 9: Final integration

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

Expected: no errors. If any remain (e.g. a `ForumPost` or `ForumComment` literal in a file not listed in this plan), fix them the same way as Task 5 Step 4 — add the missing fields with sensible values — and re-run.

- [ ] **Step 4: Manual smoke test**

Start both dev servers (backend `uvicorn app.main:app --reload`, frontend `npm run dev`, Azurite running locally per `backend/README.md`) and, as a logged-in user:
1. Create a forum post with an image attached at `/forum/new`; confirm the thumbnail appears at `/forum/my-posts`.
2. Have an admin approve it via `/admin/forum`.
3. Open the post at `/forum/{id}`, click the like button, confirm the count updates and the button switches to "Đã thích".
4. Post a comment, confirm it appears immediately without needing approval.
5. Delete your own comment, confirm it disappears.

Report the outcome; fix any issue found before considering this sub-project done.

- [ ] **Step 5: Invoke `finishing-a-development-branch`**

Announce: "I'm using the finishing-a-development-branch skill to complete this work." and follow that skill (verify tests, present the merge/PR/keep-as-is menu, act on the choice) for both the `frontend` (branch `master`) and `backend` (branch `main`) repos.
