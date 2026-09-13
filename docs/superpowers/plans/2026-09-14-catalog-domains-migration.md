# Catalog Domains Migration (team, model-catalog, capsule-wardrobe) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `team`, `model-catalog`, and `capsule-wardrobe` from Next.js/SQLite to the FastAPI backend, and cut the frontend fully over, deleting the old implementation.

**Architecture:** Three new self-contained domains under `app/domains/{team,model_catalog,capsule_wardrobe}/` in the backend, each following the exact `models.py`/`schemas.py`/`service.py`/`router.py` shape established for `faq`. Frontend Server Components and admin CRUD pages switch from direct SQLite lib calls / `fetch('/api/...')` to `apiFetch('/...')` against FastAPI, same mechanical change already applied to `faq` and `auth`.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL (unchanged from Phase 1). Frontend: Next.js 16, Vitest (unchanged).

**Spec:** `docs/superpowers/specs/2026-09-14-catalog-domains-migration-design.md`

## Global Constraints

- All three domains are plain CRUD: public `GET`/`GET {id}`, admin-gated `POST`/`PUT`/`DELETE`. No cross-domain dependencies confirmed — old Next.js code is deleted outright once cutover is verified, no legacy bridge needed (unlike `auth`).
- "Enum" fields (`badge_variant`, `role_variant`, `undertone`, `tag_variant`) are plain `String` Postgres columns validated in Pydantic — never Postgres native `ENUM` types.
- `capsule_sets.items` is a Postgres `JSONB` column (array of `{label, price}` objects), not a normalized child table.
- All Pydantic schemas extend `app.domains.auth.schemas.CamelModel` so JSON keys are camelCase, matching the existing frontend TypeScript types exactly.
- Every admin form's error handling on any failed submit: `401`/`403` → `t('unauthorizedError')`; any other non-2xx → `t('genericError')` (Vietnamese: "Có lỗi xảy ra, vui lòng thử lại." / "Bạn cần đăng nhập với quyền quản trị.") — no per-field error parsing, matching Phase 1's `FaqForm` precedent (FastAPI's 422 shape isn't parsed field-by-field).
- Backend tests run against the real Postgres test database via the existing `tests/conftest.py` fixtures (`db_session`, `client`) — no mocks, no SQLite.

---

## Task 1: `team` domain — model, migration, seed data

**Files:**
- Create: `backend/app/domains/team/__init__.py`
- Create: `backend/app/domains/team/models.py`
- Modify: `backend/alembic/env.py` (register the model)
- Create: `backend/app/domains/team/seed.py`
- Modify: `backend/app/main.py` (seed on startup)
- Create: `backend/tests/domains/team/__init__.py`
- Create: `backend/tests/domains/team/test_seed.py`

**Interfaces:**
- Consumes: `app.db.session.Base` (Phase 1).
- Produces: `app.domains.team.models.TeamMember` (columns: `id`, `image`, `name`, `role`, `bio`, `badge_variant`, `role_variant`, `footer_icon`, `footer_label`, `created_at`, `updated_at`). Produces: `seed_demo_team_members(db: Session) -> None`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/team/__init__.py` (empty).

Create `backend/tests/domains/team/test_seed.py`:

```python
from app.domains.team.models import TeamMember
from app.domains.team.seed import seed_demo_team_members


def test_seed_demo_team_members_creates_three_members(db_session):
    seed_demo_team_members(db_session)
    members = db_session.query(TeamMember).order_by(TeamMember.id.asc()).all()
    assert len(members) == 3
    assert members[0].name == "Trần Mai Anh"
    assert members[0].badge_variant == "secondary"


def test_seed_demo_team_members_is_idempotent(db_session):
    seed_demo_team_members(db_session)
    seed_demo_team_members(db_session)
    assert db_session.query(TeamMember).count() == 3
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/team/test_seed.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.team'`.

- [ ] **Step 3: Create the model**

Create `backend/app/domains/team/__init__.py` (empty).

Create `backend/app/domains/team/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    image: Mapped[str] = mapped_column(String(500), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    badge_variant: Mapped[str] = mapped_column(String(20), nullable=False)
    role_variant: Mapped[str] = mapped_column(String(20), nullable=False)
    footer_icon: Mapped[str] = mapped_column(String(100), nullable=False)
    footer_label: Mapped[str] = mapped_column(String(255), nullable=False)
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

- [ ] **Step 4: Register the model with Alembic**

Modify `backend/alembic/env.py` — add this line next to the existing `auth`/`faq` model imports:

```python
from app.domains.team import models as team_models  # noqa: F401
```

- [ ] **Step 5: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "create team_members table"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\d team_members'` shows the expected columns.

- [ ] **Step 6: Write the seed data**

Create `backend/app/domains/team/seed.py`:

```python
from sqlalchemy.orm import Session

from app.domains.team.models import TeamMember

DEMO_TEAM_MEMBERS = [
    {
        "image": "/about/team-mai-anh.jpg",
        "name": "Trần Mai Anh",
        "role": "Head of Color Science & Consulting",
        "bio": (
            "Chứng chỉ Chuyên gia Màu sắc Quốc tế (IIC). 8+ năm kinh nghiệm tư vấn định vị hình ảnh cá nhân "
            "cho các người mẫu, KOL và doanh nhân hàng đầu."
        ),
        "badge_variant": "secondary",
        "role_variant": "secondary",
        "footer_icon": "verified",
        "footer_label": "Korea Image Industry Association",
    },
    {
        "image": "/about/team-quang-huy.jpg",
        "name": "Dr. Lê Quang Huy",
        "role": "Chief Technology Officer (CTO)",
        "bio": (
            "Tiến sĩ Khoa học Máy tính tại NTU Singapore, chuyên sâu về Deep Learning và Thị giác Máy tính "
            "ứng dụng trong phân tích sắc ký ảnh kỹ thuật số."
        ),
        "badge_variant": "primary",
        "role_variant": "primary",
        "footer_icon": "memory",
        "footer_label": "5+ Sáng chế thị giác màu quang phổ",
    },
    {
        "image": "/about/team-khanh-linh.jpg",
        "name": "Nguyễn Khánh Linh",
        "role": "Creative Director & Master Stylist",
        "bio": (
            "Tốt nghiệp Học viện Thời trang London (LCA). Cựu biên tập viên phong cách cho các tạp chí "
            "phong cách sống hàng đầu, đam mê tái cấu trúc tủ đồ thông minh."
        ),
        "badge_variant": "tertiary",
        "role_variant": "tertiary",
        "footer_icon": "auto_fix_high",
        "footer_label": "Stylist của 100+ Fashion Lookbooks",
    },
]


def seed_demo_team_members(db: Session) -> None:
    if db.query(TeamMember).count() > 0:
        return
    for member in DEMO_TEAM_MEMBERS:
        db.add(TeamMember(**member))
    db.commit()
```

- [ ] **Step 7: Wire seeding into app startup**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.team.seed import seed_demo_team_members
```

In `lifespan`, call it alongside the existing seed calls:

```python
        seed_demo_users(db)
        seed_demo_faq_items(db)
        seed_demo_team_members(db)
```

- [ ] **Step 8: Run the test and verify it passes**

Run: `cd backend && pytest tests/domains/team/test_seed.py -v`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
cd backend
git add app/domains/team alembic/env.py alembic/versions app/main.py tests/domains/team
git commit -m "feat: add team model, migration, and seed data"
```

---

## Task 2: `team` domain — schemas and service

**Files:**
- Create: `backend/app/domains/team/schemas.py`
- Create: `backend/app/domains/team/service.py`
- Create: `backend/tests/domains/team/test_service.py`

**Interfaces:**
- Consumes: `app.domains.auth.schemas.CamelModel` (Phase 1); `app.domains.team.models.TeamMember` (Task 1).
- Produces: `COLOR_VARIANTS: list[str]`, `TeamMemberInput` (Pydantic model with validation), `TeamMemberResponse`; `list_team_members(db) -> list[TeamMember]`, `get_team_member(db, member_id) -> TeamMember | None`, `create_team_member(db, data: TeamMemberInput) -> TeamMember`, `update_team_member(db, member_id, data: TeamMemberInput) -> TeamMember | None`, `delete_team_member(db, member_id) -> bool`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/team/test_service.py`:

```python
import pytest
from pydantic import ValidationError

from app.domains.team import service
from app.domains.team.schemas import TeamMemberInput

VALID_INPUT = {
    "image": "/about/a.jpg",
    "name": "Nguyễn Văn A",
    "role": "Stylist",
    "bio": "Tiểu sử mẫu.",
    "badgeVariant": "primary",
    "roleVariant": "primary",
    "footerIcon": "star",
    "footerLabel": "Nhãn mẫu",
}


def test_create_team_member(db_session):
    member = service.create_team_member(db_session, TeamMemberInput(**VALID_INPUT))
    assert member.id is not None
    assert member.name == "Nguyễn Văn A"


def test_list_team_members_orders_by_id(db_session):
    first = service.create_team_member(db_session, TeamMemberInput(**VALID_INPUT))
    second = service.create_team_member(db_session, TeamMemberInput(**{**VALID_INPUT, "name": "B"}))
    members = service.list_team_members(db_session)
    assert [m.id for m in members] == [first.id, second.id]


def test_get_team_member_returns_none_when_missing(db_session):
    assert service.get_team_member(db_session, 99999) is None


def test_update_team_member(db_session):
    member = service.create_team_member(db_session, TeamMemberInput(**VALID_INPUT))
    updated = service.update_team_member(db_session, member.id, TeamMemberInput(**{**VALID_INPUT, "name": "Đã sửa"}))
    assert updated is not None
    assert updated.name == "Đã sửa"


def test_update_team_member_returns_none_when_missing(db_session):
    assert service.update_team_member(db_session, 99999, TeamMemberInput(**VALID_INPUT)) is None


def test_delete_team_member(db_session):
    member = service.create_team_member(db_session, TeamMemberInput(**VALID_INPUT))
    assert service.delete_team_member(db_session, member.id) is True
    assert service.get_team_member(db_session, member.id) is None


def test_delete_team_member_returns_false_when_missing(db_session):
    assert service.delete_team_member(db_session, 99999) is False


def test_team_member_input_rejects_blank_name():
    with pytest.raises(ValidationError):
        TeamMemberInput(**{**VALID_INPUT, "name": "   "})


def test_team_member_input_rejects_invalid_badge_variant():
    with pytest.raises(ValidationError):
        TeamMemberInput(**{**VALID_INPUT, "badgeVariant": "not-a-real-variant"})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/team/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.team.schemas'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/team/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

COLOR_VARIANTS = ["primary", "secondary", "tertiary"]


class TeamMemberInput(CamelModel):
    image: str
    name: str
    role: str
    bio: str
    badge_variant: str
    role_variant: str
    footer_icon: str
    footer_label: str

    @field_validator("image", "name", "role", "bio", "footer_icon", "footer_label")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Trường này không được để trống")
        return value.strip()

    @field_validator("badge_variant", "role_variant")
    @classmethod
    def variant_valid(cls, value: str) -> str:
        if value not in COLOR_VARIANTS:
            raise ValueError("Giá trị màu không hợp lệ")
        return value


class TeamMemberResponse(CamelModel):
    id: int
    image: str
    name: str
    role: str
    bio: str
    badge_variant: str
    role_variant: str
    footer_icon: str
    footer_label: str
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/team/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.team.models import TeamMember
from app.domains.team.schemas import TeamMemberInput


def list_team_members(db: Session) -> list[TeamMember]:
    return db.query(TeamMember).order_by(TeamMember.id.asc()).all()


def get_team_member(db: Session, member_id: int) -> TeamMember | None:
    return db.get(TeamMember, member_id)


def create_team_member(db: Session, data: TeamMemberInput) -> TeamMember:
    member = TeamMember(**data.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def update_team_member(db: Session, member_id: int, data: TeamMemberInput) -> TeamMember | None:
    member = get_team_member(db, member_id)
    if member is None:
        return None
    for field, value in data.model_dump().items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return member


def delete_team_member(db: Session, member_id: int) -> bool:
    member = get_team_member(db, member_id)
    if member is None:
        return False
    db.delete(member)
    db.commit()
    return True
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/team/test_service.py -v`
Expected: PASS (9 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/team/schemas.py app/domains/team/service.py tests/domains/team/test_service.py
git commit -m "feat: add team schemas with validation and service"
```

---

## Task 3: `team` domain — router

**Files:**
- Create: `backend/app/domains/team/router.py`
- Modify: `backend/app/main.py` (mount the router)
- Create: `backend/tests/domains/team/test_router.py`

**Interfaces:**
- Consumes: `service.*` (Task 2), `require_admin` (Phase 1).
- Produces: `app.domains.team.router.router`, an `APIRouter` mounted at prefix `/team` with routes `GET /`, `GET /{member_id}`, `POST /` (admin), `PUT /{member_id}` (admin), `DELETE /{member_id}` (admin).

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/team/test_router.py`:

```python
VALID_BODY = {
    "image": "/about/a.jpg",
    "name": "Nguyễn Văn A",
    "role": "Stylist",
    "bio": "Tiểu sử mẫu.",
    "badgeVariant": "primary",
    "roleVariant": "primary",
    "footerIcon": "star",
    "footerLabel": "Nhãn mẫu",
}


def _promote_to_admin(db_session, email: str) -> None:
    from app.domains.auth.models import User

    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()


def test_list_team_members_is_public(client):
    response = client.get("/team")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_team_member_returns_404_when_missing(client):
    response = client.get("/team/99999")
    assert response.status_code == 404


def test_create_team_member_requires_authentication(client):
    response = client.post("/team", json=VALID_BODY)
    assert response.status_code == 401


def test_create_team_member_requires_admin_role(client, db_session):
    client.post("/auth/register", json={"name": "T", "email": "team-user@example.com", "password": "password123"})
    client.post("/auth/login", json={"email": "team-user@example.com", "password": "password123"})
    response = client.post("/team", json=VALID_BODY)
    assert response.status_code == 403


def test_admin_can_create_get_update_and_delete_team_member(client, db_session):
    client.post("/auth/register", json={"name": "Admin", "email": "team-admin@example.com", "password": "password123"})
    _promote_to_admin(db_session, "team-admin@example.com")
    client.post("/auth/login", json={"email": "team-admin@example.com", "password": "password123"})

    create_response = client.post("/team", json=VALID_BODY)
    assert create_response.status_code == 201
    member_id = create_response.json()["id"]

    get_response = client.get(f"/team/{member_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Nguyễn Văn A"

    update_response = client.put(f"/team/{member_id}", json={**VALID_BODY, "name": "Đã sửa"})
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Đã sửa"

    delete_response = client.delete(f"/team/{member_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/team/{member_id}").status_code == 404


def test_create_team_member_rejects_invalid_body(client, db_session):
    client.post("/auth/register", json={"name": "Admin", "email": "team-admin2@example.com", "password": "password123"})
    _promote_to_admin(db_session, "team-admin2@example.com")
    client.post("/auth/login", json={"email": "team-admin2@example.com", "password": "password123"})

    response = client.post("/team", json={**VALID_BODY, "name": ""})
    assert response.status_code == 422
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/team/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.team.router'`.

- [ ] **Step 3: Write the router**

Create `backend/app/domains/team/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.team import service
from app.domains.team.schemas import TeamMemberInput, TeamMemberResponse

router = APIRouter(prefix="/team", tags=["team"])


@router.get("", response_model=list[TeamMemberResponse])
def list_items(db: Session = Depends(get_db)):
    return service.list_team_members(db)


@router.get("/{member_id}", response_model=TeamMemberResponse)
def get_item(member_id: int, db: Session = Depends(get_db)):
    member = service.get_team_member(db, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thành viên")
    return member


@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
def create_item(body: TeamMemberInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return service.create_team_member(db, body)


@router.put("/{member_id}", response_model=TeamMemberResponse)
def update_item(member_id: int, body: TeamMemberInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    updated = service.update_team_member(db, member_id, body)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thành viên")
    return updated


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(member_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    deleted = service.delete_team_member(db, member_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thành viên")
```

- [ ] **Step 4: Mount the router**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.team.router import router as team_router
```

Add after `app.include_router(faq_router)`:

```python
app.include_router(team_router)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/team/test_router.py -v`
Expected: PASS (6 tests).

- [ ] **Step 6: Run the entire backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/team/router.py app/main.py tests/domains/team/test_router.py
git commit -m "feat: add team router with public reads and admin-gated writes"
```

---

## Task 4: `model-catalog` domain — model, migration, seed data

**Files:**
- Create: `backend/app/domains/model_catalog/__init__.py`
- Create: `backend/app/domains/model_catalog/models.py`
- Modify: `backend/alembic/env.py` (register the model)
- Create: `backend/app/domains/model_catalog/seed.py`
- Modify: `backend/app/main.py` (seed on startup)
- Create: `backend/tests/domains/model_catalog/__init__.py`
- Create: `backend/tests/domains/model_catalog/test_seed.py`

**Interfaces:**
- Consumes: `app.db.session.Base` (Phase 1).
- Produces: `app.domains.model_catalog.models.CatalogModel` (columns: `id`, `name`, `image`, `dossier_image`, `pose_count`, `tagline`, `undertone`, `height`, `body_shape`, `waist`, `personal_color`, `created_at`, `updated_at`). Produces: `seed_demo_models(db: Session) -> None`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/model_catalog/__init__.py` (empty).

Create `backend/tests/domains/model_catalog/test_seed.py`:

```python
from app.domains.model_catalog.models import CatalogModel
from app.domains.model_catalog.seed import seed_demo_models


def test_seed_demo_models_creates_twelve_models(db_session):
    seed_demo_models(db_session)
    models = db_session.query(CatalogModel).order_by(CatalogModel.id.asc()).all()
    assert len(models) == 12
    assert models[0].name == "Carmen"
    assert models[0].undertone == "neutral"


def test_seed_demo_models_is_idempotent(db_session):
    seed_demo_models(db_session)
    seed_demo_models(db_session)
    assert db_session.query(CatalogModel).count() == 12
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/model_catalog/test_seed.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.model_catalog'`.

- [ ] **Step 3: Create the model**

Create `backend/app/domains/model_catalog/__init__.py` (empty).

Create `backend/app/domains/model_catalog/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class CatalogModel(Base):
    __tablename__ = "catalog_models"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    image: Mapped[str] = mapped_column(String(500), nullable=False)
    dossier_image: Mapped[str] = mapped_column(String(500), nullable=False)
    pose_count: Mapped[int] = mapped_column(Integer, nullable=False)
    tagline: Mapped[str] = mapped_column(String(255), nullable=False)
    undertone: Mapped[str] = mapped_column(String(20), nullable=False)
    height: Mapped[str] = mapped_column(String(50), nullable=False)
    body_shape: Mapped[str] = mapped_column(String(100), nullable=False)
    waist: Mapped[str] = mapped_column(String(50), nullable=False)
    personal_color: Mapped[str] = mapped_column(String(100), nullable=False)
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

- [ ] **Step 4: Register the model with Alembic**

Modify `backend/alembic/env.py` — add:

```python
from app.domains.model_catalog import models as model_catalog_models  # noqa: F401
```

- [ ] **Step 5: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "create catalog_models table"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\d catalog_models'` shows the expected columns.

- [ ] **Step 6: Write the seed data**

Create `backend/app/domains/model_catalog/seed.py`:

```python
from sqlalchemy.orm import Session

from app.domains.model_catalog.models import CatalogModel

DEMO_MODELS = [
    {
        "name": "Carmen", "image": "/outfit/models/carmen-card.jpg", "dossier_image": "/outfit/models/carmen-dossier.jpg",
        "pose_count": 15, "tagline": "Tông da: Warm Neutral", "undertone": "neutral", "height": "1m65",
        "body_shape": "Đồng hồ cát", "waist": "64cm", "personal_color": "Autumn Soft",
    },
    {
        "name": "Aisha", "image": "/outfit/models/aisha.jpg", "dossier_image": "/outfit/models/aisha.jpg",
        "pose_count": 15, "tagline": "Da ngăm • Warm Deep", "undertone": "warm", "height": "1m70",
        "body_shape": "Đồng hồ cát", "waist": "66cm", "personal_color": "Warm Deep Autumn",
    },
    {
        "name": "Alice", "image": "/outfit/models/alice.jpg", "dossier_image": "/outfit/models/alice.jpg",
        "pose_count": 15, "tagline": "Da sáng • Cool Summer", "undertone": "cool", "height": "1m68",
        "body_shape": "Dáng thước kẻ", "waist": "62cm", "personal_color": "Cool Summer Light",
    },
    {
        "name": "Amara", "image": "/outfit/models/amara.jpg", "dossier_image": "/outfit/models/amara.jpg",
        "pose_count": 15, "tagline": "Afro Chic • Tôn đồ màu", "undertone": "warm", "height": "1m72",
        "body_shape": "Đồng hồ cát", "waist": "68cm", "personal_color": "Warm Spring Bright",
    },
    {
        "name": "Arjun", "image": "/outfit/models/arjun.jpg", "dossier_image": "/outfit/models/arjun.jpg",
        "pose_count": 12, "tagline": "Mẫu nam • Form Unisex", "undertone": "neutral", "height": "1m80",
        "body_shape": "Chữ nhật", "waist": "80cm", "personal_color": "Neutral Autumn",
    },
    {
        "name": "Astrid", "image": "/outfit/models/astrid.jpg", "dossier_image": "/outfit/models/astrid.jpg",
        "pose_count": 15, "tagline": "Tây Âu • Dáng thanh mảnh", "undertone": "cool", "height": "1m75",
        "body_shape": "Dáng thước kẻ", "waist": "60cm", "personal_color": "Cool Winter Bright",
    },
    {
        "name": "Chloe", "image": "/outfit/models/chloe.jpg", "dossier_image": "/outfit/models/chloe.jpg",
        "pose_count": 15, "tagline": "Á Đông • Dáng Petite", "undertone": "neutral", "height": "1m58",
        "body_shape": "Petite", "waist": "58cm", "personal_color": "Neutral Spring",
    },
    {
        "name": "Bella", "image": "/outfit/models/bella.jpg", "dossier_image": "/outfit/models/bella.jpg",
        "pose_count": 15, "tagline": "Đồng hồ cát • Đầy đặn", "undertone": "warm", "height": "1m67",
        "body_shape": "Đồng hồ cát", "waist": "70cm", "personal_color": "Warm Autumn Deep",
    },
    {
        "name": "Camille", "image": "/outfit/models/camille.jpg", "dossier_image": "/outfit/models/camille.jpg",
        "pose_count": 15, "tagline": "Parisian Chic • Dáng Quả Lê", "undertone": "neutral", "height": "1m66",
        "body_shape": "Quả lê", "waist": "65cm", "personal_color": "Neutral Summer",
    },
    {
        "name": "Dave", "image": "/outfit/models/dave.jpg", "dossier_image": "/outfit/models/dave.jpg",
        "pose_count": 10, "tagline": "Mẫu nam • Dáng thể thao", "undertone": "warm", "height": "1m82",
        "body_shape": "Thể thao", "waist": "82cm", "personal_color": "Warm Spring",
    },
    {
        "name": "Linh Đan", "image": "/outfit/models/linh-dan.jpg", "dossier_image": "/outfit/models/linh-dan.jpg",
        "pose_count": 15, "tagline": "Thuần Việt • Da trắng hồng", "undertone": "cool", "height": "1m62",
        "body_shape": "Đồng hồ cát", "waist": "60cm", "personal_color": "Cool Summer Soft",
    },
    {
        "name": "Kenji", "image": "/outfit/models/kenji.jpg", "dossier_image": "/outfit/models/kenji.jpg",
        "pose_count": 12, "tagline": "Tokyo Street • Tối giản", "undertone": "cool", "height": "1m75",
        "body_shape": "Chữ nhật", "waist": "76cm", "personal_color": "Cool Winter Deep",
    },
]


def seed_demo_models(db: Session) -> None:
    if db.query(CatalogModel).count() > 0:
        return
    for model in DEMO_MODELS:
        db.add(CatalogModel(**model))
    db.commit()
```

- [ ] **Step 7: Wire seeding into app startup**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.model_catalog.seed import seed_demo_models
```

In `lifespan`, add the call:

```python
        seed_demo_models(db)
```

- [ ] **Step 8: Run the test and verify it passes**

Run: `cd backend && pytest tests/domains/model_catalog/test_seed.py -v`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
cd backend
git add app/domains/model_catalog alembic/env.py alembic/versions app/main.py tests/domains/model_catalog
git commit -m "feat: add model-catalog model, migration, and seed data"
```

---

## Task 5: `model-catalog` domain — schemas and service

**Files:**
- Create: `backend/app/domains/model_catalog/schemas.py`
- Create: `backend/app/domains/model_catalog/service.py`
- Create: `backend/tests/domains/model_catalog/test_service.py`

**Interfaces:**
- Consumes: `app.domains.auth.schemas.CamelModel` (Phase 1); `app.domains.model_catalog.models.CatalogModel` (Task 4).
- Produces: `UNDERTONES: list[str]`, `CatalogModelInput`, `CatalogModelResponse`; `list_models(db) -> list[CatalogModel]`, `get_model(db, model_id) -> CatalogModel | None`, `create_model(db, data: CatalogModelInput) -> CatalogModel`, `update_model(db, model_id, data: CatalogModelInput) -> CatalogModel | None`, `delete_model(db, model_id) -> bool`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/model_catalog/test_service.py`:

```python
import pytest
from pydantic import ValidationError

from app.domains.model_catalog import service
from app.domains.model_catalog.schemas import CatalogModelInput

VALID_INPUT = {
    "name": "Test Model",
    "image": "/outfit/models/test.jpg",
    "dossierImage": "/outfit/models/test-dossier.jpg",
    "poseCount": 10,
    "tagline": "Test tagline",
    "undertone": "warm",
    "height": "1m70",
    "bodyShape": "Chữ nhật",
    "waist": "70cm",
    "personalColor": "Warm Spring",
}


def test_create_model(db_session):
    model = service.create_model(db_session, CatalogModelInput(**VALID_INPUT))
    assert model.id is not None
    assert model.name == "Test Model"


def test_list_models_orders_by_id(db_session):
    first = service.create_model(db_session, CatalogModelInput(**VALID_INPUT))
    second = service.create_model(db_session, CatalogModelInput(**{**VALID_INPUT, "name": "Second"}))
    models = service.list_models(db_session)
    assert [m.id for m in models] == [first.id, second.id]


def test_get_model_returns_none_when_missing(db_session):
    assert service.get_model(db_session, 99999) is None


def test_update_model(db_session):
    model = service.create_model(db_session, CatalogModelInput(**VALID_INPUT))
    updated = service.update_model(db_session, model.id, CatalogModelInput(**{**VALID_INPUT, "name": "Đã sửa"}))
    assert updated is not None
    assert updated.name == "Đã sửa"


def test_update_model_returns_none_when_missing(db_session):
    assert service.update_model(db_session, 99999, CatalogModelInput(**VALID_INPUT)) is None


def test_delete_model(db_session):
    model = service.create_model(db_session, CatalogModelInput(**VALID_INPUT))
    assert service.delete_model(db_session, model.id) is True
    assert service.get_model(db_session, model.id) is None


def test_delete_model_returns_false_when_missing(db_session):
    assert service.delete_model(db_session, 99999) is False


def test_model_input_rejects_blank_name():
    with pytest.raises(ValidationError):
        CatalogModelInput(**{**VALID_INPUT, "name": "   "})


def test_model_input_rejects_invalid_undertone():
    with pytest.raises(ValidationError):
        CatalogModelInput(**{**VALID_INPUT, "undertone": "not-a-real-undertone"})


def test_model_input_rejects_non_positive_pose_count():
    with pytest.raises(ValidationError):
        CatalogModelInput(**{**VALID_INPUT, "poseCount": 0})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/model_catalog/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.model_catalog.schemas'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/model_catalog/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

UNDERTONES = ["warm", "cool", "neutral"]


class CatalogModelInput(CamelModel):
    name: str
    image: str
    dossier_image: str
    pose_count: int
    tagline: str
    undertone: str
    height: str
    body_shape: str
    waist: str
    personal_color: str

    @field_validator("name", "image", "dossier_image", "tagline", "height", "body_shape", "waist", "personal_color")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Trường này không được để trống")
        return value.strip()

    @field_validator("undertone")
    @classmethod
    def undertone_valid(cls, value: str) -> str:
        if value not in UNDERTONES:
            raise ValueError("Undertone không hợp lệ")
        return value

    @field_validator("pose_count")
    @classmethod
    def pose_count_positive(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Số dáng chụp phải là số nguyên dương")
        return value


class CatalogModelResponse(CamelModel):
    id: int
    name: str
    image: str
    dossier_image: str
    pose_count: int
    tagline: str
    undertone: str
    height: str
    body_shape: str
    waist: str
    personal_color: str
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/model_catalog/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.model_catalog.models import CatalogModel
from app.domains.model_catalog.schemas import CatalogModelInput


def list_models(db: Session) -> list[CatalogModel]:
    return db.query(CatalogModel).order_by(CatalogModel.id.asc()).all()


def get_model(db: Session, model_id: int) -> CatalogModel | None:
    return db.get(CatalogModel, model_id)


def create_model(db: Session, data: CatalogModelInput) -> CatalogModel:
    model = CatalogModel(**data.model_dump())
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def update_model(db: Session, model_id: int, data: CatalogModelInput) -> CatalogModel | None:
    model = get_model(db, model_id)
    if model is None:
        return None
    for field, value in data.model_dump().items():
        setattr(model, field, value)
    db.commit()
    db.refresh(model)
    return model


def delete_model(db: Session, model_id: int) -> bool:
    model = get_model(db, model_id)
    if model is None:
        return False
    db.delete(model)
    db.commit()
    return True
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/model_catalog/test_service.py -v`
Expected: PASS (10 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/model_catalog/schemas.py app/domains/model_catalog/service.py tests/domains/model_catalog/test_service.py
git commit -m "feat: add model-catalog schemas with validation and service"
```

---

## Task 6: `model-catalog` domain — router

**Files:**
- Create: `backend/app/domains/model_catalog/router.py`
- Modify: `backend/app/main.py` (mount the router)
- Create: `backend/tests/domains/model_catalog/test_router.py`

**Interfaces:**
- Consumes: `service.*` (Task 5), `require_admin` (Phase 1).
- Produces: `app.domains.model_catalog.router.router`, an `APIRouter` mounted at prefix `/model-catalog` with routes `GET /`, `GET /{model_id}`, `POST /` (admin), `PUT /{model_id}` (admin), `DELETE /{model_id}` (admin).

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/model_catalog/test_router.py`:

```python
VALID_BODY = {
    "name": "Test Model",
    "image": "/outfit/models/test.jpg",
    "dossierImage": "/outfit/models/test-dossier.jpg",
    "poseCount": 10,
    "tagline": "Test tagline",
    "undertone": "warm",
    "height": "1m70",
    "bodyShape": "Chữ nhật",
    "waist": "70cm",
    "personalColor": "Warm Spring",
}


def _promote_to_admin(db_session, email: str) -> None:
    from app.domains.auth.models import User

    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()


def test_list_models_is_public(client):
    response = client.get("/model-catalog")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_model_returns_404_when_missing(client):
    response = client.get("/model-catalog/99999")
    assert response.status_code == 404


def test_create_model_requires_authentication(client):
    response = client.post("/model-catalog", json=VALID_BODY)
    assert response.status_code == 401


def test_create_model_requires_admin_role(client, db_session):
    client.post("/auth/register", json={"name": "T", "email": "model-user@example.com", "password": "password123"})
    client.post("/auth/login", json={"email": "model-user@example.com", "password": "password123"})
    response = client.post("/model-catalog", json=VALID_BODY)
    assert response.status_code == 403


def test_admin_can_create_get_update_and_delete_model(client, db_session):
    client.post("/auth/register", json={"name": "Admin", "email": "model-admin@example.com", "password": "password123"})
    _promote_to_admin(db_session, "model-admin@example.com")
    client.post("/auth/login", json={"email": "model-admin@example.com", "password": "password123"})

    create_response = client.post("/model-catalog", json=VALID_BODY)
    assert create_response.status_code == 201
    model_id = create_response.json()["id"]

    get_response = client.get(f"/model-catalog/{model_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Test Model"

    update_response = client.put(f"/model-catalog/{model_id}", json={**VALID_BODY, "name": "Đã sửa"})
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Đã sửa"

    delete_response = client.delete(f"/model-catalog/{model_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/model-catalog/{model_id}").status_code == 404


def test_create_model_rejects_invalid_body(client, db_session):
    client.post("/auth/register", json={"name": "Admin", "email": "model-admin2@example.com", "password": "password123"})
    _promote_to_admin(db_session, "model-admin2@example.com")
    client.post("/auth/login", json={"email": "model-admin2@example.com", "password": "password123"})

    response = client.post("/model-catalog", json={**VALID_BODY, "poseCount": 0})
    assert response.status_code == 422
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/model_catalog/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.model_catalog.router'`.

- [ ] **Step 3: Write the router**

Create `backend/app/domains/model_catalog/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.model_catalog import service
from app.domains.model_catalog.schemas import CatalogModelInput, CatalogModelResponse

router = APIRouter(prefix="/model-catalog", tags=["model-catalog"])


@router.get("", response_model=list[CatalogModelResponse])
def list_items(db: Session = Depends(get_db)):
    return service.list_models(db)


@router.get("/{model_id}", response_model=CatalogModelResponse)
def get_item(model_id: int, db: Session = Depends(get_db)):
    model = service.get_model(db, model_id)
    if model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người mẫu")
    return model


@router.post("", response_model=CatalogModelResponse, status_code=status.HTTP_201_CREATED)
def create_item(body: CatalogModelInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return service.create_model(db, body)


@router.put("/{model_id}", response_model=CatalogModelResponse)
def update_item(model_id: int, body: CatalogModelInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    updated = service.update_model(db, model_id, body)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người mẫu")
    return updated


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(model_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    deleted = service.delete_model(db, model_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người mẫu")
```

- [ ] **Step 4: Mount the router**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.model_catalog.router import router as model_catalog_router
```

Add after `app.include_router(team_router)`:

```python
app.include_router(model_catalog_router)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/model_catalog/test_router.py -v`
Expected: PASS (6 tests).

- [ ] **Step 6: Run the entire backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/model_catalog/router.py app/main.py tests/domains/model_catalog/test_router.py
git commit -m "feat: add model-catalog router with public reads and admin-gated writes"
```

---

## Task 7: `capsule-wardrobe` domain — model, migration, seed data

**Files:**
- Create: `backend/app/domains/capsule_wardrobe/__init__.py`
- Create: `backend/app/domains/capsule_wardrobe/models.py`
- Modify: `backend/alembic/env.py` (register the model)
- Create: `backend/app/domains/capsule_wardrobe/seed.py`
- Modify: `backend/app/main.py` (seed on startup)
- Create: `backend/tests/domains/capsule_wardrobe/__init__.py`
- Create: `backend/tests/domains/capsule_wardrobe/test_seed.py`

**Interfaces:**
- Consumes: `app.db.session.Base` (Phase 1).
- Produces: `app.domains.capsule_wardrobe.models.CapsuleSet` (columns: `id`, `image`, `alt`, `tag_variant`, `tag_label`, `fit_for`, `title`, `tone`, `description`, `items` (`JSONB`), `created_at`, `updated_at`). Produces: `seed_demo_capsule_sets(db: Session) -> None`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/capsule_wardrobe/__init__.py` (empty).

Create `backend/tests/domains/capsule_wardrobe/test_seed.py`:

```python
from app.domains.capsule_wardrobe.models import CapsuleSet
from app.domains.capsule_wardrobe.seed import seed_demo_capsule_sets


def test_seed_demo_capsule_sets_creates_three_sets(db_session):
    seed_demo_capsule_sets(db_session)
    sets = db_session.query(CapsuleSet).order_by(CapsuleSet.id.asc()).all()
    assert len(sets) == 3
    assert sets[0].title == "Thanh Lịch Công Sở"
    assert sets[0].items == [
        {"label": "Quần ống suông ngà:", "price": "490.000 ₫"},
        {"label": "Túi xách Minimalist:", "price": "720.000 ₫"},
    ]


def test_seed_demo_capsule_sets_is_idempotent(db_session):
    seed_demo_capsule_sets(db_session)
    seed_demo_capsule_sets(db_session)
    assert db_session.query(CapsuleSet).count() == 3
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/capsule_wardrobe/test_seed.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.capsule_wardrobe'`.

- [ ] **Step 3: Create the model**

Create `backend/app/domains/capsule_wardrobe/__init__.py` (empty).

Create `backend/app/domains/capsule_wardrobe/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class CapsuleSet(Base):
    __tablename__ = "capsule_sets"

    id: Mapped[int] = mapped_column(primary_key=True)
    image: Mapped[str] = mapped_column(String(500), nullable=False)
    alt: Mapped[str] = mapped_column(Text, nullable=False)
    tag_variant: Mapped[str] = mapped_column(String(20), nullable=False)
    tag_label: Mapped[str] = mapped_column(String(255), nullable=False)
    fit_for: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    tone: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    items: Mapped[list[dict]] = mapped_column(JSONB, nullable=False)
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

- [ ] **Step 4: Register the model with Alembic**

Modify `backend/alembic/env.py` — add:

```python
from app.domains.capsule_wardrobe import models as capsule_wardrobe_models  # noqa: F401
```

- [ ] **Step 5: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "create capsule_sets table"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\d capsule_sets'` shows `items` as type `jsonb`.

- [ ] **Step 6: Write the seed data**

Create `backend/app/domains/capsule_wardrobe/seed.py`:

```python
from sqlalchemy.orm import Session

from app.domains.capsule_wardrobe.models import CapsuleSet

DEMO_CAPSULE_SETS = [
    {
        "image": "/outfit/capsule-set-office.jpg",
        "alt": "Set đồ công sở thanh lịch với áo peplum hồng, quần ống suông trắng ngà và túi xách minimalist",
        "tag_variant": "primary",
        "tag_label": "Set 1 • Thanh Lịch",
        "fit_for": "Phù hợp: Office & Meeting",
        "title": "Thanh Lịch Công Sở",
        "tone": "Warm Cream",
        "description": (
            "Áo Peplum Voan Hồng + Quần Ống Suông Trắng Ngà + Túi xách Minimalist. Tối ưu chiều dài chân và "
            "tạo nét chuyên nghiệp, nhã nhặn."
        ),
        "items": [
            {"label": "Quần ống suông ngà:", "price": "490.000 ₫"},
            {"label": "Túi xách Minimalist:", "price": "720.000 ₫"},
        ],
    },
    {
        "image": "/outfit/capsule-set-date.jpg",
        "alt": "Set đồ dạo phố với áo peplum hồng, chân váy midi xám bạc và giày slingback",
        "tag_variant": "secondary",
        "tag_label": "Set 2 • Dạo Phố",
        "fit_for": "Phù hợp: Dating & Weekend",
        "title": "Hẹn Hò & Dạo Phố",
        "tone": "Soft Silver",
        "description": (
            "Áo Peplum + Chân Váy Xòe Midi Xám Bạc tôn vẻ nữ tính dịu dàng. Màu xám bạc lạnh làm nổi bật sắc "
            "hồng thanh khiết của áo."
        ),
        "items": [
            {"label": "Chân váy midi xám bạc:", "price": "530.000 ₫"},
            {"label": "Giày Slingback Satin:", "price": "650.000 ₫"},
        ],
    },
    {
        "image": "/outfit/capsule-set-accessories.jpg",
        "alt": "Phụ kiện khuyên tai bạc và túi pastel lilac bổ trợ cho set đồ",
        "tag_variant": "tertiary",
        "tag_label": "Set 3 • Điểm Nhấn",
        "fit_for": "Phù hợp: Điểm Nhấn Cao Cấp",
        "title": "Phụ Kiện Tối Ưu",
        "tone": "Pastel Lilac",
        "description": (
            "Khuyên Tai Bạc Silver + Túi Pastel Lilac ánh tím. Bổ trợ hoàn hảo cho nhóm màu Summer Soft mà "
            "không làm lu mờ sắc áo chính."
        ),
        "items": [
            {"label": "Khuyên tai bạc Ý 925:", "price": "320.000 ₫"},
            {"label": "Túi Pastel Lilac:", "price": "580.000 ₫"},
        ],
    },
]


def seed_demo_capsule_sets(db: Session) -> None:
    if db.query(CapsuleSet).count() > 0:
        return
    for capsule_set in DEMO_CAPSULE_SETS:
        db.add(CapsuleSet(**capsule_set))
    db.commit()
```

- [ ] **Step 7: Wire seeding into app startup**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.capsule_wardrobe.seed import seed_demo_capsule_sets
```

In `lifespan`, add the call:

```python
        seed_demo_capsule_sets(db)
```

- [ ] **Step 8: Run the test and verify it passes**

Run: `cd backend && pytest tests/domains/capsule_wardrobe/test_seed.py -v`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
cd backend
git add app/domains/capsule_wardrobe alembic/env.py alembic/versions app/main.py tests/domains/capsule_wardrobe
git commit -m "feat: add capsule-wardrobe model, migration, and seed data"
```

---

## Task 8: `capsule-wardrobe` domain — schemas and service

**Files:**
- Create: `backend/app/domains/capsule_wardrobe/schemas.py`
- Create: `backend/app/domains/capsule_wardrobe/service.py`
- Create: `backend/tests/domains/capsule_wardrobe/test_service.py`

**Interfaces:**
- Consumes: `app.domains.auth.schemas.CamelModel` (Phase 1); `app.domains.capsule_wardrobe.models.CapsuleSet` (Task 7).
- Produces: `TAG_VARIANTS: list[str]`, `CapsuleItem`, `CapsuleSetInput`, `CapsuleSetResponse`; `list_capsule_sets(db) -> list[CapsuleSet]`, `get_capsule_set(db, set_id) -> CapsuleSet | None`, `create_capsule_set(db, data: CapsuleSetInput) -> CapsuleSet`, `update_capsule_set(db, set_id, data: CapsuleSetInput) -> CapsuleSet | None`, `delete_capsule_set(db, set_id) -> bool`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/capsule_wardrobe/test_service.py`:

```python
import pytest
from pydantic import ValidationError

from app.domains.capsule_wardrobe import service
from app.domains.capsule_wardrobe.schemas import CapsuleSetInput

VALID_INPUT = {
    "image": "/outfit/capsule-test.jpg",
    "alt": "Ảnh test",
    "tagVariant": "primary",
    "tagLabel": "Set test",
    "fitFor": "Phù hợp: Test",
    "title": "Set Test",
    "tone": "Test Tone",
    "description": "Mô tả test",
    "items": [{"label": "Món đồ:", "price": "100.000 ₫"}],
}


def test_create_capsule_set(db_session):
    capsule_set = service.create_capsule_set(db_session, CapsuleSetInput(**VALID_INPUT))
    assert capsule_set.id is not None
    assert capsule_set.title == "Set Test"
    assert capsule_set.items == [{"label": "Món đồ:", "price": "100.000 ₫"}]


def test_list_capsule_sets_orders_by_id(db_session):
    first = service.create_capsule_set(db_session, CapsuleSetInput(**VALID_INPUT))
    second = service.create_capsule_set(db_session, CapsuleSetInput(**{**VALID_INPUT, "title": "Second"}))
    sets = service.list_capsule_sets(db_session)
    assert [s.id for s in sets] == [first.id, second.id]


def test_get_capsule_set_returns_none_when_missing(db_session):
    assert service.get_capsule_set(db_session, 99999) is None


def test_update_capsule_set(db_session):
    capsule_set = service.create_capsule_set(db_session, CapsuleSetInput(**VALID_INPUT))
    updated = service.update_capsule_set(
        db_session, capsule_set.id, CapsuleSetInput(**{**VALID_INPUT, "title": "Đã sửa"})
    )
    assert updated is not None
    assert updated.title == "Đã sửa"


def test_update_capsule_set_returns_none_when_missing(db_session):
    assert service.update_capsule_set(db_session, 99999, CapsuleSetInput(**VALID_INPUT)) is None


def test_delete_capsule_set(db_session):
    capsule_set = service.create_capsule_set(db_session, CapsuleSetInput(**VALID_INPUT))
    assert service.delete_capsule_set(db_session, capsule_set.id) is True
    assert service.get_capsule_set(db_session, capsule_set.id) is None


def test_delete_capsule_set_returns_false_when_missing(db_session):
    assert service.delete_capsule_set(db_session, 99999) is False


def test_capsule_set_input_rejects_blank_title():
    with pytest.raises(ValidationError):
        CapsuleSetInput(**{**VALID_INPUT, "title": "   "})


def test_capsule_set_input_rejects_invalid_tag_variant():
    with pytest.raises(ValidationError):
        CapsuleSetInput(**{**VALID_INPUT, "tagVariant": "not-a-real-variant"})


def test_capsule_set_input_rejects_empty_items():
    with pytest.raises(ValidationError):
        CapsuleSetInput(**{**VALID_INPUT, "items": []})


def test_capsule_set_input_rejects_item_with_blank_label():
    with pytest.raises(ValidationError):
        CapsuleSetInput(**{**VALID_INPUT, "items": [{"label": "  ", "price": "100.000 ₫"}]})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/capsule_wardrobe/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.capsule_wardrobe.schemas'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/capsule_wardrobe/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

TAG_VARIANTS = ["primary", "secondary", "tertiary"]


class CapsuleItem(CamelModel):
    label: str
    price: str

    @field_validator("label", "price")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Trường này không được để trống")
        return value.strip()


class CapsuleSetInput(CamelModel):
    image: str
    alt: str
    tag_variant: str
    tag_label: str
    fit_for: str
    title: str
    tone: str
    description: str
    items: list[CapsuleItem]

    @field_validator("image", "alt", "tag_label", "fit_for", "title", "tone", "description")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Trường này không được để trống")
        return value.strip()

    @field_validator("tag_variant")
    @classmethod
    def tag_variant_valid(cls, value: str) -> str:
        if value not in TAG_VARIANTS:
            raise ValueError("Màu nhãn không hợp lệ")
        return value

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, value: list[CapsuleItem]) -> list[CapsuleItem]:
        if not value:
            raise ValueError("Cần ít nhất 1 món đồ")
        return value


class CapsuleSetResponse(CamelModel):
    id: int
    image: str
    alt: str
    tag_variant: str
    tag_label: str
    fit_for: str
    title: str
    tone: str
    description: str
    items: list[CapsuleItem]
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/capsule_wardrobe/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.capsule_wardrobe.models import CapsuleSet
from app.domains.capsule_wardrobe.schemas import CapsuleSetInput


def _to_row_data(data: CapsuleSetInput) -> dict:
    row = data.model_dump()
    row["items"] = [item.model_dump() for item in data.items]
    return row


def list_capsule_sets(db: Session) -> list[CapsuleSet]:
    return db.query(CapsuleSet).order_by(CapsuleSet.id.asc()).all()


def get_capsule_set(db: Session, set_id: int) -> CapsuleSet | None:
    return db.get(CapsuleSet, set_id)


def create_capsule_set(db: Session, data: CapsuleSetInput) -> CapsuleSet:
    capsule_set = CapsuleSet(**_to_row_data(data))
    db.add(capsule_set)
    db.commit()
    db.refresh(capsule_set)
    return capsule_set


def update_capsule_set(db: Session, set_id: int, data: CapsuleSetInput) -> CapsuleSet | None:
    capsule_set = get_capsule_set(db, set_id)
    if capsule_set is None:
        return None
    for field, value in _to_row_data(data).items():
        setattr(capsule_set, field, value)
    db.commit()
    db.refresh(capsule_set)
    return capsule_set


def delete_capsule_set(db: Session, set_id: int) -> bool:
    capsule_set = get_capsule_set(db, set_id)
    if capsule_set is None:
        return False
    db.delete(capsule_set)
    db.commit()
    return True
```

Note: `_to_row_data` exists because `data.model_dump()` on its own would already deep-serialize nested `CapsuleItem` models into dicts — the explicit re-serialization line is there to keep the item shape unambiguous rather than relying on a nested `model_dump()` reference during a later refactor of `CapsuleItem`'s fields.

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/capsule_wardrobe/test_service.py -v`
Expected: PASS (11 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/capsule_wardrobe/schemas.py app/domains/capsule_wardrobe/service.py tests/domains/capsule_wardrobe/test_service.py
git commit -m "feat: add capsule-wardrobe schemas with validation and service"
```

---

## Task 9: `capsule-wardrobe` domain — router

**Files:**
- Create: `backend/app/domains/capsule_wardrobe/router.py`
- Modify: `backend/app/main.py` (mount the router)
- Create: `backend/tests/domains/capsule_wardrobe/test_router.py`

**Interfaces:**
- Consumes: `service.*` (Task 8), `require_admin` (Phase 1).
- Produces: `app.domains.capsule_wardrobe.router.router`, an `APIRouter` mounted at prefix `/capsule-wardrobe` with routes `GET /`, `GET /{set_id}`, `POST /` (admin), `PUT /{set_id}` (admin), `DELETE /{set_id}` (admin).

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/capsule_wardrobe/test_router.py`:

```python
VALID_BODY = {
    "image": "/outfit/capsule-test.jpg",
    "alt": "Ảnh test",
    "tagVariant": "primary",
    "tagLabel": "Set test",
    "fitFor": "Phù hợp: Test",
    "title": "Set Test",
    "tone": "Test Tone",
    "description": "Mô tả test",
    "items": [{"label": "Món đồ:", "price": "100.000 ₫"}],
}


def _promote_to_admin(db_session, email: str) -> None:
    from app.domains.auth.models import User

    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()


def test_list_capsule_sets_is_public(client):
    response = client.get("/capsule-wardrobe")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_capsule_set_returns_404_when_missing(client):
    response = client.get("/capsule-wardrobe/99999")
    assert response.status_code == 404


def test_create_capsule_set_requires_authentication(client):
    response = client.post("/capsule-wardrobe", json=VALID_BODY)
    assert response.status_code == 401


def test_create_capsule_set_requires_admin_role(client, db_session):
    client.post("/auth/register", json={"name": "T", "email": "capsule-user@example.com", "password": "password123"})
    client.post("/auth/login", json={"email": "capsule-user@example.com", "password": "password123"})
    response = client.post("/capsule-wardrobe", json=VALID_BODY)
    assert response.status_code == 403


def test_admin_can_create_get_update_and_delete_capsule_set(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "email": "capsule-admin@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "capsule-admin@example.com")
    client.post("/auth/login", json={"email": "capsule-admin@example.com", "password": "password123"})

    create_response = client.post("/capsule-wardrobe", json=VALID_BODY)
    assert create_response.status_code == 201
    set_id = create_response.json()["id"]

    get_response = client.get(f"/capsule-wardrobe/{set_id}")
    assert get_response.status_code == 200
    assert get_response.json()["title"] == "Set Test"

    update_response = client.put(f"/capsule-wardrobe/{set_id}", json={**VALID_BODY, "title": "Đã sửa"})
    assert update_response.status_code == 200
    assert update_response.json()["title"] == "Đã sửa"

    delete_response = client.delete(f"/capsule-wardrobe/{set_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/capsule-wardrobe/{set_id}").status_code == 404


def test_create_capsule_set_rejects_invalid_body(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "email": "capsule-admin2@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "capsule-admin2@example.com")
    client.post("/auth/login", json={"email": "capsule-admin2@example.com", "password": "password123"})

    response = client.post("/capsule-wardrobe", json={**VALID_BODY, "items": []})
    assert response.status_code == 422
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/capsule_wardrobe/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.capsule_wardrobe.router'`.

- [ ] **Step 3: Write the router**

Create `backend/app/domains/capsule_wardrobe/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.capsule_wardrobe import service
from app.domains.capsule_wardrobe.schemas import CapsuleSetInput, CapsuleSetResponse

router = APIRouter(prefix="/capsule-wardrobe", tags=["capsule-wardrobe"])


@router.get("", response_model=list[CapsuleSetResponse])
def list_items(db: Session = Depends(get_db)):
    return service.list_capsule_sets(db)


@router.get("/{set_id}", response_model=CapsuleSetResponse)
def get_item(set_id: int, db: Session = Depends(get_db)):
    capsule_set = service.get_capsule_set(db, set_id)
    if capsule_set is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy set đồ")
    return capsule_set


@router.post("", response_model=CapsuleSetResponse, status_code=status.HTTP_201_CREATED)
def create_item(body: CapsuleSetInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return service.create_capsule_set(db, body)


@router.put("/{set_id}", response_model=CapsuleSetResponse)
def update_item(set_id: int, body: CapsuleSetInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    updated = service.update_capsule_set(db, set_id, body)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy set đồ")
    return updated


@router.delete("/{set_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(set_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    deleted = service.delete_capsule_set(db, set_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy set đồ")
```

- [ ] **Step 4: Mount the router**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.capsule_wardrobe.router import router as capsule_wardrobe_router
```

Add after `app.include_router(model_catalog_router)`:

```python
app.include_router(capsule_wardrobe_router)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/capsule_wardrobe/test_router.py -v`
Expected: PASS (6 tests).

- [ ] **Step 6: Run the entire backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests PASS (this is the full backend for both Phase 1 and Phase 2 domains).

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/capsule_wardrobe/router.py app/main.py tests/domains/capsule_wardrobe/test_router.py
git commit -m "feat: add capsule-wardrobe router with public reads and admin-gated writes"
```

---

## Task 10: Frontend `team` cutover

**Files:**
- Modify: `frontend/lib/team.ts` (trim to types/constants only)
- Delete: `frontend/app/api/team/route.ts`, `frontend/app/api/team/route.test.ts`
- Delete: `frontend/app/api/team/[id]/route.ts`, `frontend/app/api/team/[id]/route.test.ts`
- Delete: `frontend/app/api/team/validate.ts` (no separate test file exists for it)
- Modify: `frontend/app/about/page.tsx`
- Modify: `frontend/app/about/page.test.tsx`
- Modify: `frontend/components/admin/TeamList.tsx`
- Modify: `frontend/components/admin/TeamList.test.tsx`
- Modify: `frontend/components/admin/TeamForm.tsx`
- Modify: `frontend/components/admin/TeamForm.test.tsx`
- Modify: `frontend/app/admin/team/[id]/edit/page.tsx`
- Modify: `frontend/app/admin/team/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/team` endpoints (Task 3).

- [ ] **Step 1: Trim `lib/team.ts` to types and constants**

Modify `frontend/lib/team.ts` — replace the entire file with:

```typescript
export type ColorVariant = 'primary' | 'secondary' | 'tertiary'
export const COLOR_VARIANTS: ColorVariant[] = ['primary', 'secondary', 'tertiary']

export type TeamMember = {
  id: number
  image: string
  name: string
  role: string
  bio: string
  badgeVariant: ColorVariant
  roleVariant: ColorVariant
  footerIcon: string
  footerLabel: string
  createdAt: string
  updatedAt: string
}

export type TeamMemberInput = {
  image: string
  name: string
  role: string
  bio: string
  badgeVariant: ColorVariant
  roleVariant: ColorVariant
  footerIcon: string
  footerLabel: string
}
```

- [ ] **Step 2: Update the About page to fetch from FastAPI**

Modify `frontend/app/about/page.tsx` — replace the full file:

```typescript
import AboutHero from '@/components/about/AboutHero'
import MissionVisionGrid from '@/components/about/MissionVisionGrid'
import StorySection from '@/components/about/StorySection'
import TeamGrid from '@/components/about/TeamGrid'
import AboutCtaBanner from '@/components/about/AboutCtaBanner'
import { apiFetch } from '@/lib/apiClient'
import type { TeamMember } from '@/lib/team'

export default async function AboutPage() {
  const response = await apiFetch('/team', { cache: 'no-store' })
  const members = response.ok ? ((await response.json()) as TeamMember[]) : []

  return (
    <main className="w-full bg-surface">
      <AboutHero />
      <MissionVisionGrid />
      <StorySection />
      <TeamGrid members={members} />
      <AboutCtaBanner />
    </main>
  )
}
```

- [ ] **Step 3: Update the About page test**

Modify `frontend/app/about/page.test.tsx` — replace the full file:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { TeamMember } from '@/lib/team'
import AboutPage from './page'

const MEMBERS: TeamMember[] = [
  {
    id: 1,
    image: '/about/team-seed.jpg',
    name: 'Thành viên seed test',
    role: 'Vai trò seed test',
    bio: 'Tiểu sử seed test',
    badgeVariant: 'primary',
    roleVariant: 'primary',
    footerIcon: 'verified',
    footerLabel: 'Footer seed test',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('AboutPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the seeded team member', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MEMBERS }))
    const page = await AboutPage()
    renderWithIntl(page)
    expect(screen.getByText('Thành viên seed test')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the About page test**

Run: `cd frontend && npx vitest run app/about/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Update TeamList to use apiClient**

Modify `frontend/components/admin/TeamList.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the two `fetch` calls:

```typescript
  useEffect(() => {
    apiFetch('/team')
      .then((response) => response.json())
      .then(setMembers)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/team/${id}`, { method: 'DELETE' })
    setMembers((current) => current?.filter((member) => member.id !== id) ?? null)
  }
```

- [ ] **Step 6: Update the TeamList delete test's fetch assertion**

Modify `frontend/components/admin/TeamList.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/team/1', { method: 'DELETE', credentials: 'include' })
```

- [ ] **Step 7: Run the TeamList tests**

Run: `cd frontend && npx vitest run components/admin/TeamList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 8: Update TeamForm to use apiClient and show a generic error**

Modify `frontend/components/admin/TeamForm.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the submit logic:

```typescript
    const response = await apiFetch(isEditing ? `/team/${initialMember!.id}` : '/team', {
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

    router.push('/admin/team')
```

- [ ] **Step 9: Update the TeamForm tests**

Modify `frontend/components/admin/TeamForm.test.tsx` — update the two `toHaveBeenCalledWith` assertions:

```typescript
    expect(fetch).toHaveBeenCalledWith('/team', expect.objectContaining({ method: 'POST', credentials: 'include' }))
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/team/6', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
```

Replace the third test (`'shows field errors returned by the API instead of redirecting'`):

```typescript
  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<TeamForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo thành viên' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
```

- [ ] **Step 10: Run the TeamForm tests**

Run: `cd frontend && npx vitest run components/admin/TeamForm.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 11: Update the edit page to use apiClient**

Modify `frontend/app/admin/team/[id]/edit/page.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the fetch call:

```typescript
      apiFetch(`/team/${id}`)
        .then((response) => response.json())
        .then(setMember)
```

- [ ] **Step 12: Update the edit page test's fetch assertion**

Modify `frontend/app/admin/team/[id]/edit/page.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/team/2', { credentials: 'include' })
```

- [ ] **Step 13: Run the edit page test**

Run: `cd frontend && npx vitest run --dir app/admin/team`
Expected: PASS.

- [ ] **Step 14: Delete the old team API routes**

```bash
cd frontend
rm app/api/team/route.ts app/api/team/route.test.ts
rm app/api/team/validate.ts
rm "app/api/team/[id]/route.ts" "app/api/team/[id]/route.test.ts"
```

- [ ] **Step 15: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass.

- [ ] **Step 16: Commit**

```bash
cd frontend
git add lib/team.ts app/about/page.tsx app/about/page.test.tsx components/admin/TeamList.tsx components/admin/TeamList.test.tsx components/admin/TeamForm.tsx components/admin/TeamForm.test.tsx app/admin/team
git rm app/api/team/route.ts app/api/team/route.test.ts app/api/team/validate.ts
git rm "app/api/team/[id]/route.ts" "app/api/team/[id]/route.test.ts"
git commit -m "feat: cut team over to FastAPI, both public reads and admin CRUD"
```

---

## Task 11: Frontend `model-catalog` cutover

**Files:**
- Modify: `frontend/lib/modelCatalog.ts` (trim to types/constants only)
- Delete: `frontend/app/api/model-catalog/route.ts`, `frontend/app/api/model-catalog/route.test.ts`
- Delete: `frontend/app/api/model-catalog/[id]/route.ts`, `frontend/app/api/model-catalog/[id]/route.test.ts`
- Delete: `frontend/app/api/model-catalog/validate.ts`
- Modify: `frontend/app/outfit/step-2/page.tsx`
- Modify: `frontend/app/outfit/step-2/page.test.tsx`
- Modify: `frontend/app/outfit/layout.tsx`
- Modify: `frontend/components/admin/ModelList.tsx`
- Modify: `frontend/components/admin/ModelList.test.tsx`
- Modify: `frontend/components/admin/ModelForm.tsx`
- Modify: `frontend/components/admin/ModelForm.test.tsx`
- Modify: `frontend/app/admin/model-catalog/[id]/edit/page.tsx`
- Modify: `frontend/app/admin/model-catalog/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/model-catalog` endpoints (Task 6).

- [ ] **Step 1: Trim `lib/modelCatalog.ts` to types and constants**

Modify `frontend/lib/modelCatalog.ts` — replace the entire file with:

```typescript
export type Undertone = 'warm' | 'cool' | 'neutral'
export const UNDERTONES: Undertone[] = ['warm', 'cool', 'neutral']

export type CatalogModel = {
  id: number
  name: string
  image: string
  dossierImage: string
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
  createdAt: string
  updatedAt: string
}

export type CatalogModelInput = {
  name: string
  image: string
  dossierImage: string
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
}
```

- [ ] **Step 2: Update the outfit Step 2 page to fetch from FastAPI**

Modify `frontend/app/outfit/step-2/page.tsx` — replace the full file:

```typescript
import Step2PageContent from '@/components/outfit/step2/Step2PageContent'
import { apiFetch } from '@/lib/apiClient'
import type { CatalogModel } from '@/lib/modelCatalog'

export default async function Step2Page() {
  const response = await apiFetch('/model-catalog', { cache: 'no-store' })
  const models = response.ok ? ((await response.json()) as CatalogModel[]) : []
  return <Step2PageContent models={models} />
}
```

- [ ] **Step 3: Update the outfit Step 2 page test**

Modify `frontend/app/outfit/step-2/page.test.tsx` — replace the full file:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import type { CatalogModel } from '@/lib/modelCatalog'
import Step2Page from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MODELS: CatalogModel[] = [
  {
    id: 1,
    name: 'Carmen',
    image: '/outfit/models/carmen-card.jpg',
    dossierImage: '/outfit/models/carmen-dossier.jpg',
    poseCount: 15,
    tagline: 'Tông da: Warm Neutral',
    undertone: 'neutral',
    height: '1m65',
    bodyShape: 'Đồng hồ cát',
    waist: '64cm',
    personalColor: 'Autumn Soft',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('Step2Page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the step heading with models loaded from the database', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => MODELS }))
    const page = await Step2Page()
    renderWithIntl(<OutfitFlowProvider>{page}</OutfitFlowProvider>)
    expect(
      screen.getByRole('heading', { name: 'Bước 2: Chọn Người Mẫu Hoặc Tải Ảnh Cá Nhân' })
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the Step 2 page test**

Run: `cd frontend && npx vitest run app/outfit/step-2/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Update the outfit layout to fetch from FastAPI**

Modify `frontend/app/outfit/layout.tsx` — replace the full file:

```typescript
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import OutfitFlowChrome from '@/components/outfit/OutfitFlowChrome'
import { apiFetch } from '@/lib/apiClient'
import type { CatalogModel } from '@/lib/modelCatalog'

export default async function OutfitLayout({ children }: { children: React.ReactNode }) {
  const response = await apiFetch('/model-catalog', { cache: 'no-store' })
  const models = response.ok ? ((await response.json()) as CatalogModel[]) : []
  const firstModel = models[0]
  const initialModel = firstModel ? { ...firstModel, id: String(firstModel.id) } : undefined

  return (
    <OutfitFlowProvider initialModel={initialModel}>
      <OutfitFlowChrome>{children}</OutfitFlowChrome>
    </OutfitFlowProvider>
  )
}
```

There is no `app/outfit/layout.test.tsx` — no test file to update for this step.

- [ ] **Step 6: Update ModelList to use apiClient**

Modify `frontend/components/admin/ModelList.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the two `fetch` calls:

```typescript
  useEffect(() => {
    apiFetch('/model-catalog')
      .then((response) => response.json())
      .then(setModels)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/model-catalog/${id}`, { method: 'DELETE' })
    setModels((current) => current?.filter((model) => model.id !== id) ?? null)
  }
```

- [ ] **Step 7: Update the ModelList delete test's fetch assertion**

Modify `frontend/components/admin/ModelList.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/model-catalog/1', { method: 'DELETE', credentials: 'include' })
```

- [ ] **Step 8: Run the ModelList tests**

Run: `cd frontend && npx vitest run components/admin/ModelList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 9: Update ModelForm to use apiClient and show a generic error**

Modify `frontend/components/admin/ModelForm.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the submit logic:

```typescript
    const response = await apiFetch(isEditing ? `/model-catalog/${initialModel!.id}` : '/model-catalog', {
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

    router.push('/admin/model-catalog')
```

- [ ] **Step 10: Update the ModelForm tests**

Modify `frontend/components/admin/ModelForm.test.tsx` — update the two `toHaveBeenCalledWith` assertions:

```typescript
    expect(fetch).toHaveBeenCalledWith('/model-catalog', expect.objectContaining({ method: 'POST', credentials: 'include' }))
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/model-catalog/5', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
```

Replace the third test:

```typescript
  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<ModelForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo người mẫu' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
```

- [ ] **Step 11: Run the ModelForm tests**

Run: `cd frontend && npx vitest run components/admin/ModelForm.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 12: Update the edit page to use apiClient**

Modify `frontend/app/admin/model-catalog/[id]/edit/page.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the fetch call:

```typescript
      apiFetch(`/model-catalog/${id}`)
        .then((response) => response.json())
        .then(setModel)
```

- [ ] **Step 13: Update the edit page test's fetch assertion**

Modify `frontend/app/admin/model-catalog/[id]/edit/page.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/model-catalog/3', { credentials: 'include' })
```

- [ ] **Step 14: Run the edit page test**

Run: `cd frontend && npx vitest run --dir app/admin/model-catalog`
Expected: PASS.

- [ ] **Step 15: Delete the old model-catalog API routes**

```bash
cd frontend
rm app/api/model-catalog/route.ts app/api/model-catalog/route.test.ts
rm app/api/model-catalog/validate.ts
rm "app/api/model-catalog/[id]/route.ts" "app/api/model-catalog/[id]/route.test.ts"
```

- [ ] **Step 16: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass.

- [ ] **Step 17: Commit**

```bash
cd frontend
git add lib/modelCatalog.ts app/outfit/step-2 app/outfit/layout.tsx components/admin/ModelList.tsx components/admin/ModelList.test.tsx components/admin/ModelForm.tsx components/admin/ModelForm.test.tsx app/admin/model-catalog
git rm app/api/model-catalog/route.ts app/api/model-catalog/route.test.ts app/api/model-catalog/validate.ts
git rm "app/api/model-catalog/[id]/route.ts" "app/api/model-catalog/[id]/route.test.ts"
git commit -m "feat: cut model-catalog over to FastAPI, both public reads and admin CRUD"
```

---

## Task 12: Frontend `capsule-wardrobe` cutover

**Files:**
- Modify: `frontend/lib/capsuleWardrobe.ts` (trim to types/constants only)
- Delete: `frontend/app/api/capsule-wardrobe/route.ts`, `frontend/app/api/capsule-wardrobe/route.test.ts`
- Delete: `frontend/app/api/capsule-wardrobe/[id]/route.ts`, `frontend/app/api/capsule-wardrobe/[id]/route.test.ts`
- Delete: `frontend/app/api/capsule-wardrobe/validate.ts`
- Modify: `frontend/app/outfit/step-4/page.tsx`
- Modify: `frontend/app/outfit/step-4/page.test.tsx`
- Modify: `frontend/components/admin/CapsuleList.tsx`
- Modify: `frontend/components/admin/CapsuleList.test.tsx`
- Modify: `frontend/components/admin/CapsuleForm.tsx`
- Modify: `frontend/components/admin/CapsuleForm.test.tsx`
- Modify: `frontend/app/admin/capsule-wardrobe/[id]/edit/page.tsx`
- Modify: `frontend/app/admin/capsule-wardrobe/[id]/edit/page.test.tsx`

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/capsule-wardrobe` endpoints (Task 9).

- [ ] **Step 1: Trim `lib/capsuleWardrobe.ts` to types and constants**

Modify `frontend/lib/capsuleWardrobe.ts` — replace the entire file with:

```typescript
export type TagVariant = 'primary' | 'secondary' | 'tertiary'
export const TAG_VARIANTS: TagVariant[] = ['primary', 'secondary', 'tertiary']

export type CapsuleItem = {
  label: string
  price: string
}

export type CapsuleSet = {
  id: number
  image: string
  alt: string
  tagVariant: TagVariant
  tagLabel: string
  fitFor: string
  title: string
  tone: string
  description: string
  items: CapsuleItem[]
  createdAt: string
  updatedAt: string
}

export type CapsuleSetInput = {
  image: string
  alt: string
  tagVariant: TagVariant
  tagLabel: string
  fitFor: string
  title: string
  tone: string
  description: string
  items: CapsuleItem[]
}
```

- [ ] **Step 2: Update the outfit Step 4 page to fetch from FastAPI**

Modify `frontend/app/outfit/step-4/page.tsx` — replace the full file:

```typescript
import Step4PageContent from '@/components/outfit/step4/Step4PageContent'
import { apiFetch } from '@/lib/apiClient'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

export default async function Step4Page() {
  const response = await apiFetch('/capsule-wardrobe', { cache: 'no-store' })
  const capsuleSets = response.ok ? ((await response.json()) as CapsuleSet[]) : []
  return <Step4PageContent capsuleSets={capsuleSets} />
}
```

- [ ] **Step 3: Update the outfit Step 4 page test**

Modify `frontend/app/outfit/step-4/page.test.tsx` — replace the full file:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'
import Step4Page from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const SETS: CapsuleSet[] = [
  {
    id: 1,
    image: '/outfit/capsule-set-office.jpg',
    alt: 'Ảnh set 1',
    tagVariant: 'primary',
    tagLabel: 'Set 1 • Thanh Lịch',
    fitFor: 'Phù hợp: Office & Meeting',
    title: 'Thanh Lịch Công Sở',
    tone: 'Warm Cream',
    description: 'Mô tả set 1',
    items: [{ label: 'Quần ống suông ngà:', price: '490.000 ₫' }],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('Step4Page', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the result heading with capsule sets loaded from the database', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => SETS }))
    const page = await Step4Page()
    renderWithIntl(<OutfitFlowProvider>{page}</OutfitFlowProvider>)
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ Ảo AI FitRoom HD' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the Step 4 page test**

Run: `cd frontend && npx vitest run app/outfit/step-4/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Update CapsuleList to use apiClient**

Modify `frontend/components/admin/CapsuleList.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the two `fetch` calls:

```typescript
  useEffect(() => {
    apiFetch('/capsule-wardrobe')
      .then((response) => response.json())
      .then(setSets)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/capsule-wardrobe/${id}`, { method: 'DELETE' })
    setSets((current) => current?.filter((set) => set.id !== id) ?? null)
  }
```

- [ ] **Step 6: Update the CapsuleList delete test's fetch assertion**

Modify `frontend/components/admin/CapsuleList.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/capsule-wardrobe/1', { method: 'DELETE', credentials: 'include' })
```

- [ ] **Step 7: Run the CapsuleList tests**

Run: `cd frontend && npx vitest run components/admin/CapsuleList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 8: Update CapsuleForm to use apiClient and show a generic error**

Modify `frontend/components/admin/CapsuleForm.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the submit logic:

```typescript
    const response = await apiFetch(
      isEditing ? `/capsule-wardrobe/${initialSet!.id}` : '/capsule-wardrobe',
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

    router.push('/admin/capsule-wardrobe')
```

- [ ] **Step 9: Update the CapsuleForm tests**

Modify `frontend/components/admin/CapsuleForm.test.tsx` — update the two `toHaveBeenCalledWith` assertions:

```typescript
    expect(fetch).toHaveBeenCalledWith('/capsule-wardrobe', expect.objectContaining({ method: 'POST', credentials: 'include' }))
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/capsule-wardrobe/9', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
```

Replace the fourth test (`'shows field errors returned by the API instead of redirecting'`):

```typescript
  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<CapsuleForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo set đồ' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
```

- [ ] **Step 10: Run the CapsuleForm tests**

Run: `cd frontend && npx vitest run components/admin/CapsuleForm.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 11: Update the edit page to use apiClient**

Modify `frontend/app/admin/capsule-wardrobe/[id]/edit/page.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the fetch call:

```typescript
      apiFetch(`/capsule-wardrobe/${id}`)
        .then((response) => response.json())
        .then(setSet)
```

- [ ] **Step 12: Update the edit page test's fetch assertion**

Modify `frontend/app/admin/capsule-wardrobe/[id]/edit/page.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/capsule-wardrobe/4', { credentials: 'include' })
```

- [ ] **Step 13: Run the edit page test**

Run: `cd frontend && npx vitest run --dir app/admin/capsule-wardrobe`
Expected: PASS.

- [ ] **Step 14: Delete the old capsule-wardrobe API routes**

```bash
cd frontend
rm app/api/capsule-wardrobe/route.ts app/api/capsule-wardrobe/route.test.ts
rm app/api/capsule-wardrobe/validate.ts
rm "app/api/capsule-wardrobe/[id]/route.ts" "app/api/capsule-wardrobe/[id]/route.test.ts"
```

- [ ] **Step 15: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass.

- [ ] **Step 16: Manually verify in the browser**

With PostgreSQL running, the backend running (`cd backend && uvicorn app.main:app --reload`) and the frontend running (`cd frontend && npm run dev`), with `frontend/.env.local` containing `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`:
- Visit `/about` — the 3 seeded team members render.
- Visit `/outfit/step-2` — the 12 seeded models render, selectable.
- Visit `/outfit/step-4` — the 3 seeded capsule sets render with their items.
- Log in as `admin@twistfit.vn` / `admin1234`, visit `/admin/team`, `/admin/model-catalog`, `/admin/capsule-wardrobe` — create, edit, and delete an entry in each, confirming each round-trips correctly.

- [ ] **Step 17: Commit**

```bash
cd frontend
git add lib/capsuleWardrobe.ts app/outfit/step-4 components/admin/CapsuleList.tsx components/admin/CapsuleList.test.tsx components/admin/CapsuleForm.tsx components/admin/CapsuleForm.test.tsx app/admin/capsule-wardrobe
git rm app/api/capsule-wardrobe/route.ts app/api/capsule-wardrobe/route.test.ts app/api/capsule-wardrobe/validate.ts
git rm "app/api/capsule-wardrobe/[id]/route.ts" "app/api/capsule-wardrobe/[id]/route.test.ts"
git commit -m "feat: cut capsule-wardrobe over to FastAPI, both public reads and admin CRUD"
```
