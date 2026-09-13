# Content Domains Migration (blog, quiz-questions) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `blog` and `quiz-questions` from Next.js/SQLite to the FastAPI backend, and cut the frontend fully over, deleting the old implementation.

**Architecture:** Two new self-contained domains under `app/domains/{blog,quiz}/` in the backend, following the `models.py`/`schemas.py`/`service.py`/`router.py` shape established in Phase 1/2. `blog` and `quiz-questions` currently share one Next.js module (`frontend/lib/db.ts`) and are migrated together so that file can be trimmed once. Frontend Server Components and admin CRUD pages switch from direct SQLite lib calls / `fetch('/api/...')` to `apiFetch('/...')`, same mechanical change as every prior phase.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL (unchanged from Phase 1/2). Frontend: Next.js 16, Vitest (unchanged).

**Spec:** `docs/superpowers/specs/2026-09-14-content-domains-migration-design.md`

## Global Constraints

- `blog` and `quiz-questions` are migrated together in this one phase because they share `frontend/lib/db.ts` and its wiring in `frontend/lib/getDb.ts` — that shared file is only safe to trim once both are fully cut over (see Task 8).
- `frontend/lib/db.ts` keeps exporting `BlogPost`, `BlogCategory`, `BLOG_CATEGORIES`, `QuizQuestion`, `QuizOption`, `Season`, `SEASONS` after trimming — `quiz-attempts` (out of scope this phase) imports `Season`/`SEASONS` from it.
- Blog's `content` field is stored and returned as raw markdown, never rendered server-side — `frontend/lib/markdown.ts` and `frontend/lib/readingTime.ts` are untouched.
- "Enum-like" string fields (`category`, `season`) are plain `String` Postgres columns validated in Pydantic — never Postgres native `ENUM`, matching every prior domain.
- Blog slug conflicts return `409` with `HTTPException(detail="SLUG_TAKEN")` (matching the exact `EMAIL_TAKEN` pattern from Phase 1's auth router) — not the old field-level `400` shape.
- Every admin form's error handling on any failed submit: `401`/`403` → `t('unauthorizedError')`; any other non-2xx → `t('genericError')` (Vietnamese: "Có lỗi xảy ra, vui lòng thử lại." / "Bạn cần đăng nhập với quyền quản trị.") — no per-field error parsing, matching every prior phase.
- Backend tests run against the real Postgres test database via the existing `tests/conftest.py` fixtures (`db_session`, `client`) — no mocks, no SQLite.
- The FastAPI route for `/blog/slug/{slug}` must be registered before `/blog/{post_id}` — otherwise FastAPI would match a request like `/blog/slug/foo` against the `/{post_id}` pattern first.

---

## Task 1: `blog` domain — model, migration, seed data

**Files:**
- Create: `backend/app/domains/blog/__init__.py`
- Create: `backend/app/domains/blog/models.py`
- Modify: `backend/alembic/env.py` (register the model)
- Create: `backend/app/domains/blog/seed.py`
- Modify: `backend/app/main.py` (seed on startup)
- Create: `backend/tests/domains/blog/__init__.py`
- Create: `backend/tests/domains/blog/test_seed.py`

**Interfaces:**
- Consumes: `app.db.session.Base` (Phase 1).
- Produces: `app.domains.blog.models.BlogPost` (columns: `id`, `slug`, `title`, `excerpt`, `content`, `cover_image_url`, `category`, `author_name`, `is_featured`, `published_at`, `created_at`, `updated_at`). Produces: `seed_demo_blog_posts(db: Session) -> None`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/blog/__init__.py` (empty).

Create `backend/tests/domains/blog/test_seed.py`:

```python
from app.domains.blog.models import BlogPost
from app.domains.blog.seed import seed_demo_blog_posts


def test_seed_demo_blog_posts_creates_seven_posts(db_session):
    seed_demo_blog_posts(db_session)
    posts = db_session.query(BlogPost).all()
    assert len(posts) == 7
    slugs = {post.slug for post in posts}
    assert "bi-quyet-chon-trang-phuc-ton-da-mua-dong-2026" in slugs


def test_seed_demo_blog_posts_is_idempotent(db_session):
    seed_demo_blog_posts(db_session)
    seed_demo_blog_posts(db_session)
    assert db_session.query(BlogPost).count() == 7
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/blog/test_seed.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.blog'`.

- [ ] **Step 3: Create the model**

Create `backend/app/domains/blog/__init__.py` (empty).

Create `backend/app/domains/blog/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class BlogPost(Base):
    __tablename__ = "blog_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    cover_image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    author_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    published_at: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
```

Note: `published_at` is a plain `String`, not a `DateTime` — the admin form submits a bare `YYYY-MM-DD` string from an `<input type="date">` and the public page displays it verbatim; there is no date parsing on either side today, and this migration preserves that exactly.

- [ ] **Step 4: Register the model with Alembic**

Modify `backend/alembic/env.py` — add this line next to the existing model imports:

```python
from app.domains.blog import models as blog_models  # noqa: F401
```

- [ ] **Step 5: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "create blog_posts table"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\d blog_posts'` shows the expected columns.

- [ ] **Step 6: Write the seed data**

Create `backend/app/domains/blog/seed.py`:

```python
from sqlalchemy.orm import Session

from app.domains.blog.models import BlogPost

DEMO_BLOG_POSTS = [
    {
        "slug": "bi-quyet-chon-trang-phuc-ton-da-mua-dong-2026",
        "title": "Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông - Xu hướng mới nhất 2026",
        "excerpt": (
            "Khám phá sức hút mãnh liệt của sự tương phản cao và cách kết hợp trang phục lạnh sáng sắc nét "
            "giúp tôn vinh thần thái tự nhiên, đánh bật mọi khung hình."
        ),
        "content": (
            "Khám phá sức hút mãnh liệt của sự tương phản cao và cách kết hợp trang phục lạnh sáng sắc nét "
            "giúp tôn vinh thần thái tự nhiên, đánh bật mọi khung hình."
        ),
        "cover_image_url": "/blog/featured-winter-outfit.jpg",
        "category": "personal-color",
        "author_name": "Stylist Mai Anh",
        "is_featured": True,
        "published_at": "2026-06-18",
    },
    {
        "slug": "top-5-thoi-son-cool-undertone",
        "title": "Top 5 thỏi son kinh điển dành riêng cho cô nàng thuộc nhóm Cool Undertone",
        "excerpt": (
            "Sự thanh khiết và dịu mát của tone Mùa Hạ đến sắc son có sắc hồng dịu, tím sữa hoặc berry nhẹ "
            "để đôi môi luôn ửng hồng tự nhiên mà không bị già."
        ),
        "content": (
            "Sự thanh khiết và dịu mát của tone Mùa Hạ đến sắc son có sắc hồng dịu, tím sữa hoặc berry nhẹ "
            "để đôi môi luôn ửng hồng tự nhiên mà không bị già."
        ),
        "cover_image_url": "/blog/lipstick-flatlay.jpg",
        "category": "beauty",
        "author_name": None,
        "is_featured": False,
        "published_at": "2026-06-18",
    },
    {
        "slug": "tu-do-con-nhong-30-mon",
        "title": "Tủ đồ con nhộng (Capsule Wardrobe): Tối ưu 30 món mặc đẹp quanh năm",
        "excerpt": (
            "Hướng dẫn chi tiết từng bước thanh lọc trang phục lỗi thời, tập trung vào những món đồ bền "
            "vững có tính ứng dụng cao và chuẩn sắc thái cá nhân."
        ),
        "content": (
            "Hướng dẫn chi tiết từng bước thanh lọc trang phục lỗi thời, tập trung vào những món đồ bền "
            "vững có tính ứng dụng cao và chuẩn sắc thái cá nhân."
        ),
        "cover_image_url": "/blog/capsule-wardrobe-rail.jpg",
        "category": "sustainable",
        "author_name": None,
        "is_featured": False,
        "published_at": "2026-05-09",
    },
    {
        "slug": "doi-quan-ao-cu-nhan-phan-tich-mau-mien-phi",
        "title": "Chiến dịch 'Đổi Quần Áo Cũ - Nhận Bản Phân Tích Màu Sắc Miễn Phí'",
        "excerpt": (
            "Chung tay cùng TwistFit giảm thiểu rác thải thời trang dệt may, mang lại vòng đời mới cho "
            "trang phục và nâng cấp gu ăn mặc của chính bạn."
        ),
        "content": (
            "Chung tay cùng TwistFit giảm thiểu rác thải thời trang dệt may, mang lại vòng đời mới cho "
            "trang phục và nâng cấp gu ăn mặc của chính bạn."
        ),
        "cover_image_url": "/blog/community-swap.jpg",
        "category": "community",
        "author_name": None,
        "is_featured": False,
        "published_at": "2026-05-06",
    },
    {
        "slug": "nhan-biet-warm-cool-undertone-tai-nha",
        "title": "Cách nhận biết Warm Undertone vs Cool Undertone chính xác tại nhà chỉ trong 1 phút",
        "excerpt": (
            "Chỉ với ánh sáng tự nhiên và vài mẹo quan sát mạch máu hoặc trang sức vàng bạc, bạn hoàn toàn "
            "có thể tự kiểm tra sắc thái da cơ bản."
        ),
        "content": (
            "Chỉ với ánh sáng tự nhiên và vài mẹo quan sát mạch máu hoặc trang sức vàng bạc, bạn hoàn toàn "
            "có thể tự kiểm tra sắc thái da cơ bản."
        ),
        "cover_image_url": "/blog/undertone-draping.jpg",
        "category": "personal-color",
        "author_name": None,
        "is_featured": False,
        "published_at": "2026-04-28",
    },
    {
        "slug": "phoi-layer-ton-dang-lung-dai-chan-ngan",
        "title": "Bí kíp phối layer tôn dáng cho người có tỷ lệ lưng dài chân ngắn",
        "excerpt": (
            "Tận dụng độ cạp cao của quần âu, áo croptop lửng và sự tương phản màu sắc giúp 'hack' chiều "
            "cao hiệu quả trên tính năng thử đồ ảo TwistFit."
        ),
        "content": (
            "Tận dụng độ cạp cao của quần âu, áo croptop lửng và sự tương phản màu sắc giúp 'hack' chiều "
            "cao hiệu quả trên tính năng thử đồ ảo TwistFit."
        ),
        "cover_image_url": "/blog/proportion-styling-flatlay.jpg",
        "category": "styling",
        "author_name": None,
        "is_featured": False,
        "published_at": "2026-04-20",
    },
    {
        "slug": "bang-mau-mua-thu-am-ap",
        "title": "Sức hút ấm áp từ bảng màu Mùa Thu (Autumn Warm): Khi tone đất lên ngôi",
        "excerpt": (
            "Những gam màu nâu caramel, cam cháy và rêu olive mang đến sự quý phái, đằm thắm cho những "
            "buổi hẹn hò hoặc sự kiện trang trọng."
        ),
        "content": (
            "Những gam màu nâu caramel, cam cháy và rêu olive mang đến sự quý phái, đằm thắm cho những "
            "buổi hẹn hò hoặc sự kiện trang trọng."
        ),
        "cover_image_url": "/blog/autumn-palette-moodboard.jpg",
        "category": "personal-color",
        "author_name": None,
        "is_featured": False,
        "published_at": "2026-04-12",
    },
]


def seed_demo_blog_posts(db: Session) -> None:
    if db.query(BlogPost).count() > 0:
        return
    for post in DEMO_BLOG_POSTS:
        db.add(BlogPost(**post))
    db.commit()
```

- [ ] **Step 7: Wire seeding into app startup**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.blog.seed import seed_demo_blog_posts
```

In `lifespan`, add the call alongside the existing seed calls:

```python
        seed_demo_blog_posts(db)
```

- [ ] **Step 8: Run the test and verify it passes**

Run: `cd backend && pytest tests/domains/blog/test_seed.py -v`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
cd backend
git add app/domains/blog alembic/env.py alembic/versions app/main.py tests/domains/blog
git commit -m "feat: add blog model, migration, and seed data"
```

---

## Task 2: `blog` domain — schemas and service

**Files:**
- Create: `backend/app/domains/blog/schemas.py`
- Create: `backend/app/domains/blog/service.py`
- Create: `backend/tests/domains/blog/test_service.py`

**Interfaces:**
- Consumes: `app.domains.auth.schemas.CamelModel` (Phase 1); `app.domains.blog.models.BlogPost` (Task 1).
- Produces: `BLOG_CATEGORIES: list[str]`, `BlogPostInput` (Pydantic model — `slug` optional/blank-allowed), `BlogPostResponse`; `SlugAlreadyTakenError` (exception); `slugify(value: str) -> str`; `list_blog_posts(db) -> list[BlogPost]`, `get_blog_post(db, post_id) -> BlogPost | None`, `get_blog_post_by_slug(db, slug) -> BlogPost | None`, `create_blog_post(db, data: BlogPostInput) -> BlogPost` (raises `SlugAlreadyTakenError`), `update_blog_post(db, post_id, data: BlogPostInput) -> BlogPost | None` (raises `SlugAlreadyTakenError`), `delete_blog_post(db, post_id) -> bool`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/blog/test_service.py`:

```python
import pytest
from pydantic import ValidationError

from app.domains.blog import service
from app.domains.blog.schemas import BlogPostInput

VALID_INPUT = {
    "title": "Bài Test",
    "excerpt": "Mô tả",
    "content": "Nội dung",
    "coverImageUrl": "/blog/test.jpg",
    "category": "styling",
    "authorName": None,
    "isFeatured": False,
    "publishedAt": "2026-01-01",
}


def test_slugify_strips_vietnamese_diacritics_and_dashes():
    assert (
        service.slugify("Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông")
        == "bi-quyet-chon-trang-phuc-ton-da-chuan-tone-mua-dong"
    )


def test_create_blog_post_generates_slug_from_title_when_blank(db_session):
    post = service.create_blog_post(db_session, BlogPostInput(**VALID_INPUT))
    assert post.slug == "bai-test"


def test_create_blog_post_uses_provided_slug(db_session):
    post = service.create_blog_post(db_session, BlogPostInput(**{**VALID_INPUT, "slug": "custom-slug"}))
    assert post.slug == "custom-slug"


def test_create_blog_post_rejects_duplicate_slug(db_session):
    service.create_blog_post(db_session, BlogPostInput(**{**VALID_INPUT, "slug": "dup"}))
    with pytest.raises(service.SlugAlreadyTakenError):
        service.create_blog_post(db_session, BlogPostInput(**{**VALID_INPUT, "slug": "dup", "title": "Khác"}))


def test_update_blog_post_allows_keeping_its_own_slug(db_session):
    post = service.create_blog_post(db_session, BlogPostInput(**{**VALID_INPUT, "slug": "keep-me"}))
    updated = service.update_blog_post(
        db_session, post.id, BlogPostInput(**{**VALID_INPUT, "slug": "keep-me", "title": "Đã sửa"})
    )
    assert updated is not None
    assert updated.title == "Đã sửa"
    assert updated.slug == "keep-me"


def test_update_blog_post_rejects_slug_taken_by_another_post(db_session):
    service.create_blog_post(db_session, BlogPostInput(**{**VALID_INPUT, "slug": "post-a"}))
    post_b = service.create_blog_post(db_session, BlogPostInput(**{**VALID_INPUT, "slug": "post-b"}))
    with pytest.raises(service.SlugAlreadyTakenError):
        service.update_blog_post(db_session, post_b.id, BlogPostInput(**{**VALID_INPUT, "slug": "post-a"}))


def test_update_blog_post_returns_none_when_missing(db_session):
    assert service.update_blog_post(db_session, 99999, BlogPostInput(**VALID_INPUT)) is None


def test_list_blog_posts_orders_by_published_at_desc(db_session):
    service.create_blog_post(
        db_session, BlogPostInput(**{**VALID_INPUT, "slug": "older", "publishedAt": "2026-01-01"})
    )
    service.create_blog_post(
        db_session, BlogPostInput(**{**VALID_INPUT, "slug": "newer", "publishedAt": "2026-06-01"})
    )
    posts = service.list_blog_posts(db_session)
    assert [post.slug for post in posts] == ["newer", "older"]


def test_get_blog_post_by_slug(db_session):
    service.create_blog_post(db_session, BlogPostInput(**{**VALID_INPUT, "slug": "find-me"}))
    found = service.get_blog_post_by_slug(db_session, "find-me")
    assert found is not None
    assert found.slug == "find-me"


def test_get_blog_post_by_slug_returns_none_when_missing(db_session):
    assert service.get_blog_post_by_slug(db_session, "nope") is None


def test_delete_blog_post(db_session):
    post = service.create_blog_post(db_session, BlogPostInput(**{**VALID_INPUT, "slug": "to-delete"}))
    assert service.delete_blog_post(db_session, post.id) is True
    assert service.get_blog_post(db_session, post.id) is None


def test_delete_blog_post_returns_false_when_missing(db_session):
    assert service.delete_blog_post(db_session, 99999) is False


def test_blog_post_input_rejects_blank_title():
    with pytest.raises(ValidationError):
        BlogPostInput(**{**VALID_INPUT, "title": "   "})


def test_blog_post_input_rejects_invalid_category():
    with pytest.raises(ValidationError):
        BlogPostInput(**{**VALID_INPUT, "category": "not-a-real-category"})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/blog/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.blog.schemas'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/blog/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

BLOG_CATEGORIES = ["personal-color", "styling", "sustainable", "beauty", "community"]


class BlogPostInput(CamelModel):
    slug: str = ""
    title: str
    excerpt: str
    content: str
    cover_image_url: str
    category: str
    author_name: str | None = None
    is_featured: bool = False
    published_at: str

    @field_validator("title", "excerpt", "content", "cover_image_url", "published_at")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Trường này không được để trống")
        return value.strip()

    @field_validator("category")
    @classmethod
    def category_valid(cls, value: str) -> str:
        if value not in BLOG_CATEGORIES:
            raise ValueError("Chuyên mục không hợp lệ")
        return value

    @field_validator("author_name")
    @classmethod
    def normalize_author_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return value.strip()


class BlogPostResponse(CamelModel):
    id: int
    slug: str
    title: str
    excerpt: str
    content: str
    cover_image_url: str
    category: str
    author_name: str | None
    is_featured: bool
    published_at: str
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/blog/service.py`:

```python
import re
import unicodedata

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domains.blog.models import BlogPost
from app.domains.blog.schemas import BlogPostInput


class SlugAlreadyTakenError(Exception):
    pass


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    without_marks = without_marks.replace("đ", "d").replace("Đ", "d")
    lowered = without_marks.lower().strip()
    dashed = re.sub(r"[^a-z0-9]+", "-", lowered)
    return dashed.strip("-")


def _is_slug_taken(db: Session, slug: str, exclude_id: int | None = None) -> bool:
    query = select(BlogPost.id).where(BlogPost.slug == slug)
    if exclude_id is not None:
        query = query.where(BlogPost.id != exclude_id)
    return db.execute(query).first() is not None


def list_blog_posts(db: Session) -> list[BlogPost]:
    return db.query(BlogPost).order_by(BlogPost.published_at.desc()).all()


def get_blog_post(db: Session, post_id: int) -> BlogPost | None:
    return db.get(BlogPost, post_id)


def get_blog_post_by_slug(db: Session, slug: str) -> BlogPost | None:
    return db.execute(select(BlogPost).where(BlogPost.slug == slug)).scalar_one_or_none()


def create_blog_post(db: Session, data: BlogPostInput) -> BlogPost:
    slug = slugify(data.slug or data.title)
    if _is_slug_taken(db, slug):
        raise SlugAlreadyTakenError(slug)

    row = data.model_dump()
    row["slug"] = slug
    post = BlogPost(**row)
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def update_blog_post(db: Session, post_id: int, data: BlogPostInput) -> BlogPost | None:
    post = get_blog_post(db, post_id)
    if post is None:
        return None

    slug = slugify(data.slug or data.title)
    if _is_slug_taken(db, slug, exclude_id=post_id):
        raise SlugAlreadyTakenError(slug)

    row = data.model_dump()
    row["slug"] = slug
    for field, value in row.items():
        setattr(post, field, value)
    db.commit()
    db.refresh(post)
    return post


def delete_blog_post(db: Session, post_id: int) -> bool:
    post = get_blog_post(db, post_id)
    if post is None:
        return False
    db.delete(post)
    db.commit()
    return True
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/blog/test_service.py -v`
Expected: PASS (14 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/blog/schemas.py app/domains/blog/service.py tests/domains/blog/test_service.py
git commit -m "feat: add blog schemas with slug generation/uniqueness and service"
```

---

## Task 3: `blog` domain — router

**Files:**
- Create: `backend/app/domains/blog/router.py`
- Modify: `backend/app/main.py` (mount the router)
- Create: `backend/tests/domains/blog/test_router.py`

**Interfaces:**
- Consumes: `service.*` (Task 2), `require_admin` (Phase 1).
- Produces: `app.domains.blog.router.router`, an `APIRouter` mounted at prefix `/blog` with routes `GET /`, `GET /slug/{slug}`, `GET /{post_id}`, `POST /` (admin), `PUT /{post_id}` (admin), `DELETE /{post_id}` (admin).

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/blog/test_router.py`:

```python
VALID_BODY = {
    "title": "Bài Test",
    "excerpt": "Mô tả",
    "content": "Nội dung",
    "coverImageUrl": "/blog/test.jpg",
    "category": "styling",
    "authorName": None,
    "isFeatured": False,
    "publishedAt": "2026-01-01",
}


def _promote_to_admin(db_session, email: str) -> None:
    from app.domains.auth.models import User

    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()


def test_list_blog_posts_is_public(client):
    response = client.get("/blog")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_blog_post_by_id_returns_404_when_missing(client):
    response = client.get("/blog/99999")
    assert response.status_code == 404


def test_get_blog_post_by_slug_returns_404_when_missing(client):
    response = client.get("/blog/slug/khong-ton-tai")
    assert response.status_code == 404


def test_create_blog_post_requires_authentication(client):
    response = client.post("/blog", json=VALID_BODY)
    assert response.status_code == 401


def test_create_blog_post_requires_admin_role(client, db_session):
    client.post("/auth/register", json={"name": "T", "email": "blog-user@example.com", "password": "password123"})
    client.post("/auth/login", json={"email": "blog-user@example.com", "password": "password123"})
    response = client.post("/blog", json=VALID_BODY)
    assert response.status_code == 403


def test_admin_can_create_get_by_slug_update_and_delete_blog_post(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "email": "blog-admin@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "blog-admin@example.com")
    client.post("/auth/login", json={"email": "blog-admin@example.com", "password": "password123"})

    create_response = client.post("/blog", json={**VALID_BODY, "slug": "bai-test-router"})
    assert create_response.status_code == 201
    post_id = create_response.json()["id"]
    assert create_response.json()["slug"] == "bai-test-router"

    slug_response = client.get("/blog/slug/bai-test-router")
    assert slug_response.status_code == 200
    assert slug_response.json()["id"] == post_id

    update_response = client.put(
        f"/blog/{post_id}", json={**VALID_BODY, "slug": "bai-test-router", "title": "Đã sửa"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Đã sửa"

    delete_response = client.delete(f"/blog/{post_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/blog/{post_id}").status_code == 404


def test_create_blog_post_rejects_duplicate_slug_with_409(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "email": "blog-admin2@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "blog-admin2@example.com")
    client.post("/auth/login", json={"email": "blog-admin2@example.com", "password": "password123"})

    client.post("/blog", json={**VALID_BODY, "slug": "trung-slug"})
    response = client.post("/blog", json={**VALID_BODY, "slug": "trung-slug"})
    assert response.status_code == 409
    assert response.json()["detail"] == "SLUG_TAKEN"


def test_create_blog_post_rejects_invalid_body(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "email": "blog-admin3@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "blog-admin3@example.com")
    client.post("/auth/login", json={"email": "blog-admin3@example.com", "password": "password123"})

    response = client.post("/blog", json={**VALID_BODY, "title": ""})
    assert response.status_code == 422
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/blog/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.blog.router'`.

- [ ] **Step 3: Write the router**

Create `backend/app/domains/blog/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.blog import service
from app.domains.blog.schemas import BlogPostInput, BlogPostResponse

router = APIRouter(prefix="/blog", tags=["blog"])


@router.get("", response_model=list[BlogPostResponse])
def list_items(db: Session = Depends(get_db)):
    return service.list_blog_posts(db)


@router.get("/slug/{slug}", response_model=BlogPostResponse)
def get_by_slug(slug: str, db: Session = Depends(get_db)):
    post = service.get_blog_post_by_slug(db, slug)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    return post


@router.get("/{post_id}", response_model=BlogPostResponse)
def get_item(post_id: int, db: Session = Depends(get_db)):
    post = service.get_blog_post(db, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    return post


@router.post("", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
def create_item(body: BlogPostInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    try:
        return service.create_blog_post(db, body)
    except service.SlugAlreadyTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SLUG_TAKEN")


@router.put("/{post_id}", response_model=BlogPostResponse)
def update_item(post_id: int, body: BlogPostInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    try:
        updated = service.update_blog_post(db, post_id, body)
    except service.SlugAlreadyTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="SLUG_TAKEN")
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
    return updated


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(post_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    deleted = service.delete_blog_post(db, post_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài viết")
```

Note: `/slug/{slug}` is defined **before** `/{post_id}` in this file — FastAPI matches routes in registration order, so this ordering is required for `/blog/slug/foo` to resolve to `get_by_slug` rather than being captured by `get_item`'s `{post_id}` pattern.

- [ ] **Step 4: Mount the router**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.blog.router import router as blog_router
```

Add after the last `app.include_router(...)` line:

```python
app.include_router(blog_router)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/blog/test_router.py -v`
Expected: PASS (8 tests).

- [ ] **Step 6: Run the entire backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/blog/router.py app/main.py tests/domains/blog/test_router.py
git commit -m "feat: add blog router with slug lookup and admin-gated writes"
```

---

## Task 4: `quiz` domain — models, migration, seed data

**Files:**
- Create: `backend/app/domains/quiz/__init__.py`
- Create: `backend/app/domains/quiz/models.py`
- Modify: `backend/alembic/env.py` (register the models)
- Create: `backend/app/domains/quiz/seed.py`
- Modify: `backend/app/main.py` (seed on startup)
- Create: `backend/tests/domains/quiz/__init__.py`
- Create: `backend/tests/domains/quiz/test_seed.py`

**Interfaces:**
- Consumes: `app.db.session.Base` (Phase 1).
- Produces: `app.domains.quiz.models.QuizQuestion` (columns: `id`, `question_text`, `sort_order`; relationship `options` ordered by `sort_order`, cascade delete), `app.domains.quiz.models.QuizOption` (columns: `id`, `question_id` (FK), `label`, `season`, `sort_order`). Produces: `seed_demo_quiz_questions(db: Session) -> None`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/quiz/__init__.py` (empty).

Create `backend/tests/domains/quiz/test_seed.py`:

```python
from app.domains.quiz.models import QuizOption, QuizQuestion
from app.domains.quiz.seed import seed_demo_quiz_questions


def test_seed_demo_quiz_questions_creates_five_questions_with_options(db_session):
    seed_demo_quiz_questions(db_session)
    questions = db_session.query(QuizQuestion).order_by(QuizQuestion.sort_order.asc()).all()
    assert len(questions) == 5
    assert len(questions[0].options) == 4
    assert questions[0].options[0].label == "Xanh lá hoặc xanh ô liu"


def test_seed_demo_quiz_questions_is_idempotent(db_session):
    seed_demo_quiz_questions(db_session)
    seed_demo_quiz_questions(db_session)
    assert db_session.query(QuizQuestion).count() == 5
    assert db_session.query(QuizOption).count() == 20


def test_deleting_question_cascades_to_options(db_session):
    seed_demo_quiz_questions(db_session)
    question = db_session.query(QuizQuestion).first()
    question_id = question.id
    db_session.delete(question)
    db_session.commit()
    assert db_session.query(QuizOption).filter(QuizOption.question_id == question_id).count() == 0
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/quiz/test_seed.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.quiz'`.

- [ ] **Step 3: Create the models**

Create `backend/app/domains/quiz/__init__.py` (empty).

Create `backend/app/domains/quiz/models.py`:

```python
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_text: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    options: Mapped[list["QuizOption"]] = relationship(
        back_populates="question", cascade="all, delete-orphan", order_by="QuizOption.sort_order"
    )


class QuizOption(Base):
    __tablename__ = "quiz_options"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(
        ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    season: Mapped[str] = mapped_column(String(20), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    question: Mapped["QuizQuestion"] = relationship(back_populates="options")
```

- [ ] **Step 4: Register the models with Alembic**

Modify `backend/alembic/env.py` — add:

```python
from app.domains.quiz import models as quiz_models  # noqa: F401
```

- [ ] **Step 5: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "create quiz_questions and quiz_options tables"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\d quiz_options'` shows a foreign key on `question_id` referencing `quiz_questions(id)` with `ON DELETE CASCADE`.

- [ ] **Step 6: Write the seed data**

Create `backend/app/domains/quiz/seed.py`:

```python
from sqlalchemy.orm import Session

from app.domains.quiz.models import QuizOption, QuizQuestion

DEMO_QUIZ_QUESTIONS = [
    {
        "sort_order": 0,
        "question_text": "Tĩnh mạch ở cổ tay bạn có màu gì khi nhìn dưới ánh sáng tự nhiên?",
        "options": [
            {"label": "Xanh lá hoặc xanh ô liu", "season": "autumn"},
            {"label": "Xanh dương hoặc tím", "season": "winter"},
            {"label": "Xanh dương nhạt, khó phân biệt", "season": "summer"},
            {"label": "Xanh lá nhạt, ánh vàng", "season": "spring"},
        ],
    },
    {
        "sort_order": 1,
        "question_text": "Làn da bạn phản ứng thế nào khi ra nắng?",
        "options": [
            {"label": "Dễ cháy nắng, ít khi sạm", "season": "summer"},
            {"label": "Sạm màu nhanh, hiếm khi cháy", "season": "autumn"},
            {"label": "Rám nắng đều, khỏe khoắn", "season": "spring"},
            {"label": "Da trắng sáng, tương phản rõ khi cháy nắng", "season": "winter"},
        ],
    },
    {
        "sort_order": 2,
        "question_text": "Màu tóc tự nhiên (chưa nhuộm) của bạn gần nhất với?",
        "options": [
            {"label": "Nâu vàng, nâu hạt dẻ ánh đỏ", "season": "autumn"},
            {"label": "Đen tuyền hoặc nâu rất đậm", "season": "winter"},
            {"label": "Nâu tro, nâu hạt dẻ ánh xám", "season": "summer"},
            {"label": "Vàng óng, nâu sáng ánh vàng", "season": "spring"},
        ],
    },
    {
        "sort_order": 3,
        "question_text": "Màu mắt tự nhiên của bạn là?",
        "options": [
            {"label": "Nâu đen sắc nét", "season": "winter"},
            {"label": "Nâu hạt dẻ ấm", "season": "autumn"},
            {"label": "Nâu nhạt hoặc xám xanh dịu", "season": "summer"},
            {"label": "Nâu sáng hoặc xanh lục ánh vàng", "season": "spring"},
        ],
    },
    {
        "sort_order": 4,
        "question_text": "Khi thử trang sức, loại nào tôn da bạn hơn?",
        "options": [
            {"label": "Vàng ánh đồng, vàng ấm", "season": "autumn"},
            {"label": "Vàng nhạt, vàng hồng dịu", "season": "spring"},
            {"label": "Bạc, bạch kim sáng rõ", "season": "winter"},
            {"label": "Bạc mờ, tông pastel nhẹ", "season": "summer"},
        ],
    },
]


def seed_demo_quiz_questions(db: Session) -> None:
    if db.query(QuizQuestion).count() > 0:
        return
    for question_data in DEMO_QUIZ_QUESTIONS:
        question = QuizQuestion(
            question_text=question_data["question_text"], sort_order=question_data["sort_order"]
        )
        db.add(question)
        db.flush()
        for index, option_data in enumerate(question_data["options"]):
            db.add(
                QuizOption(
                    question_id=question.id,
                    label=option_data["label"],
                    season=option_data["season"],
                    sort_order=index,
                )
            )
    db.commit()
```

- [ ] **Step 7: Wire seeding into app startup**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.quiz.seed import seed_demo_quiz_questions
```

In `lifespan`, add the call:

```python
        seed_demo_quiz_questions(db)
```

- [ ] **Step 8: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/quiz/test_seed.py -v`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
cd backend
git add app/domains/quiz alembic/env.py alembic/versions app/main.py tests/domains/quiz
git commit -m "feat: add quiz question/option models, migration, and seed data"
```

---

## Task 5: `quiz` domain — schemas and service

**Files:**
- Create: `backend/app/domains/quiz/schemas.py`
- Create: `backend/app/domains/quiz/service.py`
- Create: `backend/tests/domains/quiz/test_service.py`

**Interfaces:**
- Consumes: `app.domains.auth.schemas.CamelModel` (Phase 1); `app.domains.quiz.models.QuizQuestion`, `QuizOption` (Task 4).
- Produces: `SEASONS: list[str]`, `QuizOptionInput`, `QuizQuestionInput` (nested `options: list[QuizOptionInput]`, min length 2), `QuizOptionResponse`, `QuizQuestionResponse`; `list_quiz_questions(db) -> list[QuizQuestion]`, `get_quiz_question(db, question_id) -> QuizQuestion | None`, `create_quiz_question(db, data: QuizQuestionInput) -> QuizQuestion`, `update_quiz_question(db, question_id, data: QuizQuestionInput) -> QuizQuestion | None` (replaces all options), `delete_quiz_question(db, question_id) -> bool`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/quiz/test_service.py`:

```python
import pytest
from pydantic import ValidationError

from app.domains.quiz import service
from app.domains.quiz.models import QuizOption
from app.domains.quiz.schemas import QuizQuestionInput

VALID_INPUT = {
    "questionText": "Câu hỏi test?",
    "sortOrder": 0,
    "options": [
        {"label": "A", "season": "spring"},
        {"label": "B", "season": "summer"},
    ],
}


def test_create_quiz_question_with_options(db_session):
    question = service.create_quiz_question(db_session, QuizQuestionInput(**VALID_INPUT))
    assert question.id is not None
    assert len(question.options) == 2
    assert question.options[0].label == "A"


def test_list_quiz_questions_orders_by_sort_order(db_session):
    first = service.create_quiz_question(db_session, QuizQuestionInput(**{**VALID_INPUT, "sortOrder": 1}))
    second = service.create_quiz_question(db_session, QuizQuestionInput(**{**VALID_INPUT, "sortOrder": 0}))
    questions = service.list_quiz_questions(db_session)
    assert [q.id for q in questions] == [second.id, first.id]


def test_get_quiz_question_returns_none_when_missing(db_session):
    assert service.get_quiz_question(db_session, 99999) is None


def test_update_quiz_question_replaces_options_wholesale(db_session):
    question = service.create_quiz_question(db_session, QuizQuestionInput(**VALID_INPUT))
    updated = service.update_quiz_question(
        db_session,
        question.id,
        QuizQuestionInput(
            **{
                **VALID_INPUT,
                "questionText": "Đã sửa",
                "options": [
                    {"label": "C", "season": "autumn"},
                    {"label": "D", "season": "winter"},
                    {"label": "E", "season": "spring"},
                ],
            }
        ),
    )
    assert updated is not None
    assert updated.question_text == "Đã sửa"
    assert [option.label for option in updated.options] == ["C", "D", "E"]
    assert db_session.query(QuizOption).filter(QuizOption.question_id == question.id).count() == 3


def test_update_quiz_question_returns_none_when_missing(db_session):
    assert service.update_quiz_question(db_session, 99999, QuizQuestionInput(**VALID_INPUT)) is None


def test_delete_quiz_question_cascades_options(db_session):
    question = service.create_quiz_question(db_session, QuizQuestionInput(**VALID_INPUT))
    question_id = question.id
    assert service.delete_quiz_question(db_session, question_id) is True
    assert service.get_quiz_question(db_session, question_id) is None
    assert db_session.query(QuizOption).filter(QuizOption.question_id == question_id).count() == 0


def test_delete_quiz_question_returns_false_when_missing(db_session):
    assert service.delete_quiz_question(db_session, 99999) is False


def test_quiz_question_input_rejects_blank_question_text():
    with pytest.raises(ValidationError):
        QuizQuestionInput(**{**VALID_INPUT, "questionText": "   "})


def test_quiz_question_input_rejects_fewer_than_two_options():
    with pytest.raises(ValidationError):
        QuizQuestionInput(**{**VALID_INPUT, "options": [{"label": "Only one", "season": "spring"}]})


def test_quiz_question_input_rejects_invalid_season():
    with pytest.raises(ValidationError):
        QuizQuestionInput(
            **{
                **VALID_INPUT,
                "options": [
                    {"label": "A", "season": "not-a-real-season"},
                    {"label": "B", "season": "summer"},
                ],
            }
        )
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/quiz/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.quiz.schemas'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/quiz/schemas.py`:

```python
from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

SEASONS = ["spring", "summer", "autumn", "winter"]


class QuizOptionInput(CamelModel):
    label: str
    season: str

    @field_validator("label")
    @classmethod
    def label_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Lựa chọn không được để trống")
        return value.strip()

    @field_validator("season")
    @classmethod
    def season_valid(cls, value: str) -> str:
        if value not in SEASONS:
            raise ValueError("Mùa không hợp lệ")
        return value


class QuizQuestionInput(CamelModel):
    question_text: str
    sort_order: int = 0
    options: list[QuizOptionInput]

    @field_validator("question_text")
    @classmethod
    def question_text_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Nội dung câu hỏi không được để trống")
        return value.strip()

    @field_validator("options")
    @classmethod
    def at_least_two_options(cls, value: list[QuizOptionInput]) -> list[QuizOptionInput]:
        if len(value) < 2:
            raise ValueError("Cần ít nhất 2 lựa chọn")
        return value


class QuizOptionResponse(CamelModel):
    id: int
    label: str
    season: str
    sort_order: int


class QuizQuestionResponse(CamelModel):
    id: int
    question_text: str
    sort_order: int
    options: list[QuizOptionResponse]
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/quiz/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.quiz.models import QuizOption, QuizQuestion
from app.domains.quiz.schemas import QuizQuestionInput


def list_quiz_questions(db: Session) -> list[QuizQuestion]:
    return db.query(QuizQuestion).order_by(QuizQuestion.sort_order.asc()).all()


def get_quiz_question(db: Session, question_id: int) -> QuizQuestion | None:
    return db.get(QuizQuestion, question_id)


def create_quiz_question(db: Session, data: QuizQuestionInput) -> QuizQuestion:
    question = QuizQuestion(question_text=data.question_text, sort_order=data.sort_order)
    db.add(question)
    db.flush()
    for index, option in enumerate(data.options):
        db.add(QuizOption(question_id=question.id, label=option.label, season=option.season, sort_order=index))
    db.commit()
    db.refresh(question)
    return question


def update_quiz_question(db: Session, question_id: int, data: QuizQuestionInput) -> QuizQuestion | None:
    question = get_quiz_question(db, question_id)
    if question is None:
        return None

    question.question_text = data.question_text
    question.sort_order = data.sort_order
    db.query(QuizOption).filter(QuizOption.question_id == question_id).delete()
    db.flush()
    for index, option in enumerate(data.options):
        db.add(QuizOption(question_id=question.id, label=option.label, season=option.season, sort_order=index))
    db.commit()
    db.refresh(question)
    return question


def delete_quiz_question(db: Session, question_id: int) -> bool:
    question = get_quiz_question(db, question_id)
    if question is None:
        return False
    db.delete(question)
    db.commit()
    return True
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/quiz/test_service.py -v`
Expected: PASS (10 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/quiz/schemas.py app/domains/quiz/service.py tests/domains/quiz/test_service.py
git commit -m "feat: add quiz schemas with nested option validation and service"
```

---

## Task 6: `quiz` domain — router

**Files:**
- Create: `backend/app/domains/quiz/router.py`
- Modify: `backend/app/main.py` (mount the router)
- Create: `backend/tests/domains/quiz/test_router.py`

**Interfaces:**
- Consumes: `service.*` (Task 5), `require_admin` (Phase 1).
- Produces: `app.domains.quiz.router.router`, an `APIRouter` mounted at prefix `/quiz-questions` with routes `GET /`, `GET /{question_id}`, `POST /` (admin), `PUT /{question_id}` (admin), `DELETE /{question_id}` (admin).

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/quiz/test_router.py`:

```python
VALID_BODY = {
    "questionText": "Câu hỏi test?",
    "sortOrder": 0,
    "options": [
        {"label": "A", "season": "spring"},
        {"label": "B", "season": "summer"},
    ],
}


def _promote_to_admin(db_session, email: str) -> None:
    from app.domains.auth.models import User

    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()


def test_list_quiz_questions_is_public(client):
    response = client.get("/quiz-questions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_quiz_question_returns_404_when_missing(client):
    response = client.get("/quiz-questions/99999")
    assert response.status_code == 404


def test_create_quiz_question_requires_authentication(client):
    response = client.post("/quiz-questions", json=VALID_BODY)
    assert response.status_code == 401


def test_create_quiz_question_requires_admin_role(client, db_session):
    client.post("/auth/register", json={"name": "T", "email": "quiz-user@example.com", "password": "password123"})
    client.post("/auth/login", json={"email": "quiz-user@example.com", "password": "password123"})
    response = client.post("/quiz-questions", json=VALID_BODY)
    assert response.status_code == 403


def test_admin_can_create_get_update_and_delete_quiz_question(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "email": "quiz-admin@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "quiz-admin@example.com")
    client.post("/auth/login", json={"email": "quiz-admin@example.com", "password": "password123"})

    create_response = client.post("/quiz-questions", json=VALID_BODY)
    assert create_response.status_code == 201
    question_id = create_response.json()["id"]
    assert len(create_response.json()["options"]) == 2

    get_response = client.get(f"/quiz-questions/{question_id}")
    assert get_response.status_code == 200
    assert get_response.json()["questionText"] == "Câu hỏi test?"

    update_response = client.put(
        f"/quiz-questions/{question_id}",
        json={
            **VALID_BODY,
            "questionText": "Đã sửa?",
            "options": [
                {"label": "C", "season": "autumn"},
                {"label": "D", "season": "winter"},
                {"label": "E", "season": "spring"},
            ],
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["questionText"] == "Đã sửa?"
    assert len(update_response.json()["options"]) == 3

    delete_response = client.delete(f"/quiz-questions/{question_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/quiz-questions/{question_id}").status_code == 404


def test_create_quiz_question_rejects_invalid_body(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "email": "quiz-admin2@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "quiz-admin2@example.com")
    client.post("/auth/login", json={"email": "quiz-admin2@example.com", "password": "password123"})

    response = client.post(
        "/quiz-questions", json={**VALID_BODY, "options": [{"label": "Only one", "season": "spring"}]}
    )
    assert response.status_code == 422
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/quiz/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.quiz.router'`.

- [ ] **Step 3: Write the router**

Create `backend/app/domains/quiz/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.quiz import service
from app.domains.quiz.schemas import QuizQuestionInput, QuizQuestionResponse

router = APIRouter(prefix="/quiz-questions", tags=["quiz-questions"])


@router.get("", response_model=list[QuizQuestionResponse])
def list_items(db: Session = Depends(get_db)):
    return service.list_quiz_questions(db)


@router.get("/{question_id}", response_model=QuizQuestionResponse)
def get_item(question_id: int, db: Session = Depends(get_db)):
    question = service.get_quiz_question(db, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu hỏi")
    return question


@router.post("", response_model=QuizQuestionResponse, status_code=status.HTTP_201_CREATED)
def create_item(body: QuizQuestionInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return service.create_quiz_question(db, body)


@router.put("/{question_id}", response_model=QuizQuestionResponse)
def update_item(
    question_id: int, body: QuizQuestionInput, db: Session = Depends(get_db), _admin=Depends(require_admin)
):
    updated = service.update_quiz_question(db, question_id, body)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu hỏi")
    return updated


@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(question_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    deleted = service.delete_quiz_question(db, question_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu hỏi")
```

- [ ] **Step 4: Mount the router**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.quiz.router import router as quiz_router
```

Add after `app.include_router(blog_router)`:

```python
app.include_router(quiz_router)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/quiz/test_router.py -v`
Expected: PASS (6 tests).

- [ ] **Step 6: Run the entire backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests PASS (this is the full backend across Phase 1, 2, and 3).

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/quiz/router.py app/main.py tests/domains/quiz/test_router.py
git commit -m "feat: add quiz-questions router with nested options and admin-gated writes"
```

---

## Task 7: Frontend `blog` cutover

**Files:**
- Delete: `frontend/app/api/blog/route.ts`, `frontend/app/api/blog/route.test.ts`
- Delete: `frontend/app/api/blog/[id]/route.ts`, `frontend/app/api/blog/[id]/route.test.ts`
- Delete: `frontend/app/api/blog/validate.ts` (and its test file, if one exists — check with `ls frontend/app/api/blog/validate.test.ts` before deleting; Phase 2 found this file missed from an earlier plan in three other domains, so verify rather than assume)
- Modify: `frontend/app/blog/page.tsx`
- Modify: `frontend/app/blog/page.test.tsx`
- Modify: `frontend/app/blog/[slug]/page.tsx`
- Modify: `frontend/app/blog/[slug]/page.test.tsx`
- Modify: `frontend/components/admin/BlogPostList.tsx`
- Modify: `frontend/components/admin/BlogPostList.test.tsx`
- Modify: `frontend/components/admin/BlogPostForm.tsx`
- Modify: `frontend/components/admin/BlogPostForm.test.tsx`
- Modify: `frontend/app/admin/blog/[id]/edit/page.tsx`
- Modify: `frontend/app/admin/blog/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/blog` endpoints (Task 3).
- Note: `frontend/lib/db.ts` is **not** trimmed in this task — `quiz-questions`'s own Next.js routes still call its `getQuizQuestions`/`createQuizQuestion`/etc. functions until Task 8. Only the blog-specific `app/api/blog/*` route files are deleted here.

- [ ] **Step 1: Check for a blog validate test file, then delete the old blog API routes**

```bash
cd frontend
ls app/api/blog/validate.test.ts 2>/dev/null && echo "exists — delete it too" || echo "does not exist"
```

Delete the confirmed files:

```bash
rm app/api/blog/route.ts app/api/blog/route.test.ts
rm app/api/blog/validate.ts
rm "app/api/blog/[id]/route.ts" "app/api/blog/[id]/route.test.ts"
# If the check above found app/api/blog/validate.test.ts, also run:
# rm app/api/blog/validate.test.ts
```

- [ ] **Step 2: Update the blog list page to fetch from FastAPI**

Modify `frontend/app/blog/page.tsx` — replace the full file:

```typescript
import BlogHero from '@/components/blog/BlogHero'
import BlogFeaturedArticle from '@/components/blog/BlogFeaturedArticle'
import BlogArticleGrid from '@/components/blog/BlogArticleGrid'
import BlogQuizCallout from '@/components/blog/BlogQuizCallout'
import BlogNewsletterSection from '@/components/blog/BlogNewsletterSection'
import { apiFetch } from '@/lib/apiClient'
import type { BlogPost } from '@/lib/db'

export default async function BlogPage() {
  const response = await apiFetch('/blog', { cache: 'no-store' })
  const posts = response.ok ? ((await response.json()) as BlogPost[]) : []
  const featured = posts.find((post) => post.isFeatured) ?? posts[0]
  const rest = featured ? posts.filter((post) => post.id !== featured.id) : posts

  return (
    <main className="w-full bg-surface">
      <div className="mx-auto max-w-7xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
        <BlogHero />
        {featured && <BlogFeaturedArticle post={featured} />}
        <BlogArticleGrid posts={rest} />
        <BlogQuizCallout />
        <BlogNewsletterSection />
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Update the blog list page test**

Modify `frontend/app/blog/page.test.tsx` — replace the full file:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { BlogPost } from '@/lib/db'
import BlogPage from './page'

const POSTS: BlogPost[] = [
  {
    id: 1,
    slug: 'mua-dong-2026',
    title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
    excerpt: 'Khám phá sức hút mãnh liệt của sự tương phản cao.',
    content: 'Nội dung bài nổi bật.',
    coverImageUrl: '/blog/featured-winter-outfit.jpg',
    category: 'personal-color',
    authorName: 'Stylist Mai Anh',
    isFeatured: true,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
  {
    id: 2,
    slug: 'top-5-thoi-son',
    title: 'Top 5 thỏi son kinh điển dành riêng cho cô nàng thuộc nhóm Cool Undertone',
    excerpt: 'Sự thanh khiết và dịu mát của tone Mùa Hạ.',
    content: 'Nội dung bài thường.',
    coverImageUrl: '/blog/lipstick-flatlay.jpg',
    category: 'beauty',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-06-18',
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
  },
]

describe('BlogPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the hero heading, featured article and article grid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POSTS }))
    const page = await BlogPage()
    renderWithIntl(page)
    expect(screen.getByRole('heading', { level: 1, name: 'Tạp Chí Phong Cách TwistFit' })).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
    expect(screen.getByText(/Top 5 thỏi son kinh điển/)).toBeInTheDocument()
    expect(screen.getByText('Nhận Cẩm Nang Thời Trang Hàng Tuần')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the blog list page test**

Run: `cd frontend && npx vitest run app/blog/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Update the blog detail page to fetch by slug from FastAPI**

Modify `frontend/app/blog/[slug]/page.tsx` — replace the full file:

```typescript
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import { renderMarkdown } from '@/lib/markdown'
import type { BlogPost } from '@/lib/db'

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const response = await apiFetch(`/blog/slug/${slug}`, { cache: 'no-store' })

  if (!response.ok) {
    notFound()
    return null
  }

  const post = (await response.json()) as BlogPost

  return (
    <main className="w-full bg-surface">
      <article className="mx-auto max-w-3xl px-margin py-space-lg md:px-margin-desktop md:py-space-xl">
        <Link href="/blog" className="text-label-md font-semibold text-primary hover:underline">
          ← Quay lại Blog
        </Link>
        <h1 className="mt-space-md text-headline-lg font-bold text-on-surface">{post.title}</h1>
        <div className="mt-space-xs flex items-center gap-space-sm text-label-sm text-on-surface-variant">
          <span>{post.publishedAt}</span>
          {post.authorName && (
            <>
              <span>•</span>
              <span>Bởi {post.authorName}</span>
            </>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.coverImageUrl} alt={post.title} className="mt-space-lg w-full rounded-3xl object-cover" />
        <div
          className="prose mt-space-lg max-w-none text-body-md text-on-surface"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />
      </article>
    </main>
  )
}
```

- [ ] **Step 6: Update the blog detail page test**

Modify `frontend/app/blog/[slug]/page.test.tsx` — replace the full file:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { BlogPost } from '@/lib/db'

const POST: BlogPost = {
  id: 1,
  slug: 'mua-dong-2026',
  title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông',
  excerpt: 'Mô tả ngắn',
  content: '# Tiêu đề phụ\n\nNội dung **đầy đủ** của bài viết.',
  coverImageUrl: '/blog/featured-winter-outfit.jpg',
  category: 'personal-color',
  authorName: 'Stylist Mai Anh',
  isFeatured: true,
  publishedAt: '2026-06-18',
  createdAt: '2026-06-18',
  updatedAt: '2026-06-18',
}

const notFoundMock = vi.fn()

vi.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}))

describe('BlogPostPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    notFoundMock.mockClear()
  })

  it('renders the post title and markdown content when the slug exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => POST }))
    const { default: BlogPostPage } = await import('./page')
    const ui = await BlogPostPage({ params: Promise.resolve({ slug: 'mua-dong-2026' }) })
    renderWithIntl(ui!)
    expect(
      screen.getByRole('heading', { name: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tiêu đề phụ' })).toBeInTheDocument()
    expect(screen.getByText('Bởi Stylist Mai Anh')).toBeInTheDocument()
  })

  it('calls notFound() when the slug does not exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    const { default: BlogPostPage } = await import('./page')
    await BlogPostPage({ params: Promise.resolve({ slug: 'khong-ton-tai' }) })
    expect(notFoundMock).toHaveBeenCalled()
  })
})
```

- [ ] **Step 7: Run the blog detail page test**

Run: `cd frontend && npx vitest run "app/blog/\[slug\]/page.test.tsx"`
Expected: PASS.

- [ ] **Step 8: Update BlogPostList to use apiClient**

Modify `frontend/components/admin/BlogPostList.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the two `fetch` calls:

```typescript
  useEffect(() => {
    apiFetch('/blog')
      .then((response) => response.json())
      .then(setPosts)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/blog/${id}`, { method: 'DELETE' })
    setPosts((current) => current?.filter((post) => post.id !== id) ?? null)
  }
```

- [ ] **Step 9: Update the BlogPostList delete test's fetch assertion**

Modify `frontend/components/admin/BlogPostList.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/blog/1', { method: 'DELETE', credentials: 'include' })
```

- [ ] **Step 10: Run the BlogPostList tests**

Run: `cd frontend && npx vitest run components/admin/BlogPostList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 11: Update BlogPostForm to use apiClient and show a generic error**

Modify `frontend/components/admin/BlogPostForm.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` (the existing `import { slugify } from '@/lib/slugify'` stays — it drives the live slug preview as the admin types the title, unrelated to the API call) and replace the submit logic:

```typescript
    const response = await apiFetch(isEditing ? `/blog/${initialPost!.id}` : '/blog', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSubmitting(false)

    if (response.status === 401 || response.status === 403) {
      setErrors({ form: t('unauthorizedError') })
      return
    }

    if (!response.ok) {
      setErrors({ form: t('genericError') })
      return
    }

    router.push('/admin/blog')
```

- [ ] **Step 12: Update the BlogPostForm tests**

Modify `frontend/components/admin/BlogPostForm.test.tsx` — update the two `toHaveBeenCalledWith` assertions:

```typescript
    expect(fetch).toHaveBeenCalledWith('/blog', expect.objectContaining({ method: 'POST', credentials: 'include' }))
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/blog/42', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
```

Replace the fifth test (`'shows field errors returned by the API instead of redirecting'`):

```typescript
  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<BlogPostForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo bài viết' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
```

- [ ] **Step 13: Run the BlogPostForm tests**

Run: `cd frontend && npx vitest run components/admin/BlogPostForm.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 14: Update the edit page to use apiClient**

Modify `frontend/app/admin/blog/[id]/edit/page.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the fetch call:

```typescript
      apiFetch(`/blog/${id}`)
        .then((response) => response.json())
        .then(setPost)
```

- [ ] **Step 15: Update the edit page test's fetch assertion**

Modify `frontend/app/admin/blog/[id]/edit/page.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/blog/7', { credentials: 'include' })
```

- [ ] **Step 16: Run the edit page test**

Run: `cd frontend && npx vitest run --dir app/admin/blog`
Expected: PASS.

- [ ] **Step 17: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass — this includes `lib/db.test.ts` and `app/api/quiz-questions/*` tests, which still exercise the (untouched) quiz-questions SQLite code at this point in the plan.

- [ ] **Step 18: Commit**

```bash
cd frontend
git add app/blog components/admin/BlogPostList.tsx components/admin/BlogPostList.test.tsx components/admin/BlogPostForm.tsx components/admin/BlogPostForm.test.tsx app/admin/blog
git rm app/api/blog/route.ts app/api/blog/route.test.ts app/api/blog/validate.ts
git rm "app/api/blog/[id]/route.ts" "app/api/blog/[id]/route.test.ts"
git commit -m "feat: cut blog over to FastAPI, both public reads and admin CRUD"
```

---

## Task 8: Frontend `quiz-questions` cutover, and trim the shared `lib/db.ts`

**Files:**
- Delete: `frontend/app/api/quiz-questions/route.ts`, `frontend/app/api/quiz-questions/route.test.ts`
- Delete: `frontend/app/api/quiz-questions/[id]/route.ts`, `frontend/app/api/quiz-questions/[id]/route.test.ts`
- Delete: `frontend/app/api/quiz-questions/validate.ts` (and its test file, if one exists — check first, same as Task 7)
- Modify: `frontend/app/personal-color/quiz/page.tsx`
- Modify: `frontend/app/personal-color/quiz/page.test.tsx`
- Modify: `frontend/components/admin/QuizQuestionList.tsx`
- Modify: `frontend/components/admin/QuizQuestionList.test.tsx`
- Modify: `frontend/components/admin/QuizQuestionForm.tsx`
- Modify: `frontend/components/admin/QuizQuestionForm.test.tsx`
- Modify: `frontend/app/admin/quiz/[id]/edit/page.tsx`
- Modify: `frontend/app/admin/quiz/[id]/edit/page.test.tsx`
- Modify: `frontend/lib/db.ts` (trim to shared types/constants only)
- Delete: `frontend/lib/db.test.ts`
- Modify: `frontend/lib/getDb.ts` (remove the now-dead `initSchema`/`seedIfEmpty` wiring from `./db`)

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/quiz-questions` endpoints (Task 6).

- [ ] **Step 1: Check for a quiz-questions validate test file, then delete the old quiz-questions API routes**

```bash
cd frontend
ls app/api/quiz-questions/validate.test.ts 2>/dev/null && echo "exists — delete it too" || echo "does not exist"
```

Delete the confirmed files:

```bash
rm app/api/quiz-questions/route.ts app/api/quiz-questions/route.test.ts
rm app/api/quiz-questions/validate.ts
rm "app/api/quiz-questions/[id]/route.ts" "app/api/quiz-questions/[id]/route.test.ts"
# If the check above found app/api/quiz-questions/validate.test.ts, also run:
# rm app/api/quiz-questions/validate.test.ts
```

- [ ] **Step 2: Update the personal-color quiz page to fetch from FastAPI**

Modify `frontend/app/personal-color/quiz/page.tsx` — replace the full file:

```typescript
import QuizPageContent from '@/components/personal-color/QuizPageContent'
import { apiFetch } from '@/lib/apiClient'
import type { QuizQuestion } from '@/lib/db'

export default async function QuizPage() {
  const response = await apiFetch('/quiz-questions', { cache: 'no-store' })
  const questions = response.ok ? ((await response.json()) as QuizQuestion[]) : []
  return <QuizPageContent questions={questions} />
}
```

- [ ] **Step 3: Update the personal-color quiz page test**

Modify `frontend/app/personal-color/quiz/page.test.tsx` — replace the full file:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { QuizQuestion } from '@/lib/db'
import QuizPage from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const QUESTIONS: QuizQuestion[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  questionText: `Câu hỏi số ${index + 1}?`,
  sortOrder: index,
  options: [
    { id: index * 10 + 1, label: 'A', season: 'spring', sortOrder: 0 },
    { id: index * 10 + 2, label: 'B', season: 'summer', sortOrder: 1 },
  ],
}))

describe('QuizPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the quiz heading and first question', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => QUESTIONS }))
    const page = await QuizPage()
    renderWithIntl(page)
    expect(screen.getByRole('heading', { level: 1, name: 'Kiểm Tra Personal Color' })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi 1/5')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the personal-color quiz page test**

Run: `cd frontend && npx vitest run app/personal-color/quiz/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Update QuizQuestionList to use apiClient**

Modify `frontend/components/admin/QuizQuestionList.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace all four `fetch` calls (the initial list load, the two calls inside `persistOrder`, and the delete):

```typescript
  useEffect(() => {
    apiFetch('/quiz-questions')
      .then((response) => response.json())
      .then(setQuestions)
  }, [])

  async function persistOrder(a: QuizQuestion, b: QuizQuestion) {
    await Promise.all([
      apiFetch(`/quiz-questions/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: a.questionText, sortOrder: b.sortOrder, options: a.options }),
      }),
      apiFetch(`/quiz-questions/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: b.questionText, sortOrder: a.sortOrder, options: b.options }),
      }),
    ])
  }
```

```typescript
  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/quiz-questions/${id}`, { method: 'DELETE' })
    setQuestions((current) => current?.filter((question) => question.id !== id) ?? null)
  }
```

- [ ] **Step 6: Update the QuizQuestionList reorder test's fetch assertions**

Modify `frontend/components/admin/QuizQuestionList.test.tsx`:

```typescript
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/quiz-questions/1', expect.objectContaining({ method: 'PUT' }))
    )
    expect(fetch).toHaveBeenCalledWith('/quiz-questions/2', expect.objectContaining({ method: 'PUT' }))
```

- [ ] **Step 7: Run the QuizQuestionList tests**

Run: `cd frontend && npx vitest run components/admin/QuizQuestionList.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 8: Update QuizQuestionForm to use apiClient and show a generic error**

Modify `frontend/components/admin/QuizQuestionForm.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the submit logic:

```typescript
    const response = await apiFetch(
      isEditing ? `/quiz-questions/${initialQuestion!.id}` : '/quiz-questions',
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    setSubmitting(false)

    if (response.status === 401 || response.status === 403) {
      setErrors({ form: t('unauthorizedError') })
      return
    }

    if (!response.ok) {
      setErrors({ form: t('genericError') })
      return
    }

    router.push('/admin/quiz')
```

- [ ] **Step 9: Update the QuizQuestionForm tests**

Modify `frontend/components/admin/QuizQuestionForm.test.tsx` — update the two `toHaveBeenCalledWith` assertions:

```typescript
    expect(fetch).toHaveBeenCalledWith('/quiz-questions', expect.objectContaining({ method: 'POST', credentials: 'include' }))
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/quiz-questions/9', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
```

Replace the fourth test (`'shows field errors returned by the API instead of redirecting'`):

```typescript
  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<QuizQuestionForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
```

- [ ] **Step 10: Run the QuizQuestionForm tests**

Run: `cd frontend && npx vitest run components/admin/QuizQuestionForm.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 11: Update the edit page to use apiClient**

Modify `frontend/app/admin/quiz/[id]/edit/page.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the fetch call:

```typescript
      apiFetch(`/quiz-questions/${id}`)
        .then((response) => response.json())
        .then(setQuestion)
```

- [ ] **Step 12: Update the edit page test's fetch assertion**

Modify `frontend/app/admin/quiz/[id]/edit/page.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/quiz-questions/3', { credentials: 'include' })
```

- [ ] **Step 13: Run the edit page test**

Run: `cd frontend && npx vitest run --dir app/admin/quiz`
Expected: PASS.

- [ ] **Step 14: Trim `lib/db.ts` to shared types and constants**

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

Note: `BlogPostInput`, `QuizOptionInput`, and `QuizQuestionInput` (the old SQLite input types) are dropped — nothing imports them once `app/api/blog/*` and `app/api/quiz-questions/*` are gone; `BlogPostForm`/`QuizQuestionForm` build their request bodies as plain inline object literals already, matching the pattern already used by `TeamForm`/`ModelForm`/`CapsuleForm` after their own Phase 2 cutovers.

- [ ] **Step 15: Delete the SQLite-only test file for `lib/db.ts`**

```bash
cd frontend
git rm lib/db.test.ts
```

- [ ] **Step 16: Remove the dead blog/quiz-questions wiring from `lib/getDb.ts`**

Modify `frontend/lib/getDb.ts` — remove the `import { initSchema, seedIfEmpty } from './db'` line and the corresponding `initSchema(db)` / `seedIfEmpty(db)` calls inside `getDb()`. Read the file first to see its current import list and call order (it also wires `forum`, `contact`, `quizAttempts`, and `auth/users` — those stay untouched), then remove only the two lines that reference `./db`.

- [ ] **Step 17: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass.

- [ ] **Step 18: Manually verify in the browser**

With PostgreSQL running, the backend running (`cd backend && uvicorn app.main:app --reload`) and the frontend running (`cd frontend && npm run dev`), with `frontend/.env.local` containing `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`:
- Visit `/blog` — the 7 seeded posts render, one featured.
- Click into a post (`/blog/<slug>`) — title, markdown content, and author render correctly.
- Visit `/personal-color/quiz` — the 5 seeded questions render with 4 options each.
- Log in as `admin@twistfit.vn` / `admin1234`, visit `/admin/blog`, create/edit/delete a post (confirm a duplicate slug shows the generic error), visit `/admin/quiz`, create/edit/delete a question (including reordering with the up/down buttons).

- [ ] **Step 19: Commit**

```bash
cd frontend
git add app/personal-color/quiz components/admin/QuizQuestionList.tsx components/admin/QuizQuestionList.test.tsx components/admin/QuizQuestionForm.tsx components/admin/QuizQuestionForm.test.tsx app/admin/quiz lib/db.ts lib/getDb.ts
git rm app/api/quiz-questions/route.ts app/api/quiz-questions/route.test.ts app/api/quiz-questions/validate.ts
git rm "app/api/quiz-questions/[id]/route.ts" "app/api/quiz-questions/[id]/route.test.ts"
git commit -m "feat: cut quiz-questions over to FastAPI and trim the shared lib/db.ts"
```
