# Forum: Image Attachment + Like + Comment — Design

## Context

An audit of the forum feature (`backend/app/domains/forum/`, `frontend/app/forum/`) against the homepage marketing copy (`frontend/messages/vi.json` lines 509-526, rendered via `frontend/components/home/FeatureShowcase.tsx`) found that the "Diễn đàn" section promises three capabilities that do not exist in code:

1. Posting an outfit with a **picture** and a **caption**.
2. **Liking** ("thả tim") posts.
3. **Commenting** on posts.

(A fourth promised capability, "tạo bộ sưu tập riêng / lưu bài" — bookmarks/collections — is tracked as a separate, later sub-project and is explicitly out of scope here.)

This spec covers building capabilities 1 and 2 and 3 together, since they are the three pieces needed to make the homepage's forum promise true, and they touch the same `ForumPost` detail page.

## Current State (for context)

- `ForumPost` model (`backend/app/domains/forum/models.py:9-26`): `title`, `body` (text), `category`, `status`, `author_id`. No image, no like, no comment tables anywhere in the codebase.
- `ForumPostResponse` (`backend/app/domains/forum/schemas.py`) returns `author_id` only — no display name anywhere in the forum API or UI.
- Posts go through moderation: `pending → published/rejected/hidden` (`backend/app/domains/forum/service.py:6-11`). Only `published` posts are publicly visible/listable.
- `ForumReport` is a separate table for reporting posts; it is not extended by this spec.
- Existing image-upload convention (`backend/app/domains/wardrobe/router.py:37-49`, `service.py`): client calls `POST /wardrobe/upload-url` → gets `{uploadUrl, blobPath}` from `generate_upload_sas_url(container, blob_path)` → client PUTs the file directly to blob storage (with `x-ms-blob-type` and `x-ms-blob-content-type` headers, per the fix made earlier in `frontend/components/outfit/step1/UploadFlow.tsx`) → the *final public URL* (`blob_public_url(container, blob_path)`) is handed back to the client as a plain string once (wardrobe does this via its `suggest-tags` response's `blobUrl` field) → the client passes that resolved URL straight through as a plain string field (`WardrobeItemCreate.blob_url: str`) when creating the record. There is no separate "confirm" endpoint and no blob-path bookkeeping on the create schema — by the time the client calls create, it already holds the final URL. Note `blob_public_url` is a pure/deterministic function of `(container, blob_path)` (`backend/app/core/blob_storage.py:24-25`) — it can be computed before the blob is actually uploaded, since it's just a URL construction, not a read.
- `backend/app/domains/forum/router.py` has no `PATCH`-style partial update — `PUT /forum/posts/{post_id}` reuses `ForumPostCreate` itself as the full-replacement body (title/body/category are always resent in full). This spec's new `image_url` field follows the same full-replace convention: no partial-update ambiguity to resolve.
- `User` model (`backend/app/domains/auth/models.py`) has a plain `name: str` field — this is what "author name" means throughout this spec; there is no separate username field.

## Decisions (confirmed during brainstorming)

| Decision | Choice |
|---|---|
| Post structure | Keep existing `title` + `body`; add an **optional** `image_url` — no forced redesign into an Instagram-style image-first post. |
| Images per post | Exactly one (nullable single field, not a gallery table). |
| Comment moderation | None — comments are visible immediately on creation, no admin approval queue. |
| Comment structure | Flat (no nested replies/`parent_id`). |
| Comment deletion | Author or admin can delete (mirrors the existing `ForumPost` delete rule). |
| Comment reporting | **Not built** — out of scope for this spec (see Non-Goals). |
| Like mechanics | Toggle, one like per `(user, post)` pair, login required. |

## Data Model

### `backend/app/domains/forum/models.py`

- `ForumPost` gains:
  ```python
  image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
  ```

- New `ForumComment`:
  ```python
  class ForumComment(Base):
      __tablename__ = "forum_comments"

      id: Mapped[int] = mapped_column(Integer, primary_key=True)
      post_id: Mapped[int] = mapped_column(ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False, index=True)
      author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
      body: Mapped[str] = mapped_column(Text, nullable=False)
      created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
      updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
  ```

- New `ForumLike`:
  ```python
  class ForumLike(Base):
      __tablename__ = "forum_likes"
      __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_forum_likes_post_user"),)

      id: Mapped[int] = mapped_column(Integer, primary_key=True)
      post_id: Mapped[int] = mapped_column(ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False, index=True)
      user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
      created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
  ```

One Alembic migration covers all three changes (they ship together as one sub-project): add `forum_posts.image_url` (nullable, no backfill needed), create `forum_comments`, create `forum_likes`.

## API

### Image upload (mirrors wardrobe exactly)

- `POST /forum/upload-url` (login required) → `ensure_container("forum")`, `blob_path = f"{user.id}/{uuid4()}.png"`, returns `{"uploadUrl": ..., "blobPath": blob_path, "imageUrl": blob_public_url("forum", blob_path)}`. `imageUrl` is safe to hand back immediately — it's a deterministic URL construction, not a read of the (not-yet-uploaded) blob.
- Client flow: request this endpoint → PUT the file to `uploadUrl` → hold onto `imageUrl` → submit it as a plain string on post create/update.
- `ForumPostCreate` (used for both create and the full-replace update) gains `image_url: str | None = None`. No blob-path bookkeeping on this schema at all — by the time the client calls create/update, it already has the resolved URL, exactly like `WardrobeItemCreate.blob_url`. Editing a post that keeps its current image simply resends the same `image_url` it already received in the fetched post; passing `null` removes the image; a new value (from a fresh upload-url round trip) replaces it.

### Likes

- `POST /forum/posts/{post_id}/like` (login required). Service: if a `ForumLike(post_id, user_id)` row exists, delete it; otherwise insert one. Returns `ForumLikeResponse {liked: bool, like_count: int}`. 404 if the post doesn't exist or isn't visible to the caller (same visibility rule as `GET /forum/posts/{id}`).

### Comments

- `POST /forum/posts/{post_id}/comments` (login required) — body: `{body: str}` (non-blank, same validator style as `ForumPostCreate.title`). 404 if post not visible to caller. Returns `ForumCommentResponse`.
- `GET /forum/posts/{post_id}/comments` (public — uses `get_current_user_optional` the same way `GET /forum/posts/{id}` does, so an anonymous visitor can read comments on a published post but a non-owner/non-admin gets 404 on a pending/rejected/hidden post). Returns `list[ForumCommentResponse]`, oldest first.
- `DELETE /forum/comments/{comment_id}` — author or admin only (403 otherwise, mirrors `ForumPost` delete), 404 if comment doesn't exist.

### Response shape changes

- `ForumPostResponse` gains: `author_name: str`, `image_url: str | None`, `like_count: int`, `liked_by_me: bool`, `comment_count: int`.
- New `ForumCommentResponse`: `id, post_id, author_id, author_name, body, created_at, updated_at, can_delete: bool` (`can_delete` is computed server-side from the requesting user, so the frontend never re-implements the authorization rule).

`author_name`/`liked_by_me`/`can_delete` all depend on knowing the requester — the existing `get_current_user_optional` dependency already used for post-detail visibility is reused for computing these on list/detail endpoints too (an anonymous request gets `liked_by_me: false` and every comment's `can_delete: false`).

## Frontend

- `frontend/lib/db.ts`: `ForumPost` type gains `authorName`, `imageUrl`, `likeCount`, `likedByMe`, `commentCount`; new `ForumComment` type.
- `frontend/components/forum/ForumPostForm.tsx`: add an optional image picker. Reuses the same upload flow as `UploadFlow.tsx` (request `POST /forum/upload-url` → direct PUT with `x-ms-blob-type`/`x-ms-blob-content-type` headers → hold the returned `imageUrl` → submit it as `imageUrl` with the rest of the form). The edit form pre-fills the current `imageUrl` from the fetched post so an untouched image round-trips unchanged (full-replace PUT, same as title/body/category today).
- `frontend/components/forum/ForumPostList.tsx`: show a thumbnail when `imageUrl` is present, show `authorName`, show `likeCount`/`commentCount` as small metadata (read-only in the list view — liking/commenting happens on the detail page).
- `frontend/components/forum/ForumPostDetail.tsx`: render the image when present; render `authorName`; add a like button (toggle, calls the like endpoint, optimistically flips `liked`/`likeCount`, requires login — reuse the existing `AuthGate`/login-prompt pattern already used for the report button); render a comment list below the post body; render a comment composer (textarea + submit, login required); each comment shows a delete button when `can_delete` is true.
- No changes to `MyForumPostList.tsx` beyond passing through the new `imageUrl` for a thumbnail, since authorship/ownership logic there is unchanged.

## Testing

Backend (pytest, real Postgres test DB per `backend/tests/conftest.py`):
- `test_models.py`: `ForumComment`/`ForumLike` persist correctly; the `(post_id, user_id)` unique constraint on `ForumLike` is enforced.
- `test_schemas.py`: comment body blank-validation; `image_url` optional on `ForumPostCreate`.
- `test_service.py`: like toggles on/off across two calls; `like_count` reflects the row count; comment create/list/delete; delete authorization (author yes, other user 403, admin yes); comments/likes only reachable for visible posts (404 on hidden/pending/rejected for a non-owner/non-admin).
- `test_router.py`: full HTTP round-trip for the new endpoints, including `POST /forum/upload-url` — no mocking, hits the real Azurite emulator exactly like `tests/domains/wardrobe/test_upload_flow.py` does (asserts `401` unauthenticated, `200` with `uploadUrl`/`blobPath`/`imageUrl` present and `sig=` in the SAS URL when authenticated).

Frontend (vitest + testing-library):
- `ForumPostForm.test.tsx`: image picker triggers the upload flow, submits the resolved `imageUrl`.
- `ForumPostDetail.test.tsx`: renders image/author/like button/comment list/comment form; like button toggles and updates count; comment submit adds to the list; delete button only shown when `can_delete`.
- `ForumPostList.test.tsx`: renders thumbnail/author/counts when present, degrades gracefully when absent (old posts with no image).

Run `tsc --noEmit` as a final integration check (this caught real bugs in the previous forum-adjacent quiz work), since `ForumPost`'s type shape changes and several components consume it.

## Non-Goals

- Bookmarks/collections (tracked separately).
- Nested/threaded comment replies.
- Reporting comments (only posts remain reportable).
- Comment moderation/approval queue.
- Multiple images per post / image gallery.
- Editing a comment after posting (only delete is supported, matching the "flat, simple" decision).
