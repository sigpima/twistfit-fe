# Admin/Stats Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `admin/stats` from Next.js/SQLite to the FastAPI backend, then retire the entire legacy SQLite bridge (four `lib/*.ts` shims, the `twistfit_session` cookie, and the legacy user-record mirroring) that every prior phase kept alive purely so this endpoint wouldn't crash.

**Architecture:** A new backend domain, `app/domains/admin_stats/`, with no `models.py` and no migration — the first domain in this migration with no table of its own. Its service cross-imports `BlogPost`, `ForumPost`, `User`, `QuizAttempt`, and `ContactMessage` from their own domains and runs `.count()` queries against them. On the frontend, `AdminStatsOverview.tsx` cuts over to `apiFetch`, and then the now-fully-dead legacy SQLite subsystem (`lib/getDb.ts`, `lib/stats.ts`, `lib/quizAttempts.ts`, `lib/auth/session.ts`, `app/api/admin/stats/**`, `app/api/auth/register/**`) is deleted, four more `lib/*.ts` files are trimmed to their surviving shared types, and the backend's legacy cookie code is removed.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, PostgreSQL (unchanged from Phases 1-5, no Alembic changes this phase). Frontend: Next.js 16, Vitest (unchanged).

**Spec:** `docs/superpowers/specs/2026-09-14-admin-stats-migration-design.md`

## Global Constraints

- `admin_stats` has no `models.py` and no Alembic migration — it owns no table, only a service that queries other domains' existing models.
- `CountStats.new_30d` requires an explicit `Field(alias="new30d")` — verified directly that Pydantic's `to_camel` alias generator turns `new_30d` into `new30D` (capital `D`), not `new30d`. Every other field on every schema in this phase can rely on the generator as normal.
- `GET /admin/stats` is admin-gated via the existing `require_admin` dependency — `401` unauthenticated, `403` non-admin, matching every other admin-gated endpoint in this migration.
- Frontend legacy-retirement order matters: `AdminStatsOverview.tsx`'s cutover (Task 3) must land and pass its tests **before** any deletion (Task 4) — deleting `lib/stats.ts` while it's still imported would break the build.
- `lib/db.ts`, `lib/contact.ts`, `lib/forum.ts` are trimmed to shared types only (not deleted) — their (already migrated in Phases 3-5) components still import those types to shape `apiFetch` responses.
- `lib/auth/users.ts` is trimmed to just `export type Role = 'user' | 'admin'` — still used by `components/auth/AuthProvider.tsx`, a JWT-era concept unrelated to the SQLite table this file used to back.
- `lib/quizAttempts.ts`, `lib/getDb.ts`, `lib/stats.ts`, `lib/auth/session.ts` are deleted outright — no surviving consumer of any kind.
- `app/api/admin/stats/**` and `app/api/auth/register/**` are deleted outright once `RegisterForm.tsx`'s mirror call is removed.
- Backend: `app/core/security.py` drops `LEGACY_SESSION_TTL_SECONDS`, `LEGACY_SESSION_COOKIE_NAME`, `create_legacy_session_cookie_value`, `_b64url_encode`, and their now-dead imports (`hmac`, `json`, `from base64 import urlsafe_b64encode`). `app/domains/auth/router.py`'s `_set_auth_cookies` drops its now-unused `user` parameter along with the legacy cookie call. `app/core/config.py` drops `auth_cookie_secret`. `backend/README.md`'s "Legacy bridge" section is deleted.

---

## Task 1: `admin_stats` domain — schemas and service

**Files:**
- Create: `backend/app/domains/admin_stats/__init__.py`
- Create: `backend/app/domains/admin_stats/schemas.py`
- Create: `backend/app/domains/admin_stats/service.py`
- Create: `backend/tests/domains/admin_stats/__init__.py`
- Create: `backend/tests/domains/admin_stats/test_service.py`

**Interfaces:**
- Consumes: `app.domains.auth.models.User`, `app.domains.blog.models.BlogPost`, `app.domains.forum.models.ForumPost`, `app.domains.quiz_attempts.models.QuizAttempt`, `app.domains.contact.models.ContactMessage` (all from Phases 1-5).
- Produces: `CountStats`, `ContactStats`, `AdminStatsResponse` (Pydantic schemas). `get_admin_stats(db: Session) -> AdminStatsResponse`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/admin_stats/__init__.py` (empty).

Create `backend/tests/domains/admin_stats/test_service.py`:

```python
from datetime import datetime, timedelta, timezone

from app.core.security import hash_password
from app.domains.admin_stats import service
from app.domains.auth.models import User
from app.domains.blog.models import BlogPost
from app.domains.contact.models import ContactMessage
from app.domains.forum.models import ForumPost
from app.domains.quiz_attempts.models import QuizAttempt


def _make_user(db_session, email: str) -> User:
    user = User(name="Author", email=email, password_hash=hash_password("password123"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_get_admin_stats_counts_across_all_domains(db_session):
    user = _make_user(db_session, "admin-stats-1@example.com")

    blog_post = BlogPost(
        slug="bai-test",
        title="Bài test",
        excerpt="Tóm tắt",
        content="Nội dung",
        cover_image_url="/x.jpg",
        category="community",
        author_name=None,
        is_featured=False,
        published_at="2026-01-01",
    )
    forum_post = ForumPost(title="Bài diễn đàn", body="Nội dung", category="general", author_id=user.id)
    quiz_attempt = QuizAttempt(season="summer", user_id=user.id)
    contact_message = ContactMessage(
        name="Khách", email="khach@twistfit.vn", phone=None, subject="other", message="Xin chào"
    )
    db_session.add_all([blog_post, forum_post, quiz_attempt, contact_message])
    db_session.commit()

    stats = service.get_admin_stats(db_session)

    assert stats.blog_posts.total == 1
    assert stats.forum_posts.total == 1
    assert stats.users.total == 1
    assert stats.quiz_attempts.total == 1
    assert stats.contact_messages.total == 1


def test_get_admin_stats_new_30d_excludes_older_rows(db_session):
    user = _make_user(db_session, "admin-stats-2@example.com")
    old_post = ForumPost(title="Bài cũ", body="Nội dung", category="general", author_id=user.id)
    db_session.add(old_post)
    db_session.commit()
    db_session.refresh(old_post)
    old_post.created_at = datetime.now(timezone.utc) - timedelta(days=40)
    db_session.commit()

    new_post = ForumPost(title="Bài mới", body="Nội dung", category="general", author_id=user.id)
    db_session.add(new_post)
    db_session.commit()

    stats = service.get_admin_stats(db_session)

    assert stats.forum_posts.total == 2
    assert stats.forum_posts.new_30d == 1


def test_get_admin_stats_contact_messages_unread_vs_total(db_session):
    read_message = ContactMessage(
        name="Khách 1", email="khach1@twistfit.vn", phone=None, subject="other", message="Xin chào", is_read=True
    )
    unread_message = ContactMessage(
        name="Khách 2", email="khach2@twistfit.vn", phone=None, subject="other", message="Xin chào"
    )
    db_session.add_all([read_message, unread_message])
    db_session.commit()

    stats = service.get_admin_stats(db_session)

    assert stats.contact_messages.total == 2
    assert stats.contact_messages.unread == 1
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/admin_stats/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.admin_stats'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/admin_stats/__init__.py` (empty).

Create `backend/app/domains/admin_stats/schemas.py`:

```python
from pydantic import Field

from app.domains.auth.schemas import CamelModel


class CountStats(CamelModel):
    total: int
    new_30d: int = Field(alias="new30d")


class ContactStats(CamelModel):
    total: int
    unread: int


class AdminStatsResponse(CamelModel):
    blog_posts: CountStats
    forum_posts: CountStats
    users: CountStats
    quiz_attempts: CountStats
    contact_messages: ContactStats
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/admin_stats/service.py`:

```python
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.domains.admin_stats.schemas import AdminStatsResponse, ContactStats, CountStats
from app.domains.auth.models import User
from app.domains.blog.models import BlogPost
from app.domains.contact.models import ContactMessage
from app.domains.forum.models import ForumPost
from app.domains.quiz_attempts.models import QuizAttempt


def get_admin_stats(db: Session) -> AdminStatsResponse:
    since = datetime.now(timezone.utc) - timedelta(days=30)

    return AdminStatsResponse(
        blog_posts=CountStats(
            total=db.query(BlogPost).count(),
            new_30d=db.query(BlogPost).filter(BlogPost.created_at >= since).count(),
        ),
        forum_posts=CountStats(
            total=db.query(ForumPost).count(),
            new_30d=db.query(ForumPost).filter(ForumPost.created_at >= since).count(),
        ),
        users=CountStats(
            total=db.query(User).count(),
            new_30d=db.query(User).filter(User.created_at >= since).count(),
        ),
        quiz_attempts=CountStats(
            total=db.query(QuizAttempt).count(),
            new_30d=db.query(QuizAttempt).filter(QuizAttempt.created_at >= since).count(),
        ),
        contact_messages=ContactStats(
            total=db.query(ContactMessage).count(),
            unread=db.query(ContactMessage).filter(ContactMessage.is_read.is_(False)).count(),
        ),
    )
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/admin_stats/test_service.py -v`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/admin_stats/__init__.py app/domains/admin_stats/schemas.py app/domains/admin_stats/service.py tests/domains/admin_stats
git commit -m "feat: add admin_stats schemas and service"
```

---

## Task 2: `admin_stats` domain — router

**Files:**
- Create: `backend/app/domains/admin_stats/router.py`
- Modify: `backend/app/main.py` (wire the router)
- Create: `backend/tests/domains/admin_stats/test_router.py`

**Interfaces:**
- Consumes: `service.get_admin_stats` (Task 1), `require_admin` (Phase 1's `app/deps.py`).
- Produces: `router` (FastAPI `APIRouter`, prefix `/admin`) with `GET /admin/stats`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/admin_stats/test_router.py`:

```python
def test_get_stats_requires_authentication(client):
    assert client.get("/admin/stats").status_code == 401


def test_get_stats_requires_admin_role(client):
    client.post(
        "/auth/register",
        json={"name": "User", "email": "admin-stats-user@example.com", "password": "password123"},
    )
    client.post("/auth/login", json={"email": "admin-stats-user@example.com", "password": "password123"})
    response = client.get("/admin/stats")
    assert response.status_code == 403


def test_get_stats_returns_the_full_shape_for_an_admin(client, db_session):
    from app.domains.auth.models import User

    client.post(
        "/auth/register",
        json={"name": "Admin", "email": "admin-stats-admin@example.com", "password": "password123"},
    )
    db_session.query(User).filter(User.email == "admin-stats-admin@example.com").update({"role": "admin"})
    db_session.commit()
    client.post("/auth/login", json={"email": "admin-stats-admin@example.com", "password": "password123"})

    response = client.get("/admin/stats")
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"blogPosts", "forumPosts", "users", "quizAttempts", "contactMessages"}
    assert set(body["blogPosts"].keys()) == {"total", "new30d"}
    assert set(body["contactMessages"].keys()) == {"total", "unread"}
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/admin_stats/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.admin_stats.router'`.

- [ ] **Step 3: Write the router**

Create `backend/app/domains/admin_stats/router.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.admin_stats import service
from app.domains.admin_stats.schemas import AdminStatsResponse
from app.domains.auth.models import User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return service.get_admin_stats(db)
```

- [ ] **Step 4: Wire the router into the app**

Modify `backend/app/main.py` — add the import next to the other domain router imports:

```python
from app.domains.admin_stats.router import router as admin_stats_router
```

and add the include next to the other `app.include_router(...)` calls:

```python
app.include_router(admin_stats_router)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/admin_stats/test_router.py -v`
Expected: PASS (3 tests).

- [ ] **Step 6: Run the full backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/admin_stats/router.py app/main.py tests/domains/admin_stats/test_router.py
git commit -m "feat: add admin_stats router"
```

---

## Task 3: Frontend `AdminStatsOverview` cutover

**Files:**
- Modify: `frontend/components/admin/AdminStatsOverview.tsx`
- Modify: `frontend/components/admin/AdminStatsOverview.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/admin/stats` endpoint (Task 2).
- Produces: `AdminStats` type, now exported directly from `AdminStatsOverview.tsx` instead of `lib/stats.ts`.
- Note: `lib/stats.ts` is **not** deleted in this task — that happens in Task 4, after this cutover is verified. Deleting it here first would break the import before the replacement lands.

- [ ] **Step 1: Update AdminStatsOverview to use apiClient and own its type**

Modify `frontend/components/admin/AdminStatsOverview.tsx` — replace the full file:

```typescript
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'

export type AdminStats = {
  blogPosts: { total: number; new30d: number }
  forumPosts: { total: number; new30d: number }
  users: { total: number; new30d: number }
  quizAttempts: { total: number; new30d: number }
  contactMessages: { total: number; unread: number }
}

export default function AdminStatsOverview() {
  const t = useTranslations('Admin.StatsOverview')
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    apiFetch('/admin/stats')
      .then((response) => response.json())
      .then(setStats)
  }, [])

  if (stats === null) {
    return <p className="mt-6 text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  const cards = [
    { title: t('blogTitle'), total: stats.blogPosts.total, sub: t('new30d', { count: stats.blogPosts.new30d }) },
    { title: t('forumTitle'), total: stats.forumPosts.total, sub: t('new30d', { count: stats.forumPosts.new30d }) },
    { title: t('usersTitle'), total: stats.users.total, sub: t('new30d', { count: stats.users.new30d }) },
    {
      title: t('quizTitle'),
      total: stats.quizAttempts.total,
      sub: t('new30d', { count: stats.quizAttempts.new30d }),
    },
    {
      title: t('contactTitle'),
      total: stats.contactMessages.total,
      sub: t('unread', { count: stats.contactMessages.unread }),
    },
  ]

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.title} className="rounded-2xl bg-surface-container p-4">
          <p className="text-label-sm text-on-surface-variant">{card.title}</p>
          <p className="mt-1 text-headline-sm font-bold text-on-surface">{card.total}</p>
          <p className="mt-1 text-label-sm text-on-surface-variant">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Update the test's import and fetch assertion**

Modify `frontend/components/admin/AdminStatsOverview.test.tsx`:

```typescript
import type { AdminStats } from './AdminStatsOverview'
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/admin/stats', { credentials: 'include' })
```

- [ ] **Step 3: Run the AdminStatsOverview tests**

Run: `cd frontend && npx vitest run components/admin/AdminStatsOverview.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
cd frontend
git add components/admin/AdminStatsOverview.tsx components/admin/AdminStatsOverview.test.tsx
git commit -m "feat: cut admin stats overview over to FastAPI"
```

---

## Task 4: Frontend legacy SQLite bridge retirement

**Files:**
- Modify: `frontend/components/auth/RegisterForm.tsx` (remove the mirror call)
- Modify: `frontend/components/auth/RegisterForm.test.tsx`
- Delete: `frontend/app/api/admin/stats/route.ts`, `frontend/app/api/admin/stats/route.test.ts`
- Delete: `frontend/app/api/auth/register/route.ts`, `frontend/app/api/auth/register/route.test.ts`, `frontend/app/api/auth/register/validate.ts`, `frontend/app/api/auth/register/validate.test.ts`
- Delete: `frontend/lib/stats.ts`, `frontend/lib/stats.test.ts`
- Delete: `frontend/lib/quizAttempts.ts`
- Delete: `frontend/lib/auth/session.ts`, `frontend/lib/auth/session.test.ts`
- Delete: `frontend/lib/getDb.ts`
- Modify: `frontend/lib/db.ts` (trim to shared types only)
- Modify: `frontend/lib/contact.ts` (trim to shared types only)
- Modify: `frontend/lib/forum.ts` (trim to shared types only)
- Modify: `frontend/lib/auth/users.ts` (trim to just the `Role` type)
- Delete: `frontend/lib/auth/users.test.ts`

**Interfaces:**
- Consumes: nothing new — this task only removes dead code once Task 3's cutover has landed.

- [ ] **Step 1: Remove the mirror call from RegisterForm**

Modify `frontend/components/auth/RegisterForm.tsx` — remove this block entirely (it sits between the successful `/auth/register` response check and `setFormError(null)`):

```typescript
    // Mirror the new user into the legacy SQLite users table (unmodified
    // /api/auth/register route) so forum — which still queries that table
    // directly — can resolve this user after registration.
    void fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).catch(() => {})

```

- [ ] **Step 2: Simplify the RegisterForm success test**

Modify `frontend/components/auth/RegisterForm.test.tsx` — the mock in the success-path test branches on `url === '/api/auth/register'` only because the mirror call needed a different response shape than the real `/auth/register` call. With the mirror gone, replace it with a flat mock:

```typescript
  it('registers, logs in, and redirects to the homepage on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: 'Linh Đan', email: 'linhdan@gmail.com', role: 'user' }) })
    )
    renderRegisterForm()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'))
  })
```

- [ ] **Step 3: Run the RegisterForm tests**

Run: `cd frontend && npx vitest run components/auth/RegisterForm.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 4: Delete the now-dead admin/stats and auth/register Next.js routes**

```bash
cd frontend
rm -r app/api/admin/stats
rm -r app/api/auth/register
```

- [ ] **Step 5: Delete `lib/stats.ts` and its test**

```bash
cd frontend
git rm lib/stats.ts lib/stats.test.ts
```

- [ ] **Step 6: Delete `lib/quizAttempts.ts`**

```bash
cd frontend
git rm lib/quizAttempts.ts
```

- [ ] **Step 7: Delete `lib/auth/session.ts` and its test**

```bash
cd frontend
git rm lib/auth/session.ts lib/auth/session.test.ts
```

- [ ] **Step 8: Delete `lib/getDb.ts`**

```bash
cd frontend
git rm lib/getDb.ts
```

- [ ] **Step 9: Trim `lib/db.ts` to shared types only**

Modify `frontend/lib/db.ts` — replace the entire file with:

```typescript
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export type BlogCategory = 'personal-color' | 'styling' | 'sustainable' | 'beauty' | 'community'
export const BLOG_CATEGORIES: BlogCategory[] = [
  'personal-color',
  'styling',
  'sustainable',
  'beauty',
  'community',
]

export type BlogPost = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  coverImageUrl: string
  category: BlogCategory
  authorName: string | null
  isFeatured: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export type QuizOption = {
  id: number
  label: string
  season: Season
  sortOrder: number
}

export type QuizQuestion = {
  id: number
  questionText: string
  sortOrder: number
  options: QuizOption[]
}
```

- [ ] **Step 10: Trim `lib/contact.ts` to shared types only**

Modify `frontend/lib/contact.ts` — replace the entire file with:

```typescript
export type ContactSubject = 'color-test' | 'virtual-fitting' | 'stylist' | 'other'

export type ContactMessage = {
  id: number
  name: string
  email: string
  phone: string | null
  subject: ContactSubject
  message: string
  isRead: boolean
  createdAt: string
}

export type ContactMessageInput = {
  name: string
  email: string
  phone: string | null
  subject: ContactSubject
  message: string
}
```

- [ ] **Step 11: Trim `lib/forum.ts` to shared types only**

Modify `frontend/lib/forum.ts` — replace the entire file with:

```typescript
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

- [ ] **Step 12: Trim `lib/auth/users.ts` to just the `Role` type**

Modify `frontend/lib/auth/users.ts` — replace the entire file with:

```typescript
// `Role` is the only export still used in production, by
// components/auth/AuthProvider.tsx — a JWT-era, client-side concept
// unrelated to the SQLite `users` table this file used to back.
export type Role = 'user' | 'admin'
```

- [ ] **Step 13: Delete the SQLite CRUD test file for `lib/auth/users.ts`**

```bash
cd frontend
git rm lib/auth/users.test.ts
```

- [ ] **Step 14: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass.

- [ ] **Step 15: Commit**

```bash
cd frontend
git add components/auth/RegisterForm.tsx components/auth/RegisterForm.test.tsx
git add lib/db.ts lib/contact.ts lib/forum.ts lib/auth/users.ts
git rm -r app/api/admin/stats app/api/auth/register
git commit -m "feat: retire the legacy SQLite bridge now that every domain has migrated"
```

---

## Task 5: Backend legacy cookie retirement

**Files:**
- Modify: `backend/app/core/security.py`
- Modify: `backend/app/domains/auth/router.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/README.md`
- Modify: `backend/tests/domains/auth/test_security.py`
- Modify: `backend/tests/domains/auth/test_router.py`

**Interfaces:**
- Consumes: nothing new — this task only removes dead code once every frontend domain (confirmed in Phase 5, reconfirmed by Task 4 of this plan) has stopped depending on the legacy cookie.

- [ ] **Step 1: Remove the legacy cookie functions and constants from security.py**

Modify `backend/app/core/security.py` — replace the entire file with:

```python
import hashlib
import secrets
import time

import jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TTL_SECONDS = 15 * 60
REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _pwd_context.verify(password, password_hash)


def create_access_token(user_id: int, role: str) -> str:
    payload = {"sub": str(user_id), "role": role, "exp": int(time.time()) + ACCESS_TOKEN_TTL_SECONDS}
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
```

- [ ] **Step 2: Remove the legacy cookie from the auth router**

Modify `backend/app/domains/auth/router.py` — update the import block:

```python
from app.core.config import settings
from app.core.security import ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS
from app.db.session import get_db
from app.deps import get_current_user
from app.domains.auth import service
from app.domains.auth.models import User
from app.domains.auth.schemas import AccountResponse, LoginRequest, RegisterRequest, UserResponse
```

Replace `_set_auth_cookies` and `_clear_auth_cookies` (the `user` parameter is dropped from `_set_auth_cookies` — it was only needed to build the legacy cookie):

```python
def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        "access_token", access_token, httponly=True, secure=settings.cookie_secure, samesite="lax",
        domain=settings.cookie_domain, max_age=ACCESS_TOKEN_TTL_SECONDS, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh_token, httponly=True, secure=settings.cookie_secure, samesite="lax",
        domain=settings.cookie_domain, max_age=REFRESH_TOKEN_TTL_SECONDS, path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    for name in ("access_token", "refresh_token"):
        response.delete_cookie(name, domain=settings.cookie_domain, path="/")
```

Update both call sites to drop the `user` argument:

```python
    access_token, refresh_token = service.issue_tokens(db, user)
    _set_auth_cookies(response, access_token, refresh_token)
    return user
```

```python
    new_access_token, new_refresh_token, user = rotated
    _set_auth_cookies(response, new_access_token, new_refresh_token)
    return user
```

- [ ] **Step 3: Remove the now-unused `auth_cookie_secret` setting**

Modify `backend/app/core/config.py` — remove this line:

```python
    auth_cookie_secret: str = "dev-only-insecure-secret"
```

- [ ] **Step 4: Update the backend tests**

Modify `backend/tests/domains/auth/test_security.py` — replace the entire file with:

```python
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)


def test_hash_password_round_trips():
    hashed = hash_password("s3cret123")
    assert hashed != "s3cret123"
    assert verify_password("s3cret123", hashed)
    assert not verify_password("wrong", hashed)


def test_access_token_round_trips():
    token = create_access_token(user_id=42, role="admin")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["role"] == "admin"


def test_decode_access_token_rejects_garbage():
    assert decode_access_token("not-a-token") is None


def test_generate_refresh_token_is_unique_and_hash_is_deterministic():
    token_a = generate_refresh_token()
    token_b = generate_refresh_token()
    assert token_a != token_b
    assert hash_refresh_token(token_a) == hash_refresh_token(token_a)
    assert hash_refresh_token(token_a) != hash_refresh_token(token_b)
```

Modify `backend/tests/domains/auth/test_router.py` — remove this line from `test_login_sets_cookies_and_returns_account`:

```python
    assert "twistfit_session" in response.cookies
```

- [ ] **Step 5: Remove the "Legacy bridge" section from the README**

Modify `backend/README.md` — remove this section from the end of the file:

```markdown
## Legacy bridge — remove only once forum, quiz-attempts, and every other
## still-Next.js domain has its own migration phase

`/auth/login` and `/auth/logout` also manage a legacy `twistfit_session`
cookie (see `app/core/security.py::create_legacy_session_cookie_value`) so
the 10 domains not yet migrated off Next.js/SQLite keep working. Do not
remove this, or `AUTH_COOKIE_SECRET`, until those domains are migrated.
```

- [ ] **Step 6: Run the full backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests pass, and no test asserts `twistfit_session` appears anywhere.

- [ ] **Step 7: Manually verify in the browser**

With PostgreSQL running, the backend running (`cd backend && uvicorn app.main:app --reload`) and the frontend running (`cd frontend && npm run dev`), with `frontend/.env.local` containing `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`:
- Log in as `admin@twistfit.vn` / `admin1234`.
- Open browser dev tools → Application/Storage → Cookies for `localhost` — confirm only `access_token` and `refresh_token` are present, no `twistfit_session`.
- Visit the admin dashboard page that renders `AdminStatsOverview` — confirm all five stat cards render with real numbers from Postgres (not zeroed-out legacy placeholders).
- Register a brand-new account — confirm it still works end-to-end (register → auto-login → redirect), with no network request to `/api/auth/register` in the dev tools Network tab.

- [ ] **Step 8: Commit**

```bash
cd backend
git add app/core/security.py app/domains/auth/router.py app/core/config.py README.md
git add tests/domains/auth/test_security.py tests/domains/auth/test_router.py
git commit -m "feat: retire the legacy twistfit_session cookie bridge"
```
