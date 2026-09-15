# Forum: Bookmark ("Đã lưu") — Design

## Context

Continuing the forum audit from the earlier "image + like + comment" sub-project: the homepage still promises a capability that doesn't exist — "Tạo các bộ sưu tập riêng và lưu lại những bài đăng ấn tượng để mở ra tham khảo bất cứ khi nào cần lên đồ" (`frontend/messages/vi.json`, the `FeatureShowcase` "save" step, lines ~521-523). This spec covers building that capability: a per-user "save this post for later" bookmark, plus a page to browse saved posts.

## Current State (for context)

- No bookmark/save concept exists anywhere in `backend/app/domains/forum/` or the frontend forum components.
- `ForumLike` (added in the prior sub-project) is the closest existing pattern: a `(post_id, user_id)` unique-constrained table, a toggle endpoint, and a `liked_by_me`/`like_count` pair computed per-request in `service.build_post_response`. Bookmarks follow this exact shape.
- `service.build_post_response(db, post, viewer_id)` already assembles the full per-viewer `ForumPostResponse` dict (`author_name`, `image_url`, `like_count`, `liked_by_me`, `comment_count`) for every post-returning endpoint (list, create, get, update, mine, moderation pending).
- Only `published` posts are actionable by non-owners — `service.can_view_post` is the existing gate used by `like_post`, `create_comment`, and `list_comments`; bookmarking follows the same rule.
- There is currently no persistent navigation between `/forum`, `/forum/new`, and `/forum/my-posts` — `/forum/my-posts` links to `/forum/new`, but nothing links *into* `/forum/my-posts` from the public `/forum` page. This is a pre-existing gap; since this spec adds a third such page (`/forum/saved`) with the identical discoverability problem, it adds one small nav row to the public forum page linking to all three — a targeted fix scoped to the pages this work already touches, not a broader nav redesign.

## Decisions (confirmed during brainstorming)

| Decision | Choice |
|---|---|
| Where saved posts appear | A dedicated `/forum/saved` page — kept separate from `/forum/my-posts` ("của tôi" = authored by me; "đã lưu" = saved from others), rather than merged as tabs on one page. |
| Collections/boards | Out of scope for v1. One flat "Đã lưu" list per user, no named collections despite the homepage copy's plural "bộ sưu tập" — the homepage copy will be corrected to singular as part of this work. |
| Save button placement | Both the post list (`ForumPostList.tsx`) and the detail page (`ForumPostDetail.tsx`), mirroring where the like button already lives plus the list view (like is detail-only today; save covers both since "save for later" is exactly the action a list-browsing user wants without opening the post). |
| Save button form factor | **Icon-only** in the list (already crowded with thumbnail/author/like/comment metadata — adding a text-label button risks wrapping at ~400px width) with `aria-label` + `aria-pressed`; **icon+text** on the detail page, matching the existing like button's style there. |
| Save mechanics | Toggle, one bookmark per `(user, post)` pair, login required — identical mechanics to `ForumLike`. |

## Data Model

### `backend/app/domains/forum/models.py`

New `ForumBookmark`, directly mirroring `ForumLike`:

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

(`user_id` is indexed here — unlike `ForumLike.user_id` — because the new "list my saved posts" query filters by `user_id` directly, whereas likes are only ever queried by `post_id`.)

One Alembic migration creates this single table.

## API

- `POST /forum/posts/{post_id}/bookmark` (login required) — toggle: if a `ForumBookmark(post_id, user_id)` row exists, delete it; otherwise insert one. Returns `ForumBookmarkResponse {bookmarked: bool}`. 404 if the post doesn't exist or isn't visible to the caller (`can_view_post`, same rule as `like_post`).
- `GET /forum/posts/saved` (login required) — returns `list[ForumPostResponse]` for every post the caller has bookmarked, newest bookmark first. Registered alongside `/posts/mine`, both ahead of `/posts/{post_id}` — same reason `/posts/mine` already is: a literal `saved` segment would otherwise be swallowed by the `{post_id}` path parameter.
- `ForumPostResponse` gains `bookmarked_by_me: bool`, computed in `service.build_post_response` the same way `liked_by_me` is (`False` for an anonymous viewer).

### Service additions (`backend/app/domains/forum/service.py`)

```python
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


def user_has_bookmarked(db: Session, post_id: int, user_id: int) -> bool:
    return (
        db.query(ForumBookmark)
        .filter(ForumBookmark.post_id == post_id, ForumBookmark.user_id == user_id)
        .first()
        is not None
    )


def list_saved_posts(db: Session, user_id: int) -> list[ForumPost]:
    return (
        db.query(ForumPost)
        .join(ForumBookmark, ForumBookmark.post_id == ForumPost.id)
        .filter(ForumBookmark.user_id == user_id)
        .order_by(ForumBookmark.id.desc())
        .all()
    )
```

`build_post_response` gains one line: `"bookmarked_by_me": viewer_id is not None and user_has_bookmarked(db, post.id, viewer_id)`.

## Frontend

- `frontend/lib/forum.ts`: `ForumPost` gains `bookmarkedByMe: boolean`.
- `frontend/components/forum/ForumPostList.tsx`: each list row gets an icon-only bookmark toggle button (`material-symbols-outlined`, icon `bookmark`, filled via `fontVariationSettings: "'FILL' 1"` when saved — same technique as the like button's `favorite` icon) placed at the end of the row, `aria-pressed={post.bookmarkedByMe}`, `aria-label` text that changes with state (`"Lưu bài viết"` / `"Bỏ lưu bài viết"`) since there's no visible text label to derive an accessible name from.
- `frontend/components/forum/ForumPostDetail.tsx`: a second pill button next to the like button, icon+text — same `bookmark` icon in both states, toggling `fontVariationSettings: "'FILL' 1"` the same way the like button's `favorite` icon does, paired with `t('Bookmark.saveButton')`/`t('Bookmark.savedButton')` — same visual treatment as the like button (`bg-primary` when active, `bg-surface-container` otherwise), `aria-pressed`.
- New `frontend/components/forum/SavedForumPostList.tsx`: near-identical structure to `ForumPostList.tsx` (thumbnail/author/like/comment/save metadata, same list-row markup) but fetches `GET /forum/posts/saved` once on mount, no category filter (there's nothing to filter by — it's already a personal, typically-short list), an empty-state message when nothing is saved yet.
- New `frontend/app/forum/saved/page.tsx`: wraps `SavedForumPostList` in `AuthGate`, matching `app/forum/my-posts/page.tsx`'s structure exactly (heading + `AuthGate` + list component).
- `frontend/app/forum/page.tsx`: add a small nav row above `ForumPostList` with links to `/forum/new`, `/forum/my-posts`, and `/forum/saved` — closing the pre-existing gap where none of these pages were discoverable from the main forum page.
- `frontend/messages/vi.json`: fix the homepage's `FeatureShowcase` "save" step copy to singular ("bộ sưu tập" → drop the plural framing, describe it as "Lưu lại những bài đăng ấn tượng để mở ra tham khảo bất cứ khi nào cần lên đồ" — matching what v1 actually does).

## Testing

Backend (pytest, real Postgres test DB):
- `test_models.py`: `ForumBookmark` persists; `(post_id, user_id)` unique constraint enforced (mirrors the existing `ForumLike` test).
- `test_service.py`: `toggle_bookmark` creates then removes; `list_saved_posts` returns only the caller's bookmarked posts, newest-bookmarked-first, and excludes posts bookmarked by other users.
- `test_router.py`: `POST /forum/posts/{id}/bookmark` — requires auth, toggles, 404 on a non-visible/nonexistent post; `GET /forum/posts/saved` — requires auth, returns bookmarked posts with the full response shape (`authorName`, `imageUrl`, counts), reflects `bookmarkedByMe` on `GET /forum/posts/{id}` after toggling.

Frontend (vitest + testing-library):
- `ForumPostList.test.tsx`: bookmark button renders with correct `aria-pressed`/`aria-label`, toggles on click.
- `ForumPostDetail.test.tsx`: bookmark button toggles, matching the existing like-button test's shape.
- `SavedForumPostList.test.tsx` (new): fetches and renders saved posts; empty state when none.
- `app/forum/saved/page.test.tsx` (new): `AuthGate` wraps the list, matching `app/forum/my-posts/page.test.tsx`'s existing test shape.

Run `tsc --noEmit` as a final check, same as the prior sub-project — `ForumPost` gains a required field again, so any test fixture missed in this spec's file list will surface there.

## Non-Goals

- Named collections/boards (multiple bookmark groups) — tracked as a possible future sub-project if real demand shows up.
- Bookmark notes/annotations ("why I saved this").
- Sharing a saved list with someone else.
- Sorting/filtering the saved list beyond newest-bookmarked-first.
