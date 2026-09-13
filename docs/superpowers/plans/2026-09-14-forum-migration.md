# Forum Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `forum` from Next.js/SQLite to the FastAPI backend, and cut the frontend fully over, deleting the old implementation.

**Architecture:** One self-contained domain, `app/domains/forum/`, holding both `ForumPost` and `ForumReport` (analogous to `quiz` holding both `QuizQuestion` and `QuizOption`), following the `models.py`/`schemas.py`/`service.py`/`router.py` shape established in Phases 1-4. Given this domain's size — ownership authorization, a status state machine, a silent-404 visibility rule, and a reports sub-resource — the router and its tests are split across two tasks (posts first, then moderation/reports) rather than the usual one. Frontend forum components stay Client Components (`useEffect`/`fetch`), unchanged in architecture — only the fetch target moves from `/api/forum/...` to `/forum/...` via `apiFetch`.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL (unchanged from Phases 1-4). Frontend: Next.js 16, Vitest (unchanged).

**Spec:** `docs/superpowers/specs/2026-09-14-forum-migration-design.md`

## Global Constraints

- `GET /forum/posts` is public and returns only `published` posts; an invalid or missing `?category=` filter is silently treated as "no filter" (never a `422`).
- `GET /forum/posts/mine` is registered **before** `GET /forum/posts/{post_id}` in `router.py` — the same route-ordering precaution as blog's slug route in Phase 3.
- **Visibility rule**, used by both `GET /forum/posts/{post_id}` and `POST /forum/posts/{post_id}/report`: a post is visible if `status == 'published'`, OR the caller is its author, OR the caller is an admin. Otherwise, respond `404` — never `403` — so a stranger cannot tell "doesn't exist" from "exists but isn't visible to you." The viewer is resolved via `get_current_user_optional` (added in Phase 4's `app/deps.py`) since these two endpoints have no mandatory-login requirement of their own.
- **Status transitions** (`PATCH /forum/posts/{post_id}`, admin-gated, no override for any role): `pending → published|rejected`, `published → hidden`, `rejected`/`hidden` are terminal. A disallowed transition returns `409 Conflict` with `HTTPException(detail="INVALID_STATUS_TRANSITION")`.
- Editing a post (`PUT /forum/posts/{post_id}`, owner-only) always resets `status` to `'pending'`, even when editing a currently-`published` post.
- Deleting a post (`DELETE /forum/posts/{post_id}`) is allowed for its owner or an admin; `403` otherwise.
- "Enum-like" string fields (`category`, `status` on both tables) are plain `String` Postgres columns validated in Pydantic — never a Postgres native `ENUM`, matching every prior domain.
- Backend tests run against the real Postgres test database via the existing `tests/conftest.py` fixtures (`db_session`, `client`) — no mocks, no SQLite.
- Forum's frontend components/pages keep their existing Client Component architecture (`'use client'` + `useEffect`/`useState`) — this migration does not convert them to Server Components. Only `fetch('/api/forum/...')` calls become `apiFetch('/forum/...')`.
- `ForumPostForm.tsx`'s per-field `data.errors` parsing is dropped in favor of the generic `401`/`403` → `t('PostForm.unauthorizedError')`, else → `t('PostForm.genericError')` pattern already used by every other migrated form — both keys already exist in the translation files.
- `lib/forum.ts` is **not** deleted — it is trimmed to (a) the shared types/constants still consumed by the (unchanged) forum components after cutover: `ForumCategory`, `FORUM_CATEGORIES`, `ForumPostStatus`, `ForumPost`, `ForumPostInput`, `ForumReportStatus`, `ForumReport`; and (b) a legacy shim for `lib/stats.ts`/`lib/stats.test.ts` (not migrated until Phase 6): `initSchema` (creates both tables, never seeded) and `createForumPost` (used only by `lib/stats.test.ts`'s fixture rows). Everything else in the file is deleted.
- `lib/auth/users.ts` is **not** touched in this plan, even though `getUserByEmail` loses its last production caller — it is shared infrastructure outside forum's ownership (see spec's Non-goals).

---

## Task 1: `forum` domain — models and migration

**Files:**
- Create: `backend/app/domains/forum/__init__.py`
- Create: `backend/app/domains/forum/models.py`
- Modify: `backend/alembic/env.py` (register the models)
- Create: `backend/tests/domains/forum/__init__.py`
- Create: `backend/tests/domains/forum/test_models.py`

**Interfaces:**
- Consumes: `app.db.session.Base`, `app.domains.auth.models.User` (both Phase 1).
- Produces: `app.domains.forum.models.ForumPost` (columns: `id`, `title`, `body`, `category`, `status` default `'pending'`, `author_id`, `created_at`, `updated_at`). `app.domains.forum.models.ForumReport` (columns: `id`, `post_id`, `reporter_id`, `reason`, `status` default `'open'`, `created_at`; relationship `post`; computed properties `post_title`, `post_status`).

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/forum/__init__.py` (empty).

Create `backend/tests/domains/forum/test_models.py`:

```python
from app.core.security import hash_password
from app.domains.auth.models import User
from app.domains.forum.models import ForumPost, ForumReport


def test_create_forum_post_defaults_status_to_pending(db_session):
    user = User(
        name="Author", email="forum-model-author@example.com", password_hash=hash_password("password123")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    post = ForumPost(title="Bài test", body="Nội dung", category="general", author_id=user.id)
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)

    assert post.id is not None
    assert post.status == "pending"
    assert post.created_at is not None
    assert post.updated_at is not None


def test_forum_report_exposes_post_title_and_status_via_relationship(db_session):
    user = User(
        name="Author", email="forum-model-author2@example.com", password_hash=hash_password("password123")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    post = ForumPost(
        title="Bài bị báo cáo", body="Nội dung", category="general", status="published", author_id=user.id
    )
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)

    report = ForumReport(post_id=post.id, reporter_id=user.id, reason="Spam")
    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)

    assert report.status == "open"
    assert report.post_title == "Bài bị báo cáo"
    assert report.post_status == "published"
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/forum/test_models.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.forum'`.

- [ ] **Step 3: Create the models**

Create `backend/app/domains/forum/__init__.py` (empty).

Create `backend/app/domains/forum/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ForumPost(Base):
    __tablename__ = "forum_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
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


class ForumReport(Base):
    __tablename__ = "forum_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(
        ForeignKey("forum_posts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    post: Mapped["ForumPost"] = relationship()

    @property
    def post_title(self) -> str:
        return self.post.title

    @property
    def post_status(self) -> str:
        return self.post.status
```

- [ ] **Step 4: Register the models with Alembic**

Modify `backend/alembic/env.py` — add this line next to the existing model imports:

```python
from app.domains.forum import models as forum_models  # noqa: F401
```

- [ ] **Step 5: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "create forum_posts and forum_reports tables"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\d forum_posts'` and `-c '\d forum_reports'` show the expected columns and the `forum_reports.post_id` FK's `ON DELETE CASCADE` rule.

- [ ] **Step 6: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/forum/test_models.py -v`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/forum alembic/env.py alembic/versions tests/domains/forum
git commit -m "feat: add forum_posts and forum_reports models and migration"
```

---

## Task 2: `forum` domain — schemas and service

**Files:**
- Create: `backend/app/domains/forum/schemas.py`
- Create: `backend/app/domains/forum/service.py`
- Create: `backend/tests/domains/forum/test_service.py`

**Interfaces:**
- Consumes: `ForumPost`, `ForumReport` (Task 1).
- Produces: `FORUM_CATEGORIES`, `FORUM_POST_STATUSES` (lists of valid strings). `ForumPostCreate`, `ForumPostStatusUpdate`, `ForumPostResponse`, `ForumReportCreate`, `ForumReportResponse` (Pydantic schemas). `ALLOWED_STATUS_TRANSITIONS` (dict), `InvalidStatusTransitionError` (exception). Service functions: `list_published_posts(db, category: str | None) -> list[ForumPost]`, `list_posts_by_author(db, author_id) -> list[ForumPost]`, `list_pending_posts(db) -> list[ForumPost]`, `get_post(db, post_id) -> ForumPost | None`, `can_view_post(post, viewer_id: int | None, viewer_role: str | None) -> bool`, `create_post(db, author_id, data: ForumPostCreate) -> ForumPost`, `update_post(db, post_id, data: ForumPostCreate) -> ForumPost | None`, `delete_post(db, post_id) -> bool`, `set_post_status(db, post_id, new_status: str) -> ForumPost | None` (raises `InvalidStatusTransitionError`), `create_report(db, post_id, reporter_id, reason) -> ForumReport`, `list_open_reports(db) -> list[ForumReport]`, `resolve_report(db, report_id) -> ForumReport | None`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/forum/test_service.py`:

```python
import pytest

from app.domains.forum import service
from app.domains.forum.schemas import ForumPostCreate

VALID_POST = ForumPostCreate(title="Bài test", body="Nội dung", category="general")


def _make_user(db_session, email: str):
    from app.domains.auth import service as auth_service

    return auth_service.create_user(db_session, name="Author", email=email, password="password123")


def test_create_post_defaults_to_pending(db_session):
    user = _make_user(db_session, "forum-svc-1@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    assert post.status == "pending"
    assert post.author_id == user.id


def test_list_published_posts_excludes_non_published(db_session):
    user = _make_user(db_session, "forum-svc-2@example.com")
    published = service.create_post(db_session, user.id, VALID_POST)
    service.set_post_status(db_session, published.id, "published")
    service.create_post(db_session, user.id, VALID_POST.model_copy(update={"title": "Bài chờ"}))

    posts = service.list_published_posts(db_session, None)
    assert [p.id for p in posts] == [published.id]


def test_list_published_posts_filters_by_category(db_session):
    user = _make_user(db_session, "forum-svc-3@example.com")
    general = service.create_post(db_session, user.id, VALID_POST)
    service.set_post_status(db_session, general.id, "published")
    styling = service.create_post(
        db_session, user.id, VALID_POST.model_copy(update={"category": "styling-help"})
    )
    service.set_post_status(db_session, styling.id, "published")

    posts = service.list_published_posts(db_session, "styling-help")
    assert [p.id for p in posts] == [styling.id]


def test_list_posts_by_author_returns_all_statuses_for_that_author_only(db_session):
    user = _make_user(db_session, "forum-svc-4@example.com")
    other = _make_user(db_session, "forum-svc-5@example.com")
    mine = service.create_post(db_session, user.id, VALID_POST)
    service.create_post(db_session, other.id, VALID_POST)

    posts = service.list_posts_by_author(db_session, user.id)
    assert [p.id for p in posts] == [mine.id]


def test_list_pending_posts_orders_oldest_first(db_session):
    user = _make_user(db_session, "forum-svc-6@example.com")
    first = service.create_post(db_session, user.id, VALID_POST)
    second = service.create_post(db_session, user.id, VALID_POST)

    posts = service.list_pending_posts(db_session)
    assert [p.id for p in posts] == [first.id, second.id]


def test_can_view_post_rules(db_session):
    user = _make_user(db_session, "forum-svc-7@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)

    assert service.can_view_post(post, None, None) is False
    assert service.can_view_post(post, user.id, "user") is True
    assert service.can_view_post(post, 999999, "admin") is True
    assert service.can_view_post(post, 999999, "user") is False

    service.set_post_status(db_session, post.id, "published")
    published = service.get_post(db_session, post.id)
    assert service.can_view_post(published, None, None) is True


def test_update_post_resets_status_to_pending_even_from_published(db_session):
    user = _make_user(db_session, "forum-svc-8@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    service.set_post_status(db_session, post.id, "published")

    updated = service.update_post(db_session, post.id, VALID_POST.model_copy(update={"title": "Đã sửa"}))
    assert updated.status == "pending"
    assert updated.title == "Đã sửa"


def test_update_post_returns_none_when_missing(db_session):
    assert service.update_post(db_session, 999999, VALID_POST) is None


def test_delete_post_removes_it(db_session):
    user = _make_user(db_session, "forum-svc-9@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    assert service.delete_post(db_session, post.id) is True
    assert service.get_post(db_session, post.id) is None
    assert service.delete_post(db_session, post.id) is False


def test_set_post_status_valid_transition(db_session):
    user = _make_user(db_session, "forum-svc-10@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    updated = service.set_post_status(db_session, post.id, "published")
    assert updated.status == "published"


def test_set_post_status_rejects_invalid_transition(db_session):
    user = _make_user(db_session, "forum-svc-11@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    with pytest.raises(service.InvalidStatusTransitionError):
        service.set_post_status(db_session, post.id, "hidden")


def test_set_post_status_rejects_transition_from_a_terminal_status(db_session):
    user = _make_user(db_session, "forum-svc-12@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    service.set_post_status(db_session, post.id, "rejected")
    with pytest.raises(service.InvalidStatusTransitionError):
        service.set_post_status(db_session, post.id, "published")


def test_set_post_status_returns_none_when_missing(db_session):
    assert service.set_post_status(db_session, 999999, "published") is None


def test_create_report_defaults_to_open(db_session):
    user = _make_user(db_session, "forum-svc-13@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    report = service.create_report(db_session, post.id, user.id, "Spam")
    assert report.status == "open"
    assert report.post_id == post.id


def test_list_open_reports_excludes_resolved(db_session):
    user = _make_user(db_session, "forum-svc-14@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    open_report = service.create_report(db_session, post.id, user.id, "Spam")
    resolved_report = service.create_report(db_session, post.id, user.id, "Khác")
    service.resolve_report(db_session, resolved_report.id)

    reports = service.list_open_reports(db_session)
    assert [r.id for r in reports] == [open_report.id]


def test_resolve_report_marks_it_resolved(db_session):
    user = _make_user(db_session, "forum-svc-15@example.com")
    post = service.create_post(db_session, user.id, VALID_POST)
    report = service.create_report(db_session, post.id, user.id, "Spam")
    resolved = service.resolve_report(db_session, report.id)
    assert resolved.status == "resolved"


def test_resolve_report_returns_none_when_missing(db_session):
    assert service.resolve_report(db_session, 999999) is None
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/forum/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.forum.schemas'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/forum/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

FORUM_CATEGORIES = ["general", "outfit-showcase", "styling-help", "personal-color", "sustainable-swap"]
FORUM_POST_STATUSES = ["pending", "published", "rejected", "hidden"]


class ForumPostCreate(CamelModel):
    title: str
    body: str
    category: str

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


class ForumPostStatusUpdate(CamelModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_valid(cls, value: str) -> str:
        if value not in FORUM_POST_STATUSES:
            raise ValueError("Trạng thái không hợp lệ")
        return value


class ForumPostResponse(CamelModel):
    id: int
    title: str
    body: str
    category: str
    status: str
    author_id: int
    created_at: datetime
    updated_at: datetime


class ForumReportCreate(CamelModel):
    reason: str

    @field_validator("reason")
    @classmethod
    def reason_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Vui lòng nhập lý do báo cáo")
        return stripped


class ForumReportResponse(CamelModel):
    id: int
    post_id: int
    post_title: str
    post_status: str
    reporter_id: int
    reason: str
    status: str
    created_at: datetime
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/forum/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.forum.models import ForumPost, ForumReport
from app.domains.forum.schemas import ForumPostCreate

ALLOWED_STATUS_TRANSITIONS: dict[str, list[str]] = {
    "pending": ["published", "rejected"],
    "published": ["hidden"],
    "rejected": [],
    "hidden": [],
}


class InvalidStatusTransitionError(Exception):
    pass


def list_published_posts(db: Session, category: str | None) -> list[ForumPost]:
    query = db.query(ForumPost).filter(ForumPost.status == "published")
    if category is not None:
        query = query.filter(ForumPost.category == category)
    return query.order_by(ForumPost.id.desc()).all()


def list_posts_by_author(db: Session, author_id: int) -> list[ForumPost]:
    return (
        db.query(ForumPost).filter(ForumPost.author_id == author_id).order_by(ForumPost.id.desc()).all()
    )


def list_pending_posts(db: Session) -> list[ForumPost]:
    return db.query(ForumPost).filter(ForumPost.status == "pending").order_by(ForumPost.id.asc()).all()


def get_post(db: Session, post_id: int) -> ForumPost | None:
    return db.get(ForumPost, post_id)


def can_view_post(post: ForumPost, viewer_id: int | None, viewer_role: str | None) -> bool:
    if post.status == "published":
        return True
    if viewer_id is not None and viewer_id == post.author_id:
        return True
    if viewer_role == "admin":
        return True
    return False


def create_post(db: Session, author_id: int, data: ForumPostCreate) -> ForumPost:
    post = ForumPost(
        title=data.title, body=data.body, category=data.category, status="pending", author_id=author_id
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
    post.status = "pending"
    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post_id: int) -> bool:
    post = get_post(db, post_id)
    if post is None:
        return False
    db.delete(post)
    db.commit()
    return True


def set_post_status(db: Session, post_id: int, new_status: str) -> ForumPost | None:
    post = get_post(db, post_id)
    if post is None:
        return None
    allowed = ALLOWED_STATUS_TRANSITIONS.get(post.status, [])
    if new_status not in allowed:
        raise InvalidStatusTransitionError()
    post.status = new_status
    db.commit()
    db.refresh(post)
    return post


def create_report(db: Session, post_id: int, reporter_id: int, reason: str) -> ForumReport:
    report = ForumReport(post_id=post_id, reporter_id=reporter_id, reason=reason, status="open")
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def list_open_reports(db: Session) -> list[ForumReport]:
    return db.query(ForumReport).filter(ForumReport.status == "open").order_by(ForumReport.id.asc()).all()


def resolve_report(db: Session, report_id: int) -> ForumReport | None:
    report = db.get(ForumReport, report_id)
    if report is None:
        return None
    report.status = "resolved"
    db.commit()
    db.refresh(report)
    return report
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/forum/test_service.py -v`
Expected: PASS (17 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/forum/schemas.py app/domains/forum/service.py tests/domains/forum/test_service.py
git commit -m "feat: add forum schemas and service"
```

---

## Task 3: `forum` domain — posts router

**Files:**
- Create: `backend/app/domains/forum/router.py`
- Modify: `backend/app/main.py` (wire the router)
- Create: `backend/tests/domains/forum/test_router.py`

**Interfaces:**
- Consumes: `service` module and schemas (Task 2), `get_current_user`, `get_current_user_optional` (Phase 1/4's `app/deps.py`).
- Produces: `router` (FastAPI `APIRouter`, prefix `/forum`) with `GET /forum/posts`, `POST /forum/posts`, `GET /forum/posts/mine`, `GET /forum/posts/{post_id}`, `PUT /forum/posts/{post_id}`, `DELETE /forum/posts/{post_id}`. Task 4 appends the moderation/reports endpoints to this same `router` object.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/forum/test_router.py`:

```python
def _register_and_login(client, email: str) -> None:
    client.post("/auth/register", json={"name": "User", "email": email, "password": "password123"})
    client.post("/auth/login", json={"email": email, "password": "password123"})


def _promote_to_admin_and_relogin(client, db_session, email: str) -> None:
    from app.domains.auth.models import User

    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()
    client.post("/auth/login", json={"email": email, "password": "password123"})


VALID_BODY = {"title": "Bài test", "body": "Nội dung", "category": "general"}


def _publish(db_session, post_id: int) -> None:
    from app.domains.forum.models import ForumPost

    db_session.query(ForumPost).filter(ForumPost.id == post_id).update({"status": "published"})
    db_session.commit()


def test_list_posts_is_public_and_only_returns_published(client, db_session):
    _register_and_login(client, "forum-author@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    assert client.get("/forum/posts").json() == []

    _publish(db_session, post["id"])

    published = client.get("/forum/posts").json()
    assert [p["id"] for p in published] == [post["id"]]


def test_list_posts_filters_by_category(client, db_session):
    _register_and_login(client, "forum-cat@example.com")
    general = client.post("/forum/posts", json=VALID_BODY).json()
    styling = client.post("/forum/posts", json={**VALID_BODY, "category": "styling-help"}).json()
    _publish(db_session, general["id"])
    _publish(db_session, styling["id"])

    response = client.get("/forum/posts?category=styling-help")
    assert [p["id"] for p in response.json()] == [styling["id"]]


def test_list_posts_ignores_an_invalid_category_filter(client, db_session):
    _register_and_login(client, "forum-cat2@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])

    response = client.get("/forum/posts?category=not-a-real-category")
    assert [p["id"] for p in response.json()] == [post["id"]]


def test_create_post_requires_authentication(client):
    response = client.post("/forum/posts", json=VALID_BODY)
    assert response.status_code == 401


def test_create_post_rejects_invalid_body(client):
    _register_and_login(client, "forum-invalid@example.com")
    response = client.post("/forum/posts", json={**VALID_BODY, "category": "not-a-category"})
    assert response.status_code == 422


def test_get_post_returns_404_for_a_pending_post_to_a_stranger(client):
    _register_and_login(client, "forum-owner@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-stranger@example.com")
    assert client.get(f"/forum/posts/{post['id']}").status_code == 404


def test_get_post_is_visible_to_its_owner_while_pending(client):
    _register_and_login(client, "forum-owner2@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    assert client.get(f"/forum/posts/{post['id']}").status_code == 200


def test_get_post_is_visible_to_an_admin_while_pending(client, db_session):
    _register_and_login(client, "forum-owner3@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-admin-viewer@example.com")
    _promote_to_admin_and_relogin(client, db_session, "forum-admin-viewer@example.com")
    assert client.get(f"/forum/posts/{post['id']}").status_code == 200


def test_get_post_returns_404_for_a_nonexistent_id(client):
    assert client.get("/forum/posts/999999").status_code == 404


def test_list_my_posts_requires_authentication(client):
    assert client.get("/forum/posts/mine").status_code == 401


def test_list_my_posts_returns_only_the_caller_own_posts_any_status(client):
    _register_and_login(client, "forum-mine@example.com")
    mine = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-other@example.com")
    client.post("/forum/posts", json=VALID_BODY)

    _register_and_login(client, "forum-mine@example.com")
    response = client.get("/forum/posts/mine")
    assert [p["id"] for p in response.json()] == [mine["id"]]


def test_update_post_requires_authentication(client):
    assert client.put("/forum/posts/1", json=VALID_BODY).status_code == 401


def test_update_post_requires_ownership(client):
    _register_and_login(client, "forum-owner4@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-not-owner@example.com")
    response = client.put(f"/forum/posts/{post['id']}", json=VALID_BODY)
    assert response.status_code == 403


def test_update_post_resets_status_to_pending_even_from_published(client, db_session):
    _register_and_login(client, "forum-owner5@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _publish(db_session, post["id"])

    updated = client.put(f"/forum/posts/{post['id']}", json={**VALID_BODY, "title": "Đã sửa"})
    assert updated.status_code == 200
    assert updated.json()["status"] == "pending"
    assert updated.json()["title"] == "Đã sửa"


def test_update_post_returns_404_when_missing(client):
    _register_and_login(client, "forum-owner6@example.com")
    assert client.put("/forum/posts/999999", json=VALID_BODY).status_code == 404


def test_delete_post_requires_authentication(client):
    assert client.delete("/forum/posts/1").status_code == 401


def test_delete_post_allowed_for_owner(client):
    _register_and_login(client, "forum-owner7@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    assert client.delete(f"/forum/posts/{post['id']}").status_code == 204


def test_delete_post_allowed_for_admin(client, db_session):
    _register_and_login(client, "forum-owner8@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-admin-deleter@example.com")
    _promote_to_admin_and_relogin(client, db_session, "forum-admin-deleter@example.com")
    assert client.delete(f"/forum/posts/{post['id']}").status_code == 204


def test_delete_post_forbidden_for_non_owner_non_admin(client):
    _register_and_login(client, "forum-owner9@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-stranger2@example.com")
    assert client.delete(f"/forum/posts/{post['id']}").status_code == 403


def test_delete_post_returns_404_when_missing(client):
    _register_and_login(client, "forum-owner10@example.com")
    assert client.delete("/forum/posts/999999").status_code == 404
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/forum/test_router.py -v`
Expected: FAIL — the app has no `/forum/*` routes yet, so every request returns `404 Not Found` regardless of the test's expected status.

- [ ] **Step 3: Write the router**

Create `backend/app/domains/forum/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, get_current_user_optional
from app.domains.auth.models import User
from app.domains.forum import service
from app.domains.forum.schemas import FORUM_CATEGORIES, ForumPostCreate, ForumPostResponse

router = APIRouter(prefix="/forum", tags=["forum"])


@router.get("/posts", response_model=list[ForumPostResponse])
def list_posts(category: str | None = None, db: Session = Depends(get_db)):
    valid_category = category if category in FORUM_CATEGORIES else None
    return service.list_published_posts(db, valid_category)


@router.post("/posts", response_model=ForumPostResponse, status_code=status.HTTP_201_CREATED)
def create_post(body: ForumPostCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return service.create_post(db, user.id, body)


# Registered before /posts/{post_id} — a literal "mine" segment would
# otherwise be swallowed by the {post_id} path parameter.
@router.get("/posts/mine", response_model=list[ForumPostResponse])
def list_my_posts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return service.list_posts_by_author(db, user.id)


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
    return post


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
    return service.update_post(db, post_id, body)


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    post = service.get_post(db, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    if post.author_id != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bạn không có quyền xóa bài này")
    service.delete_post(db, post_id)
```

- [ ] **Step 4: Wire the router into the app**

Modify `backend/app/main.py` — add the import next to the other domain router imports:

```python
from app.domains.forum.router import router as forum_router
```

and add the include next to the other `app.include_router(...)` calls:

```python
app.include_router(forum_router)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/forum/test_router.py -v`
Expected: PASS (20 tests).

- [ ] **Step 6: Run the full backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/forum/router.py app/main.py tests/domains/forum/test_router.py
git commit -m "feat: add forum posts router"
```

---

## Task 4: `forum` domain — moderation and reports router

**Files:**
- Modify: `backend/app/domains/forum/router.py` (append moderation/report endpoints)
- Modify: `backend/tests/domains/forum/test_router.py` (append their tests)

**Interfaces:**
- Consumes: `require_admin` (Phase 1's `app/deps.py`), `ForumPostStatusUpdate`, `ForumReportCreate`, `ForumReportResponse` (Task 2), `service.set_post_status`, `service.create_report`, `service.list_pending_posts`, `service.list_open_reports`, `service.resolve_report`, `service.InvalidStatusTransitionError` (Task 2).
- Produces: `PATCH /forum/posts/{post_id}` (status transition), `POST /forum/posts/{post_id}/report`, `GET /forum/moderation/pending`, `GET /forum/moderation/reports`, `PATCH /forum/reports/{report_id}` — all added to the same `router` object from Task 3.

- [ ] **Step 1: Write the failing tests**

Modify `backend/tests/domains/forum/test_router.py` — append these tests at the end of the file:

```python
def test_update_post_status_requires_authentication(client):
    assert client.patch("/forum/posts/1", json={"status": "published"}).status_code == 401


def test_update_post_status_requires_admin(client):
    _register_and_login(client, "forum-status-user@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    response = client.patch(f"/forum/posts/{post['id']}", json={"status": "published"})
    assert response.status_code == 403


def test_update_post_status_allows_pending_to_published(client, db_session):
    _register_and_login(client, "forum-status1@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _promote_to_admin_and_relogin(client, db_session, "forum-status1@example.com")

    response = client.patch(f"/forum/posts/{post['id']}", json={"status": "published"})
    assert response.status_code == 200
    assert response.json()["status"] == "published"


def test_update_post_status_allows_pending_to_rejected(client, db_session):
    _register_and_login(client, "forum-status2@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _promote_to_admin_and_relogin(client, db_session, "forum-status2@example.com")

    response = client.patch(f"/forum/posts/{post['id']}", json={"status": "rejected"})
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_update_post_status_allows_published_to_hidden(client, db_session):
    _register_and_login(client, "forum-status3@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _promote_to_admin_and_relogin(client, db_session, "forum-status3@example.com")
    client.patch(f"/forum/posts/{post['id']}", json={"status": "published"})

    response = client.patch(f"/forum/posts/{post['id']}", json={"status": "hidden"})
    assert response.status_code == 200
    assert response.json()["status"] == "hidden"


def test_update_post_status_rejects_an_invalid_transition(client, db_session):
    _register_and_login(client, "forum-status4@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _promote_to_admin_and_relogin(client, db_session, "forum-status4@example.com")

    response = client.patch(f"/forum/posts/{post['id']}", json={"status": "hidden"})
    assert response.status_code == 409
    assert response.json()["detail"] == "INVALID_STATUS_TRANSITION"


def test_update_post_status_rejects_transition_from_a_terminal_status(client, db_session):
    _register_and_login(client, "forum-status5@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _promote_to_admin_and_relogin(client, db_session, "forum-status5@example.com")
    client.patch(f"/forum/posts/{post['id']}", json={"status": "rejected"})

    response = client.patch(f"/forum/posts/{post['id']}", json={"status": "published"})
    assert response.status_code == 409


def test_update_post_status_rejects_an_invalid_status_value(client, db_session):
    _register_and_login(client, "forum-status6@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _promote_to_admin_and_relogin(client, db_session, "forum-status6@example.com")

    response = client.patch(f"/forum/posts/{post['id']}", json={"status": "not-a-status"})
    assert response.status_code == 422


def test_update_post_status_returns_404_when_missing(client, db_session):
    _register_and_login(client, "forum-status7@example.com")
    _promote_to_admin_and_relogin(client, db_session, "forum-status7@example.com")
    assert client.patch("/forum/posts/999999", json={"status": "published"}).status_code == 404


def test_create_report_requires_authentication(client):
    assert client.post("/forum/posts/1/report", json={"reason": "Spam"}).status_code == 401


def test_create_report_succeeds_for_a_visible_post(client, db_session):
    _register_and_login(client, "forum-report-owner@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _promote_to_admin_and_relogin(client, db_session, "forum-report-owner@example.com")
    client.patch(f"/forum/posts/{post['id']}", json={"status": "published"})

    _register_and_login(client, "forum-reporter@example.com")
    response = client.post(f"/forum/posts/{post['id']}/report", json={"reason": "Spam"})
    assert response.status_code == 201
    assert response.json()["postId"] == post["id"]
    assert response.json()["status"] == "open"


def test_create_report_returns_404_for_a_non_visible_post(client):
    _register_and_login(client, "forum-report-owner2@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()

    _register_and_login(client, "forum-reporter2@example.com")
    response = client.post(f"/forum/posts/{post['id']}/report", json={"reason": "Spam"})
    assert response.status_code == 404


def test_create_report_rejects_a_blank_reason(client):
    _register_and_login(client, "forum-report-owner3@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    response = client.post(f"/forum/posts/{post['id']}/report", json={"reason": "   "})
    assert response.status_code == 422


def test_moderation_pending_requires_admin(client):
    assert client.get("/forum/moderation/pending").status_code == 401


def test_moderation_pending_lists_pending_posts(client, db_session):
    _register_and_login(client, "forum-mod-pending@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    _promote_to_admin_and_relogin(client, db_session, "forum-mod-pending@example.com")

    response = client.get("/forum/moderation/pending")
    assert response.status_code == 200
    assert any(p["id"] == post["id"] for p in response.json())


def test_moderation_reports_requires_admin(client):
    assert client.get("/forum/moderation/reports").status_code == 401


def test_moderation_reports_lists_open_reports_with_post_info(client, db_session):
    _register_and_login(client, "forum-mod-reports@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    client.post(f"/forum/posts/{post['id']}/report", json={"reason": "Spam"})
    _promote_to_admin_and_relogin(client, db_session, "forum-mod-reports@example.com")

    response = client.get("/forum/moderation/reports")
    assert response.status_code == 200
    report = next(r for r in response.json() if r["postId"] == post["id"])
    assert report["postTitle"] == VALID_BODY["title"]
    assert report["postStatus"] == "pending"


def test_resolve_report_requires_admin(client):
    assert client.patch("/forum/reports/1").status_code == 401


def test_resolve_report_marks_it_resolved(client, db_session):
    _register_and_login(client, "forum-resolve@example.com")
    post = client.post("/forum/posts", json=VALID_BODY).json()
    report = client.post(f"/forum/posts/{post['id']}/report", json={"reason": "Spam"}).json()
    _promote_to_admin_and_relogin(client, db_session, "forum-resolve@example.com")

    response = client.patch(f"/forum/reports/{report['id']}")
    assert response.status_code == 200
    assert response.json()["status"] == "resolved"


def test_resolve_report_returns_404_when_missing(client, db_session):
    _register_and_login(client, "forum-resolve2@example.com")
    _promote_to_admin_and_relogin(client, db_session, "forum-resolve2@example.com")
    assert client.patch("/forum/reports/999999").status_code == 404
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/forum/test_router.py -v`
Expected: the new tests FAIL (404s for the not-yet-registered `/moderation/*`, `/reports/*` routes, and `PATCH`/`POST` on `/posts/{post_id}` paths not yet handled by those methods); the 20 tests from Task 3 still PASS.

- [ ] **Step 3: Append the moderation and reports endpoints**

Modify `backend/app/domains/forum/router.py` — update the imports at the top:

```python
from app.deps import get_current_user, get_current_user_optional, require_admin
from app.domains.forum.schemas import (
    FORUM_CATEGORIES,
    ForumPostCreate,
    ForumPostResponse,
    ForumPostStatusUpdate,
    ForumReportCreate,
    ForumReportResponse,
)
```

Then append these routes at the end of the file:

```python
@router.patch("/posts/{post_id}", response_model=ForumPostResponse)
def update_post_status(
    post_id: int,
    body: ForumPostStatusUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    try:
        updated = service.set_post_status(db, post_id, body.status)
    except service.InvalidStatusTransitionError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="INVALID_STATUS_TRANSITION")
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    return updated


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
def list_pending_posts(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return service.list_pending_posts(db)


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

- [ ] **Step 4: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/forum/test_router.py -v`
Expected: PASS (40 tests total: 20 from Task 3 plus 20 new).

- [ ] **Step 5: Run the full backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/forum/router.py tests/domains/forum/test_router.py
git commit -m "feat: add forum moderation and reports endpoints"
```

---

## Task 5: Frontend forum cutover — public and user-facing components

**Files:**
- Modify: `frontend/components/forum/ForumPostList.tsx`
- Modify: `frontend/components/forum/ForumPostList.test.tsx`
- Modify: `frontend/components/forum/ForumPostDetail.tsx`
- Modify: `frontend/components/forum/ForumPostDetail.test.tsx`
- Modify: `frontend/components/forum/ForumPostForm.tsx`
- Modify: `frontend/components/forum/ForumPostForm.test.tsx`
- Modify: `frontend/components/forum/MyForumPostList.tsx`
- Modify: `frontend/components/forum/MyForumPostList.test.tsx`
- Modify: `frontend/app/forum/[id]/edit/page.tsx`
- Modify: `frontend/app/forum/[id]/edit/page.test.tsx`
- Modify: `frontend/app/forum/page.test.tsx` (missed during planning — asserts `ForumPostList`'s fetch call directly)

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/forum/posts*` endpoints (Task 3).
- Note: `app/api/forum/**` and `lib/forum.ts` are **not** touched in this task — the admin moderation components (`ForumModerationQueue`, `ForumReportQueue`) still call the old Next.js `/api/forum/moderation/*` and `/api/forum/reports/*` routes until Task 6.

- [ ] **Step 1: Update ForumPostList to use apiClient**

Modify `frontend/components/forum/ForumPostList.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the `fetch` call:

```typescript
  useEffect(() => {
    const query = category === 'all' ? '' : `?category=${category}`
    apiFetch(`/forum/posts${query}`)
      .then((response) => response.json())
      .then(setPosts)
  }, [category])
```

- [ ] **Step 2: Update the ForumPostList tests**

Modify `frontend/components/forum/ForumPostList.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/posts', { credentials: 'include' })
```

```typescript
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/forum/posts?category=styling-help', { credentials: 'include' })
    )
```

- [ ] **Step 3: Run the ForumPostList tests**

Run: `cd frontend && npx vitest run components/forum/ForumPostList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 4: Update ForumPostDetail to use apiClient**

Modify `frontend/components/forum/ForumPostDetail.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace both `fetch` calls:

```typescript
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
```

- [ ] **Step 5: Update the ForumPostDetail tests**

Modify `frontend/components/forum/ForumPostDetail.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/posts/9', { credentials: 'include' })
```

```typescript
    expect(fetch).toHaveBeenCalledWith(
      '/forum/posts/9/report',
      expect.objectContaining({ method: 'POST', credentials: 'include', body: JSON.stringify({ reason: 'Spam' }) })
    )
```

- [ ] **Step 6: Run the ForumPostDetail tests**

Run: `cd frontend && npx vitest run components/forum/ForumPostDetail.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 7: Update ForumPostForm to use apiClient and drop per-field error parsing**

Modify `frontend/components/forum/ForumPostForm.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the submit logic:

```typescript
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
```

- [ ] **Step 8: Update the ForumPostForm tests**

Modify `frontend/components/forum/ForumPostForm.test.tsx` — update the two `toHaveBeenCalledWith` assertions:

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/posts', expect.objectContaining({ method: 'POST', credentials: 'include' }))
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/posts/7', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
```

Replace the third test (`'shows field errors returned by the API instead of redirecting'`) with one that asserts the generic error message instead:

```typescript
  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<ForumPostForm />)
    fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Bài mới' } })
    fireEvent.change(screen.getByLabelText('Nội dung'), { target: { value: 'Nội dung mới' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng bài' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
```

The existing fourth test (`'shows the unauthorized error and does not redirect on a 403'`) stays as-is — it already tests the correct post-migration behavior.

- [ ] **Step 9: Run the ForumPostForm tests**

Run: `cd frontend && npx vitest run components/forum/ForumPostForm.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 10: Update MyForumPostList to use apiClient**

Modify `frontend/components/forum/MyForumPostList.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace both `fetch` calls:

```typescript
  useEffect(() => {
    apiFetch('/forum/posts/mine')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('MyPosts.deleteConfirm'))) return
    await apiFetch(`/forum/posts/${id}`, { method: 'DELETE' })
    setPosts((current) => current?.filter((post) => post.id !== id) ?? null)
  }
```

- [ ] **Step 11: Update the MyForumPostList delete test's fetch assertion**

Modify `frontend/components/forum/MyForumPostList.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/posts/1', { method: 'DELETE', credentials: 'include' })
```

- [ ] **Step 12: Run the MyForumPostList tests**

Run: `cd frontend && npx vitest run components/forum/MyForumPostList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 13: Update the forum edit page to use apiClient**

Modify `frontend/app/forum/[id]/edit/page.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the fetch call:

```typescript
    params.then(({ id }) => {
      apiFetch(`/forum/posts/${id}`).then((response) => {
        if (!response.ok) {
          setNotFound(true)
          return
        }
        response.json().then(setPost)
      })
    })
```

- [ ] **Step 14: Update the edit page test's fetch assertion**

Modify `frontend/app/forum/[id]/edit/page.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/posts/3', { credentials: 'include' })
```

- [ ] **Step 15: Run the edit page tests**

Run: `cd frontend && npx vitest run --dir "app/forum/[id]/edit"`
Expected: PASS (2 tests).

- [ ] **Step 16: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: one failure — `app/forum/page.test.tsx` asserts `fetch` was called with `'/api/forum/posts'` directly (it doesn't mock `ForumPostList`, so it exercises the real component). Fix its assertion:

```typescript
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/forum/posts', { credentials: 'include' }))
```

Also update the two stale test descriptions in `ForumPostForm.test.tsx` (cosmetic — they still say `/api/forum/...`):

```typescript
  it('POSTs to /forum/posts when creating and redirects to my-posts', async () => {
```

```typescript
  it('pre-fills fields and PUTs to /forum/posts/{id} when editing', async () => {
```

Run `npm test` again — this still includes the admin moderation component tests and `app/api/forum/**` tests, which are untouched until Task 6.

- [ ] **Step 17: Commit**

```bash
cd frontend
git add components/forum/ForumPostList.tsx components/forum/ForumPostList.test.tsx
git add components/forum/ForumPostDetail.tsx components/forum/ForumPostDetail.test.tsx
git add components/forum/ForumPostForm.tsx components/forum/ForumPostForm.test.tsx
git add components/forum/MyForumPostList.tsx components/forum/MyForumPostList.test.tsx
git add "app/forum/[id]/edit/page.tsx" "app/forum/[id]/edit/page.test.tsx"
git add app/forum/page.test.tsx
git commit -m "feat: cut public and user-facing forum components over to FastAPI"
```

---

## Task 6: Frontend forum moderation cutover, deletion of old routes, and `lib/forum.ts` trim

**Files:**
- Modify: `frontend/components/admin/ForumModerationQueue.tsx`
- Modify: `frontend/components/admin/ForumModerationQueue.test.tsx`
- Modify: `frontend/components/admin/ForumReportQueue.tsx`
- Modify: `frontend/components/admin/ForumReportQueue.test.tsx`
- Delete: all 18 files under `frontend/app/api/forum/` (9 implementation files, listed in Step 5, plus their `.test.ts` pairs)
- Modify: `frontend/lib/forum.ts` (trim to shared types + legacy shim)
- Delete: `frontend/lib/forum.test.ts`
- Modify: `frontend/lib/getDb.ts` (remove the now-dead `seedForumIfEmpty` wiring)

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/forum/moderation/*` and `/forum/reports/*` endpoints (Task 4).

- [ ] **Step 1: Update ForumModerationQueue to use apiClient**

Modify `frontend/components/admin/ForumModerationQueue.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace both `fetch` calls:

```typescript
  useEffect(() => {
    apiFetch('/forum/moderation/pending')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleDecision(id: number, status: 'published' | 'rejected') {
    await apiFetch(`/forum/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setPosts((current) => current?.filter((post) => post.id !== id) ?? null)
  }
```

- [ ] **Step 2: Update the ForumModerationQueue tests**

Modify `frontend/components/admin/ForumModerationQueue.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/moderation/pending', { credentials: 'include' })
```

```typescript
    expect(fetch).toHaveBeenCalledWith(
      '/forum/posts/1',
      expect.objectContaining({ method: 'PATCH', credentials: 'include', body: JSON.stringify({ status: 'published' }) })
    )
```

- [ ] **Step 3: Run the ForumModerationQueue tests**

Run: `cd frontend && npx vitest run components/admin/ForumModerationQueue.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 4: Update ForumReportQueue to use apiClient**

Modify `frontend/components/admin/ForumReportQueue.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace all four `fetch` calls:

```typescript
  useEffect(() => {
    apiFetch('/forum/moderation/reports')
      .then((response) => response.json())
      .then(setReports)
  }, [])

  async function handleResolve(id: number) {
    await apiFetch(`/forum/reports/${id}`, { method: 'PATCH' })
    setReports((current) => current?.filter((report) => report.id !== id) ?? null)
  }

  async function handleHide(report: ForumReport) {
    await apiFetch(`/forum/posts/${report.postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'hidden' }),
    })
    setReports(
      (current) =>
        current?.map((item) => (item.id === report.id ? { ...item, postStatus: 'hidden' as const } : item)) ?? null
    )
  }

  async function handleDelete(report: ForumReport) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/forum/posts/${report.postId}`, { method: 'DELETE' })
    setReports((current) => current?.filter((item) => item.postId !== report.postId) ?? null)
  }
```

- [ ] **Step 5: Update the ForumReportQueue tests**

Modify `frontend/components/admin/ForumReportQueue.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/moderation/reports', { credentials: 'include' })
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/reports/1', { method: 'PATCH', credentials: 'include' })
```

```typescript
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/forum/posts/10',
        expect.objectContaining({ method: 'PATCH', credentials: 'include', body: JSON.stringify({ status: 'hidden' }) })
      )
    )
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/forum/posts/10', { method: 'DELETE', credentials: 'include' })
```

- [ ] **Step 6: Run the ForumReportQueue tests**

Run: `cd frontend && npx vitest run components/admin/ForumReportQueue.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 7: Confirm `lib/stats.test.ts` still passes before touching `lib/forum.ts`**

`lib/stats.test.ts` imports `initSchema as initForumSchema, createForumPost` from `./forum` — these two exports must survive the trim in Step 9.

Run: `cd frontend && npx vitest run lib/stats.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Delete the old forum API routes**

```bash
cd frontend
rm -r app/api/forum
```

- [ ] **Step 9: Trim `lib/forum.ts` to shared types plus a legacy shim**

Modify `frontend/lib/forum.ts` — replace the entire file with:

```typescript
import type Database from 'better-sqlite3'

// Legacy SQLite shim, kept only for admin/stats (lib/stats.ts), which still
// counts rows in `forum_posts` directly against the shared SQLite database
// and has not been migrated to FastAPI yet (planned for Phase 6). Forum's
// real data now lives in Postgres via the FastAPI backend; this table is
// intentionally never written to in production, so admin/stats reports 0
// forum posts until that migration happens, rather than silently showing
// stale data. `createForumPost` is kept only because lib/stats.test.ts
// calls it to build fixture rows for its count assertions.
//
// The types and constants below are NOT part of the legacy shim — they are
// the shared shapes still used by the (unchanged) forum Client Components
// after cutover, since apiFetch responses are typed against them directly.

export type ForumCategory =
  | 'general'
  | 'outfit-showcase'
  | 'styling-help'
  | 'personal-color'
  | 'sustainable-swap'

export const FORUM_CATEGORIES: ForumCategory[] = [
  'general',
  'outfit-showcase',
  'styling-help',
  'personal-color',
  'sustainable-swap',
]

export type ForumPostStatus = 'pending' | 'published' | 'rejected' | 'hidden'

export type ForumPost = {
  id: number
  title: string
  body: string
  category: ForumCategory
  status: ForumPostStatus
  authorId: number
  createdAt: string
  updatedAt: string
}

export type ForumPostInput = {
  title: string
  body: string
  category: ForumCategory
}

type ForumPostRow = {
  id: number
  title: string
  body: string
  category: string
  status: string
  author_id: number
  created_at: string
  updated_at: string
}

function rowToForumPost(row: ForumPostRow): ForumPost {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category as ForumCategory,
    status: row.status as ForumPostStatus,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      author_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
      reporter_id INTEGER NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL
    );
  `)
}

function getForumPostById(db: Database.Database, id: number): ForumPost | null {
  const row = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(id) as ForumPostRow | undefined
  return row ? rowToForumPost(row) : null
}

export function createForumPost(db: Database.Database, authorId: number, input: ForumPostInput): ForumPost {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO forum_posts (title, body, category, status, author_id, created_at, updated_at)
       VALUES (@title, @body, @category, 'pending', @authorId, @createdAt, @updatedAt)`
    )
    .run({ ...input, authorId, createdAt: now, updatedAt: now })
  const created = getForumPostById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created forum post')
  }
  return created
}

export type ForumReportStatus = 'open' | 'resolved'

export type ForumReport = {
  id: number
  postId: number
  postTitle: string
  postStatus: ForumPostStatus
  reporterId: number
  reason: string
  status: ForumReportStatus
  createdAt: string
}
```

Note: `getPublishedForumPosts`, `getForumPostsByAuthorId`, `updateForumPost`, `deleteForumPost`, `getPendingForumPosts`, `setForumPostStatus`, `canViewForumPost`, `getForumReportById`, `getOpenForumReports`, `createForumReport`, `resolveForumReport`, `seedIfEmpty`, and the report row-conversion helpers are dropped — nothing imports them once `app/api/forum/**` is gone (confirmed by grep before this step).

- [ ] **Step 10: Delete the SQLite CRUD test file for `lib/forum.ts`**

```bash
cd frontend
git rm lib/forum.test.ts
```

- [ ] **Step 11: Remove the dead `seedForumIfEmpty` wiring from `lib/getDb.ts`**

Modify `frontend/lib/getDb.ts` — change the import line:

```typescript
import { initSchema as initForumSchema } from './forum'
```

and remove the `seedForumIfEmpty(db)` call inside `getDb()` (the `initForumSchema(db)` call stays — it keeps `/admin/stats` from crashing).

- [ ] **Step 12: Run `lib/stats.test.ts` again to confirm the shim didn't break it**

Run: `cd frontend && npx vitest run lib/stats.test.ts`
Expected: PASS (4 tests) — same result as Step 7.

- [ ] **Step 13: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass.

- [ ] **Step 14: Manually verify in the browser**

With PostgreSQL running, the backend running (`cd backend && uvicorn app.main:app --reload`) and the frontend running (`cd frontend && npm run dev`), with `frontend/.env.local` containing `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`:
- Log in as a regular user, visit `/forum/new`, create a post — it should not appear on `/forum` yet (still `pending`).
- Visit `/forum/my-posts` — the new post appears with a "Chờ duyệt" status badge; click "Sửa" and edit it.
- Log in as `admin@twistfit.vn` / `admin1234`, visit `/admin/forum` (or wherever `ForumModerationQueue` is mounted), approve the post.
- Log out, visit `/forum` — the approved post now appears; click into it and submit a report while logged in as a different user.
- Log back in as admin, view the reports queue, resolve the report and/or hide the post; confirm the hidden post disappears from `/forum`.

- [ ] **Step 15: Commit**

```bash
cd frontend
git add components/admin/ForumModerationQueue.tsx components/admin/ForumModerationQueue.test.tsx
git add components/admin/ForumReportQueue.tsx components/admin/ForumReportQueue.test.tsx
git add lib/forum.ts lib/getDb.ts
git rm -r app/api/forum
git rm lib/forum.test.ts
git commit -m "feat: cut forum moderation over to FastAPI and remove the old Next.js implementation"
```
