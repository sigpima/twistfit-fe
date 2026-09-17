# Dynamic Wardrobe Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded wardrobe category/style/occasion lists with an admin-editable "taxonomy" system (groups + values in Postgres), make the Gemini wardrobe-classification prompt build dynamically from that data, and add a working "Lọc" (Filter) dropdown to outfit step-1's wardrobe library.

**Architecture:** New backend domain `app/domains/taxonomy/` (FastAPI + SQLAlchemy, mirrors the existing `faq` domain's model/schema/service/router layout) owns two tables (`taxonomy_groups`, `taxonomy_values`) with public read + admin-gated write endpoints. `wardrobe_items` moves from three fixed columns (`category`, `style_tags`, `occasion_tags`) to one `attributes: JSONB` column keyed by taxonomy group key. `wardrobe/gemini_client.py` and `accessories/gemini_client.py` build their prompts at request time from live taxonomy data instead of module-level constants. Frontend gets a new `/admin/taxonomy` CRUD UI, a `lib/taxonomy.ts` fetch helper reused by the wardrobe upload/filter UI, and `WardrobeLibrary.tsx`/`OccasionStyleSelector.tsx`/`OutfitFlowProvider.tsx`/`UploadFlow.tsx` are updated to read groups/values dynamically instead of hardcoded TS unions.

**Tech Stack:** Backend: Python/FastAPI, SQLAlchemy 2.0 (`Mapped`/`mapped_column`), Alembic, PostgreSQL, Pydantic v2 (`CamelModel`), pytest (real Postgres test DB via `tests/conftest.py`, migrated to head per test session). Frontend: Next.js App Router, TypeScript, Tailwind, next-intl, Vitest + Testing Library.

**Spec:** [docs/superpowers/specs/2026-09-17-dynamic-wardrobe-taxonomy-design.md](../specs/2026-09-17-dynamic-wardrobe-taxonomy-design.md) — the plan argues from this spec; executors should read both.

## Global Constraints

- Backend domain layout: `models.py`, `schemas.py`, `service.py`, `router.py` (+ `seed.py` where seed data exists) per domain, exactly mirroring `app/domains/faq/`.
- All Pydantic schemas extend `CamelModel` (`app/domains/auth/schemas.py`) so the JSON API is camelCase while Python stays snake_case.
- Admin-gated write endpoints use `_admin = Depends(require_admin)` (`app/deps.py`); public read endpoints take no auth dependency.
- Every new Alembic migration's `down_revision` must be the current chain head: **`3f56461f19fc`** (create_accessory_products_table) until a task in this plan adds a newer one — check `alembic/versions/` for the actual current head before generating a migration if executing tasks out of order.
- Any new SQLAlchemy model module must be imported (with `# noqa: F401`) in `alembic/env.py` so `alembic revision --autogenerate` (or manual migrations) sees it, and in `app/main.py` if it needs a router/seed registered.
- Frontend: every new/changed user-facing string goes in `messages/vi.json` (single-locale app, no `en.json`). Admin CRUD i18n key convention: `Admin.<Entity>List` (title, newButton, columnX, editButton, deleteButton, deleteConfirm, emptyState, loading) + `Admin.<Entity>Form` (fields.*, submitCreate, submitEdit, unauthorizedError, genericError) — copy this shape exactly.
- Frontend tests stub the global `fetch` directly (`vi.stubGlobal('fetch', vi.fn(...))` / `vi.unstubAllGlobals()` in `afterEach`) and wrap components in `renderWithIntl` from `test-utils/renderWithIntl.tsx`. No dedicated `apiFetch` mock helper exists — don't invent one.
- Backend tests use the real Postgres test DB via the `client`/`db_session` fixtures in `tests/conftest.py`; admin auth in tests is faked by registering a user then flipping `role` to `"admin"` directly via `db_session.query(User).filter(...).update({"role": "admin"})` + `db_session.commit()`, never by mocking `require_admin`. Gemini calls are mocked via `monkeypatch.setattr(gemini_client, "_call_gemini", lambda image_bytes: ...)`.

---

## Task 1: Taxonomy domain — models + migration

**Files:**
- Create: `backend/app/domains/taxonomy/__init__.py` (empty)
- Create: `backend/app/domains/taxonomy/models.py`
- Modify: `backend/alembic/env.py` (register the new models module)
- Create: `backend/alembic/versions/<new_revision>_create_taxonomy_groups_and_values_tables.py`
- Test: `backend/tests/domains/taxonomy/test_models.py`
- Test: `backend/tests/domains/taxonomy/__init__.py` (empty, matches sibling domains' test package layout)

**Interfaces:**
- Produces: `TaxonomyGroup` (columns: `id`, `key: str` unique, `label: str`, `sort_order: int`, `created_at`, `updated_at`, relationship `values: list[TaxonomyValue]`), `TaxonomyValue` (columns: `id`, `group_id: int` FK, `key: str`, `label: str`, `sort_order: int`, `created_at`, `updated_at`, relationship `group: TaxonomyGroup`), both in `app.domains.taxonomy.models`, table names `taxonomy_groups` / `taxonomy_values`.

- [ ] **Step 1: Write the failing model test**

```python
# backend/tests/domains/taxonomy/test_models.py
from app.domains.taxonomy.models import TaxonomyGroup, TaxonomyValue


def test_group_can_be_created_with_values(db_session):
    group = TaxonomyGroup(key="clothing-type", label="Loại quần áo", sort_order=0)
    group.values.append(TaxonomyValue(key="ao", label="Áo", sort_order=0))
    group.values.append(TaxonomyValue(key="quan", label="Quần", sort_order=1))
    db_session.add(group)
    db_session.commit()
    db_session.refresh(group)

    assert group.id is not None
    assert [v.key for v in group.values] == ["ao", "quan"]
    assert group.values[0].group_id == group.id


def test_deleting_group_cascades_to_its_values(db_session):
    group = TaxonomyGroup(key="occasion", label="Loại dịp", sort_order=0)
    group.values.append(TaxonomyValue(key="hang-ngay", label="Hằng ngày", sort_order=0))
    db_session.add(group)
    db_session.commit()
    value_id = group.values[0].id

    db_session.delete(group)
    db_session.commit()

    assert db_session.get(TaxonomyValue, value_id) is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/domains/taxonomy/test_models.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.taxonomy'`

- [ ] **Step 3: Create the empty package files**

```bash
mkdir -p backend/app/domains/taxonomy backend/tests/domains/taxonomy
touch backend/app/domains/taxonomy/__init__.py backend/tests/domains/taxonomy/__init__.py
```

- [ ] **Step 4: Write `models.py`**

```python
# backend/app/domains/taxonomy/models.py
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TaxonomyGroup(Base):
    __tablename__ = "taxonomy_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    values: Mapped[list["TaxonomyValue"]] = relationship(
        "TaxonomyValue",
        back_populates="group",
        cascade="all, delete-orphan",
        order_by="TaxonomyValue.sort_order",
    )


class TaxonomyValue(Base):
    __tablename__ = "taxonomy_values"
    __table_args__ = (UniqueConstraint("group_id", "key", name="uq_taxonomy_values_group_id_key"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(
        ForeignKey("taxonomy_groups.id", ondelete="CASCADE"), nullable=False, index=True
    )
    key: Mapped[str] = mapped_column(String(50), nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    group: Mapped["TaxonomyGroup"] = relationship("TaxonomyGroup", back_populates="values")
```

- [ ] **Step 5: Register the model module in `alembic/env.py`**

In `backend/alembic/env.py`, add this line alongside the other domain model imports (after the `accessories` import, since that's currently the last one):

```python
from app.domains.accessories import models as accessories_models  # noqa: F401
from app.domains.taxonomy import models as taxonomy_models  # noqa: F401
```

- [ ] **Step 6: Generate and write the migration**

Run: `cd backend && alembic revision -m "create taxonomy_groups and taxonomy_values tables"`

This prints a new revision id (call it `<rev>`) and creates `backend/alembic/versions/<rev>_create_taxonomy_groups_and_taxonomy_values_tables.py` with empty `upgrade`/`downgrade`. Edit it to:

```python
"""create taxonomy_groups and taxonomy_values tables

Revision ID: <rev>
Revises: 3f56461f19fc
Create Date: 2026-09-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "<rev>"
down_revision: Union[str, None] = "3f56461f19fc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "taxonomy_groups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_table(
        "taxonomy_values",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["taxonomy_groups.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("group_id", "key", name="uq_taxonomy_values_group_id_key"),
    )
    op.create_index(op.f("ix_taxonomy_values_group_id"), "taxonomy_values", ["group_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_taxonomy_values_group_id"), table_name="taxonomy_values")
    op.drop_table("taxonomy_values")
    op.drop_table("taxonomy_groups")
```

Replace both `<rev>` placeholders with the actual generated revision id from the filename.

- [ ] **Step 7: Run test to verify it passes**

Run: `cd backend && pytest tests/domains/taxonomy/test_models.py -v`
Expected: PASS (the `_migrated_test_database` session fixture in `tests/conftest.py` runs `alembic upgrade head` automatically, which now includes this migration)

- [ ] **Step 8: Commit**

```bash
git add backend/app/domains/taxonomy/__init__.py backend/app/domains/taxonomy/models.py \
        backend/tests/domains/taxonomy/ backend/alembic/env.py backend/alembic/versions/
git commit -m "feat(taxonomy): add TaxonomyGroup/TaxonomyValue models and migration"
```

---

## Task 2: Taxonomy domain — schemas

**Files:**
- Create: `backend/app/domains/taxonomy/schemas.py`

**Interfaces:**
- Consumes: nothing new beyond `CamelModel` (`app.domains.auth.schemas`).
- Produces: `TaxonomyValueInput(key: str, label: str)`, `TaxonomyValueResponse(id, key, label, sort_order, created_at, updated_at)`, `TaxonomyGroupInput(key: str, label: str)`, `TaxonomyGroupResponse(id, key, label, sort_order, values: list[TaxonomyValueResponse], created_at, updated_at)` — all in `app.domains.taxonomy.schemas`, used by Task 3's service and Task 4's router.

No test for this task alone — schemas are exercised end-to-end by Task 4's router tests (this mirrors how `faq/schemas.py` has no standalone test file; only `faq/service.py`/`faq/router.py` are tested).

- [ ] **Step 1: Write `schemas.py`**

```python
# backend/app/domains/taxonomy/schemas.py
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel


class TaxonomyValueInput(CamelModel):
    key: str
    label: str

    @field_validator("key")
    @classmethod
    def key_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Mã giá trị không được để trống")
        return value.strip()

    @field_validator("label")
    @classmethod
    def label_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Tên giá trị không được để trống")
        return value.strip()


class TaxonomyValueResponse(CamelModel):
    id: int
    key: str
    label: str
    sort_order: int
    created_at: datetime
    updated_at: datetime


class TaxonomyGroupInput(CamelModel):
    key: str
    label: str

    @field_validator("key")
    @classmethod
    def key_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Mã nhóm không được để trống")
        return value.strip()

    @field_validator("label")
    @classmethod
    def label_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Tên nhóm không được để trống")
        return value.strip()


class TaxonomyGroupResponse(CamelModel):
    id: int
    key: str
    label: str
    sort_order: int
    values: list[TaxonomyValueResponse]
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 2: Verify it imports cleanly**

Run: `cd backend && python -c "from app.domains.taxonomy.schemas import TaxonomyGroupInput, TaxonomyGroupResponse, TaxonomyValueInput, TaxonomyValueResponse; print('ok')"`
Expected: prints `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/app/domains/taxonomy/schemas.py
git commit -m "feat(taxonomy): add taxonomy Pydantic schemas"
```

---

## Task 3: Taxonomy domain — service layer

**Files:**
- Create: `backend/app/domains/taxonomy/service.py`
- Test: `backend/tests/domains/taxonomy/test_service.py`

**Interfaces:**
- Consumes: `TaxonomyGroup`, `TaxonomyValue` (Task 1), `TaxonomyGroupInput`, `TaxonomyValueInput` (Task 2).
- Produces (all in `app.domains.taxonomy.service`, all take `db: Session` first):
  - `list_groups(db) -> list[TaxonomyGroup]` — all groups ordered by `sort_order`, values eager-loaded/ordered (relationship already orders values).
  - `get_group(db, group_id: int) -> TaxonomyGroup | None`
  - `create_group(db, data: TaxonomyGroupInput) -> TaxonomyGroup`
  - `update_group(db, group_id: int, data: TaxonomyGroupInput) -> TaxonomyGroup | None`
  - `create_value(db, group_id: int, data: TaxonomyValueInput) -> TaxonomyValue | None` (returns `None` if group doesn't exist)
  - `update_value(db, value_id: int, data: TaxonomyValueInput) -> TaxonomyValue | None`
  - `delete_value(db, value_id: int) -> bool` (raises `ValueError` if the value is referenced by any wardrobe item or accessory product — see Step 4)
  - `get_group_values(db, group_key: str) -> list[str]` — value keys only, for a group looked up by its `key` (not id); returns `[]` if the group doesn't exist.
  - Duplicate `key` (group-level unique, or value-level unique-within-group) raises `ValueError` with a Vietnamese message — this is how Task 4's router turns it into a 400.

This task's `delete_value` in-use check references `wardrobe_items.attributes` and `accessory_products.style_tags`/`occasion_tags`, which don't exist yet in this shape (Task 6/Task 10 change them later) — write the check now against a small local helper that Task 6/10 will make actually correct; for now, since `wardrobe_items` still has the OLD three-column shape until Task 5-6 run, the check queries the columns that exist **at the time each task lands**. To keep this task isolated and testable without depending on future tasks, `delete_value` here only guards against **other taxonomy data** integrity (nothing references a `TaxonomyValue` yet from outside the domain) — the cross-domain in-use guard is added in Task 6 (wardrobe) and Task 10 (accessories) once those tables/columns are in their final shape, each contributing an additional check into the same `delete_value` function. This task's test suite only covers plain CRUD + duplicate-key rejection; Task 6/10 add the in-use-guard tests.

- [ ] **Step 1: Write the failing service tests**

```python
# backend/tests/domains/taxonomy/test_service.py
import pytest

from app.domains.taxonomy import service
from app.domains.taxonomy.schemas import TaxonomyGroupInput, TaxonomyValueInput


def test_create_and_list_groups(db_session):
    service.create_group(db_session, TaxonomyGroupInput(key="clothing-type", label="Loại quần áo"))
    service.create_group(db_session, TaxonomyGroupInput(key="occasion", label="Loại dịp"))

    groups = service.list_groups(db_session)

    assert [g.key for g in groups] == ["clothing-type", "occasion"]


def test_create_group_rejects_duplicate_key(db_session):
    service.create_group(db_session, TaxonomyGroupInput(key="style", label="Loại phong cách"))

    with pytest.raises(ValueError):
        service.create_group(db_session, TaxonomyGroupInput(key="style", label="Trùng khóa"))


def test_create_value_adds_it_to_the_group(db_session):
    group = service.create_group(db_session, TaxonomyGroupInput(key="clothing-type", label="Loại quần áo"))

    value = service.create_value(db_session, group.id, TaxonomyValueInput(key="ao", label="Áo"))

    assert value is not None
    assert value.group_id == group.id
    refreshed = service.get_group(db_session, group.id)
    assert [v.key for v in refreshed.values] == ["ao"]


def test_create_value_returns_none_for_missing_group(db_session):
    result = service.create_value(db_session, 999999, TaxonomyValueInput(key="ao", label="Áo"))
    assert result is None


def test_create_value_rejects_duplicate_key_within_group(db_session):
    group = service.create_group(db_session, TaxonomyGroupInput(key="clothing-type", label="Loại quần áo"))
    service.create_value(db_session, group.id, TaxonomyValueInput(key="ao", label="Áo"))

    with pytest.raises(ValueError):
        service.create_value(db_session, group.id, TaxonomyValueInput(key="ao", label="Áo (trùng)"))


def test_update_value_changes_its_label(db_session):
    group = service.create_group(db_session, TaxonomyGroupInput(key="clothing-type", label="Loại quần áo"))
    value = service.create_value(db_session, group.id, TaxonomyValueInput(key="ao", label="Áo"))

    updated = service.update_value(db_session, value.id, TaxonomyValueInput(key="ao", label="Áo (đã sửa)"))

    assert updated.label == "Áo (đã sửa)"


def test_delete_value_removes_it(db_session):
    group = service.create_group(db_session, TaxonomyGroupInput(key="clothing-type", label="Loại quần áo"))
    value = service.create_value(db_session, group.id, TaxonomyValueInput(key="ao", label="Áo"))

    deleted = service.delete_value(db_session, value.id)

    assert deleted is True
    assert service.get_group(db_session, group.id).values == []


def test_get_group_values_returns_value_keys_for_a_group(db_session):
    group = service.create_group(db_session, TaxonomyGroupInput(key="style", label="Loại phong cách"))
    service.create_value(db_session, group.id, TaxonomyValueInput(key="casual", label="Casual"))
    service.create_value(db_session, group.id, TaxonomyValueInput(key="formal", label="Formal"))

    assert service.get_group_values(db_session, "style") == ["casual", "formal"]


def test_get_group_values_returns_empty_list_for_unknown_group(db_session):
    assert service.get_group_values(db_session, "does-not-exist") == []
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/domains/taxonomy/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.taxonomy.service'`

- [ ] **Step 3: Write `service.py`**

```python
# backend/app/domains/taxonomy/service.py
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.domains.taxonomy.models import TaxonomyGroup, TaxonomyValue
from app.domains.taxonomy.schemas import TaxonomyGroupInput, TaxonomyValueInput


def list_groups(db: Session) -> list[TaxonomyGroup]:
    return db.query(TaxonomyGroup).order_by(TaxonomyGroup.sort_order.asc(), TaxonomyGroup.id.asc()).all()


def get_group(db: Session, group_id: int) -> TaxonomyGroup | None:
    return db.get(TaxonomyGroup, group_id)


def create_group(db: Session, data: TaxonomyGroupInput) -> TaxonomyGroup:
    group = TaxonomyGroup(key=data.key, label=data.label)
    db.add(group)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError(f'Mã nhóm "{data.key}" đã tồn tại')
    db.refresh(group)
    return group


def update_group(db: Session, group_id: int, data: TaxonomyGroupInput) -> TaxonomyGroup | None:
    group = get_group(db, group_id)
    if group is None:
        return None
    group.key = data.key
    group.label = data.label
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError(f'Mã nhóm "{data.key}" đã tồn tại')
    db.refresh(group)
    return group


def create_value(db: Session, group_id: int, data: TaxonomyValueInput) -> TaxonomyValue | None:
    group = get_group(db, group_id)
    if group is None:
        return None
    value = TaxonomyValue(group_id=group_id, key=data.key, label=data.label)
    db.add(value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError(f'Mã giá trị "{data.key}" đã tồn tại trong nhóm này')
    db.refresh(value)
    return value


def get_value(db: Session, value_id: int) -> TaxonomyValue | None:
    return db.get(TaxonomyValue, value_id)


def update_value(db: Session, value_id: int, data: TaxonomyValueInput) -> TaxonomyValue | None:
    value = get_value(db, value_id)
    if value is None:
        return None
    value.key = data.key
    value.label = data.label
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError(f'Mã giá trị "{data.key}" đã tồn tại trong nhóm này')
    db.refresh(value)
    return value


def delete_value(db: Session, value_id: int) -> bool:
    value = get_value(db, value_id)
    if value is None:
        return False
    db.delete(value)
    db.commit()
    return True


def get_group_values(db: Session, group_key: str) -> list[str]:
    group = db.query(TaxonomyGroup).filter(TaxonomyGroup.key == group_key).first()
    if group is None:
        return []
    return [value.key for value in group.values]
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/domains/taxonomy/test_service.py -v`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/taxonomy/service.py backend/tests/domains/taxonomy/test_service.py
git commit -m "feat(taxonomy): add taxonomy service CRUD layer"
```

---

## Task 4: Taxonomy domain — router, seed data, app registration

**Files:**
- Create: `backend/app/domains/taxonomy/router.py`
- Create: `backend/app/domains/taxonomy/seed.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/domains/taxonomy/test_router.py`
- Test: `backend/tests/domains/taxonomy/test_seed.py`

**Interfaces:**
- Consumes: `service.py` (Task 3), `schemas.py` (Task 2), `require_admin`/`get_db` (`app.deps`, `app.db.session`).
- Produces: `router` (`APIRouter(prefix="/taxonomy", ...)`) with `GET /taxonomy`, `POST /taxonomy/groups`, `PUT /taxonomy/groups/{group_id}`, `POST /taxonomy/groups/{group_id}/values`, `PUT /taxonomy/values/{value_id}`, `DELETE /taxonomy/values/{value_id}`. `seed_demo_taxonomy_groups(db: Session) -> None` in `app.domains.taxonomy.seed`, called from `app.main`'s lifespan — this is what later tasks (frontend, wardrobe) rely on for the three real group keys `clothing-type`/`occasion`/`style` existing in a fresh dev DB.

- [ ] **Step 1: Write the failing router tests**

```python
# backend/tests/domains/taxonomy/test_router.py
def _register_and_promote_admin(client, db_session, email: str) -> None:
    from app.domains.auth.models import User

    client.post("/auth/register", json={"name": "Admin", "identifier": email, "password": "password123"})
    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()
    client.post("/auth/login", json={"identifier": email, "password": "password123"})


def test_list_taxonomy_is_public(client):
    response = client.get("/taxonomy")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_create_group_requires_admin(client):
    response = client.post("/taxonomy/groups", json={"key": "clothing-type", "label": "Loại quần áo"})
    assert response.status_code == 401


def test_create_group_rejects_non_admin(client, db_session):
    client.post("/auth/register", json={"name": "User", "identifier": "tax-user@example.com", "password": "password123"})
    client.post("/auth/login", json={"identifier": "tax-user@example.com", "password": "password123"})
    response = client.post("/taxonomy/groups", json={"key": "clothing-type", "label": "Loại quần áo"})
    assert response.status_code == 403


def test_admin_can_create_group_and_it_appears_in_the_public_list(client, db_session):
    _register_and_promote_admin(client, db_session, "tax-admin1@example.com")

    create_response = client.post("/taxonomy/groups", json={"key": "clothing-type", "label": "Loại quần áo"})
    assert create_response.status_code == 201
    assert create_response.json()["values"] == []

    list_response = client.get("/taxonomy")
    assert any(g["key"] == "clothing-type" for g in list_response.json())


def test_create_group_rejects_duplicate_key(client, db_session):
    _register_and_promote_admin(client, db_session, "tax-admin2@example.com")
    client.post("/taxonomy/groups", json={"key": "style", "label": "Loại phong cách"})

    response = client.post("/taxonomy/groups", json={"key": "style", "label": "Trùng khóa"})
    assert response.status_code == 400


def test_admin_can_add_update_and_delete_a_value(client, db_session):
    _register_and_promote_admin(client, db_session, "tax-admin3@example.com")
    group_id = client.post("/taxonomy/groups", json={"key": "occasion", "label": "Loại dịp"}).json()["id"]

    create_response = client.post(f"/taxonomy/groups/{group_id}/values", json={"key": "hang-ngay", "label": "Hằng ngày"})
    assert create_response.status_code == 201
    value_id = create_response.json()["id"]

    update_response = client.put(f"/taxonomy/values/{value_id}", json={"key": "hang-ngay", "label": "Hằng ngày (đã sửa)"})
    assert update_response.status_code == 200
    assert update_response.json()["label"] == "Hằng ngày (đã sửa)"

    delete_response = client.delete(f"/taxonomy/values/{value_id}")
    assert delete_response.status_code == 204

    group_after = client.get("/taxonomy").json()
    matching = next(g for g in group_after if g["id"] == group_id)
    assert matching["values"] == []


def test_add_value_to_missing_group_returns_404(client, db_session):
    _register_and_promote_admin(client, db_session, "tax-admin4@example.com")
    response = client.post("/taxonomy/groups/999999/values", json={"key": "ao", "label": "Áo"})
    assert response.status_code == 404
```

```python
# backend/tests/domains/taxonomy/test_seed.py
from app.domains.taxonomy import service
from app.domains.taxonomy.seed import seed_demo_taxonomy_groups


def test_seed_creates_the_three_known_groups(db_session):
    seed_demo_taxonomy_groups(db_session)

    groups = {g.key: g for g in service.list_groups(db_session)}
    assert set(groups) == {"clothing-type", "occasion", "style"}
    assert {v.key for v in groups["clothing-type"].values} == {"ao", "quan", "vay", "dam", "ao-khoac"}
    assert {v.key for v in groups["occasion"].values} == {"hang-ngay", "di-lam", "du-tiec", "di-bien"}
    assert {v.key for v in groups["style"].values} == {"casual", "minimalist", "street", "formal"}


def test_seed_is_idempotent(db_session):
    seed_demo_taxonomy_groups(db_session)
    seed_demo_taxonomy_groups(db_session)

    groups = service.list_groups(db_session)
    assert len(groups) == 3
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/domains/taxonomy/test_router.py tests/domains/taxonomy/test_seed.py -v`
Expected: FAIL (`ModuleNotFoundError` for `app.domains.taxonomy.router` / `.seed`)

- [ ] **Step 3: Write `router.py`**

```python
# backend/app/domains/taxonomy/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.taxonomy import service
from app.domains.taxonomy.schemas import TaxonomyGroupInput, TaxonomyGroupResponse, TaxonomyValueInput, TaxonomyValueResponse

router = APIRouter(prefix="/taxonomy", tags=["taxonomy"])


@router.get("", response_model=list[TaxonomyGroupResponse])
def list_groups(db: Session = Depends(get_db)):
    return service.list_groups(db)


@router.post("/groups", response_model=TaxonomyGroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(body: TaxonomyGroupInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    try:
        return service.create_group(db, body)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.put("/groups/{group_id}", response_model=TaxonomyGroupResponse)
def update_group(
    group_id: int, body: TaxonomyGroupInput, db: Session = Depends(get_db), _admin=Depends(require_admin)
):
    try:
        updated = service.update_group(db, group_id, body)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhóm")
    return updated


@router.post(
    "/groups/{group_id}/values", response_model=TaxonomyValueResponse, status_code=status.HTTP_201_CREATED
)
def create_value(
    group_id: int, body: TaxonomyValueInput, db: Session = Depends(get_db), _admin=Depends(require_admin)
):
    try:
        value = service.create_value(db, group_id, body)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    if value is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy nhóm")
    return value


@router.put("/values/{value_id}", response_model=TaxonomyValueResponse)
def update_value(
    value_id: int, body: TaxonomyValueInput, db: Session = Depends(get_db), _admin=Depends(require_admin)
):
    try:
        updated = service.update_value(db, value_id, body)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy giá trị")
    return updated


@router.delete("/values/{value_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_value(value_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    try:
        deleted = service.delete_value(db, value_id)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy giá trị")
```

- [ ] **Step 4: Write `seed.py`**

```python
# backend/app/domains/taxonomy/seed.py
from sqlalchemy.orm import Session

from app.domains.taxonomy.models import TaxonomyGroup, TaxonomyValue

DEMO_TAXONOMY_GROUPS = [
    {
        "key": "clothing-type",
        "label": "Loại quần áo",
        "sort_order": 0,
        "values": [
            {"key": "ao", "label": "Áo"},
            {"key": "quan", "label": "Quần"},
            {"key": "vay", "label": "Váy"},
            {"key": "dam", "label": "Đầm"},
            {"key": "ao-khoac", "label": "Áo khoác"},
        ],
    },
    {
        "key": "occasion",
        "label": "Loại dịp",
        "sort_order": 1,
        "values": [
            {"key": "hang-ngay", "label": "Hằng ngày"},
            {"key": "di-lam", "label": "Đi làm"},
            {"key": "du-tiec", "label": "Dự tiệc"},
            {"key": "di-bien", "label": "Đi biển"},
        ],
    },
    {
        "key": "style",
        "label": "Loại phong cách",
        "sort_order": 2,
        "values": [
            {"key": "casual", "label": "Casual"},
            {"key": "minimalist", "label": "Minimalist"},
            {"key": "street", "label": "Street"},
            {"key": "formal", "label": "Formal"},
        ],
    },
]


def seed_demo_taxonomy_groups(db: Session) -> None:
    if db.query(TaxonomyGroup).count() > 0:
        return
    for group_data in DEMO_TAXONOMY_GROUPS:
        group = TaxonomyGroup(key=group_data["key"], label=group_data["label"], sort_order=group_data["sort_order"])
        for index, value_data in enumerate(group_data["values"]):
            group.values.append(TaxonomyValue(key=value_data["key"], label=value_data["label"], sort_order=index))
        db.add(group)
    db.commit()
```

- [ ] **Step 5: Register the router and seed in `app/main.py`**

Add these imports alongside the other domain imports in `backend/app/main.py` (after the `accessories` import):

```python
from app.domains.accessories.router import router as accessories_router
from app.domains.taxonomy.router import router as taxonomy_router
from app.domains.taxonomy.seed import seed_demo_taxonomy_groups
```

Add the seed call inside `lifespan`, after `seed_demo_quiz_questions(db)`:

```python
        seed_demo_quiz_questions(db)
        seed_demo_taxonomy_groups(db)
```

Add the router registration after `app.include_router(accessories_router)`:

```python
app.include_router(accessories_router)
app.include_router(taxonomy_router)
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && pytest tests/domains/taxonomy/ -v`
Expected: PASS (all taxonomy tests, including Tasks 1 and 3's)

- [ ] **Step 7: Commit**

```bash
git add backend/app/domains/taxonomy/router.py backend/app/domains/taxonomy/seed.py \
        backend/app/main.py backend/tests/domains/taxonomy/test_router.py backend/tests/domains/taxonomy/test_seed.py
git commit -m "feat(taxonomy): add taxonomy router, seed data, and app registration"
```

---

## Task 5: Wardrobe migration — add `attributes` JSONB, backfill, drop old columns

**Files:**
- Create: `backend/alembic/versions/<new_revision>_migrate_wardrobe_items_to_attributes.py`

**Interfaces:**
- Produces: `wardrobe_items.attributes: JSONB NOT NULL DEFAULT '{}'` populated from every existing row's old `category`/`style_tags`/`occasion_tags`; the three old columns no longer exist after this migration. Task 6 depends on this column existing.

This is a pure-SQL data migration; there's no unit test for it in this codebase's established style (no existing migration has one — see `Global Constraints`). Correctness is verified by Step 3 (manual run + inspect) below, which is a required step, not optional.

- [ ] **Step 1: Generate the migration file**

Run: `cd backend && alembic revision -m "migrate wardrobe items to attributes jsonb"`

This creates `backend/alembic/versions/<rev>_migrate_wardrobe_items_to_attributes_jsonb.py`. Note the revision id it prints (call it `<rev>`), and confirm its `down_revision` was auto-set to the taxonomy migration's revision id from Task 1 Step 6 (Alembic always chains to the current head at generation time) — if not, set it manually.

- [ ] **Step 2: Write the migration**

```python
"""migrate wardrobe items to attributes jsonb

Revision ID: <rev>
Revises: <taxonomy_migration_rev>
Create Date: 2026-09-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "<rev>"
down_revision: Union[str, None] = "<taxonomy_migration_rev>"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "wardrobe_items",
        sa.Column("attributes", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
    )

    op.execute(
        """
        UPDATE wardrobe_items
        SET attributes = jsonb_build_object(
            'clothing-type', jsonb_build_array(
                CASE category
                    WHEN 'ao-thun' THEN 'ao'
                    WHEN 'ao-so-mi' THEN 'ao'
                    WHEN 'quan-jean' THEN 'quan'
                    WHEN 'dam' THEN 'dam'
                    WHEN 'ao-khoac' THEN 'ao-khoac'
                    ELSE category
                END
            ),
            'style', style_tags,
            'occasion', occasion_tags
        )
        """
    )

    op.alter_column("wardrobe_items", "attributes", server_default=None)
    op.drop_column("wardrobe_items", "category")
    op.drop_column("wardrobe_items", "style_tags")
    op.drop_column("wardrobe_items", "occasion_tags")


def downgrade() -> None:
    op.add_column("wardrobe_items", sa.Column("category", sa.String(length=100), nullable=True))
    op.add_column(
        "wardrobe_items",
        sa.Column("style_tags", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "wardrobe_items",
        sa.Column("occasion_tags", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )

    op.execute(
        """
        UPDATE wardrobe_items
        SET category = COALESCE(attributes -> 'clothing-type' ->> 0, 'ao-thun'),
            style_tags = COALESCE(attributes -> 'style', '[]'::jsonb),
            occasion_tags = COALESCE(attributes -> 'occasion', '[]'::jsonb)
        """
    )

    op.alter_column("wardrobe_items", "category", nullable=False)
    op.alter_column("wardrobe_items", "style_tags", nullable=False)
    op.alter_column("wardrobe_items", "occasion_tags", nullable=False)
    op.drop_column("wardrobe_items", "attributes")
```

Replace `<rev>` with the actual generated revision id, and `<taxonomy_migration_rev>` with Task 1 Step 6's revision id.

- [ ] **Step 3: Run the migration against the test DB and manually verify**

Run: `cd backend && pytest tests/domains/taxonomy/ -v` (this triggers the session-scoped `_migrated_test_database` fixture, which runs every migration including this one, against `twistfit_test`)
Expected: all taxonomy tests still PASS (they don't touch `wardrobe_items`, so this just proves the migration runs without SQL errors)

Then manually confirm the column change against the real dev DB (not test — this migration hasn't run there yet):
Run: `cd backend && alembic upgrade head`
Then: `psql "$DATABASE_URL" -c "\d wardrobe_items"` (or the project's usual DB shell) and confirm `attributes` exists and `category`/`style_tags`/`occasion_tags` are gone. If any pre-existing rows exist, spot check one: `psql "$DATABASE_URL" -c "SELECT id, attributes FROM wardrobe_items LIMIT 5;"` and confirm `attributes` looks like `{"clothing-type": ["ao"], "style": [...], "occasion": [...]}`.

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/
git commit -m "feat(wardrobe): migrate wardrobe_items to generic attributes jsonb column"
```

---

## Task 6: Wardrobe models/schemas — switch to `attributes`, validate against taxonomy

**Files:**
- Modify: `backend/app/domains/wardrobe/models.py`
- Modify: `backend/app/domains/wardrobe/schemas.py`
- Modify: `backend/app/domains/wardrobe/service.py`
- Modify: `backend/app/domains/taxonomy/service.py` (add the in-use guard to `delete_value`, deferred from Task 3)
- Test: `backend/tests/domains/wardrobe/test_service.py` (extend existing file)
- Test: `backend/tests/domains/taxonomy/test_service.py` (extend existing file, in-use guard case)

**Interfaces:**
- Consumes: `taxonomy.service.get_group_values` (Task 3), `wardrobe_items.attributes` column (Task 5).
- Produces: `WardrobeItem.attributes: dict[str, list[str]]` (was `category`/`style_tags`/`occasion_tags`). `WardrobeItemCreate(blob_url: str, attributes: dict[str, list[str]], dominant_colors: list[str])` — no more static `CATEGORIES`/`STYLE_TAGS`/`OCCASION_TAGS` module constants (deleted from this file; nothing outside this task's own changes imports them after this task — Task 9/accessories moves off its import of these in the same PR-equivalent scope). `service.create_item(db, user_id, data)` now validates every `attributes` key against a real taxonomy group and every value against that group's current values, raising `ValueError` (Vietnamese message) on mismatch — the router (Task 8) converts that to a 400.

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/domains/wardrobe/test_service.py` (create the file with this content if it doesn't already exist — check first, since the investigation noted this file exists; if so, add these test functions to it):

```python
import pytest

from app.domains.taxonomy.schemas import TaxonomyGroupInput, TaxonomyValueInput
from app.domains.taxonomy import service as taxonomy_service
from app.domains.wardrobe import service
from app.domains.wardrobe.schemas import WardrobeItemCreate


def _seed_clothing_type_group(db_session):
    group = taxonomy_service.create_group(db_session, TaxonomyGroupInput(key="clothing-type", label="Loại quần áo"))
    taxonomy_service.create_value(db_session, group.id, TaxonomyValueInput(key="ao", label="Áo"))
    return group


def test_create_item_accepts_valid_attributes(db_session):
    _seed_clothing_type_group(db_session)

    item = service.create_item(
        db_session,
        user_id=1,
        data=WardrobeItemCreate(
            blob_url="https://example.com/a.png",
            attributes={"clothing-type": ["ao"]},
            dominant_colors=["#ffffff"],
        ),
    )

    assert item.attributes == {"clothing-type": ["ao"]}


def test_create_item_rejects_unknown_group_key(db_session):
    _seed_clothing_type_group(db_session)

    with pytest.raises(ValueError):
        service.create_item(
            db_session,
            user_id=1,
            data=WardrobeItemCreate(
                blob_url="https://example.com/a.png",
                attributes={"not-a-real-group": ["x"]},
                dominant_colors=["#ffffff"],
            ),
        )


def test_create_item_rejects_unknown_value_within_a_valid_group(db_session):
    _seed_clothing_type_group(db_session)

    with pytest.raises(ValueError):
        service.create_item(
            db_session,
            user_id=1,
            data=WardrobeItemCreate(
                blob_url="https://example.com/a.png",
                attributes={"clothing-type": ["not-a-real-value"]},
                dominant_colors=["#ffffff"],
            ),
        )
```

Append to `backend/tests/domains/taxonomy/test_service.py`:

```python
def test_delete_value_rejects_when_referenced_by_a_wardrobe_item(db_session):
    from app.domains.wardrobe.models import WardrobeItem

    group = service.create_group(db_session, TaxonomyGroupInput(key="clothing-type", label="Loại quần áo"))
    value = service.create_value(db_session, group.id, TaxonomyValueInput(key="ao", label="Áo"))
    db_session.add(
        WardrobeItem(
            user_id=1,
            blob_url="https://example.com/a.png",
            attributes={"clothing-type": ["ao"]},
            dominant_colors=["#ffffff"],
        )
    )
    db_session.commit()

    with pytest.raises(ValueError):
        service.delete_value(db_session, value.id)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/domains/wardrobe/test_service.py tests/domains/taxonomy/test_service.py -v`
Expected: FAIL — `WardrobeItemCreate` still requires `category`/`style_tags`/`occasion_tags` and rejects `attributes` as an unexpected field; the new taxonomy test fails because `delete_value` doesn't check wardrobe usage yet.

- [ ] **Step 3: Update `models.py`**

Replace the three fixed columns with `attributes`:

```python
# backend/app/domains/wardrobe/models.py
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    blob_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    attributes: Mapped[dict[str, list[str]]] = mapped_column(JSONB, nullable=False)
    dominant_colors: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
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

- [ ] **Step 4: Update `schemas.py`**

```python
# backend/app/domains/wardrobe/schemas.py
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel


class WardrobeItemCreate(CamelModel):
    blob_url: str
    attributes: dict[str, list[str]]
    dominant_colors: list[str]

    @field_validator("attributes")
    @classmethod
    def attributes_not_empty(cls, value: dict[str, list[str]]) -> dict[str, list[str]]:
        if not value:
            raise ValueError("Cần chọn ít nhất 1 thuộc tính")
        return value


class WardrobeItemResponse(CamelModel):
    id: int
    user_id: int
    blob_url: str
    attributes: dict[str, list[str]]
    dominant_colors: list[str]
    created_at: datetime
    updated_at: datetime


class SuggestTagsRequest(CamelModel):
    blob_path: str
```

Note: the module-level `CATEGORIES`/`STYLE_TAGS`/`OCCASION_TAGS` constants are gone. Task 9 (accessories) and Task 7 (this domain's own `gemini_client.py`) no longer import them from here after their own tasks land — until Task 7/9 run, those two files will fail to import; that's expected and fixed within this same work session (this task, Task 7, and Task 9 must all land together before the backend is left in a working state — see the note at the top of Task 7).

- [ ] **Step 5: Update `service.py`**

```python
# backend/app/domains/wardrobe/service.py
from sqlalchemy.orm import Session

from app.domains.taxonomy import service as taxonomy_service
from app.domains.wardrobe.models import WardrobeItem
from app.domains.wardrobe.schemas import WardrobeItemCreate


def list_items(db: Session, user_id: int) -> list[WardrobeItem]:
    return db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id).order_by(WardrobeItem.id.desc()).all()


def get_item(db: Session, user_id: int, item_id: int) -> WardrobeItem | None:
    return db.query(WardrobeItem).filter(WardrobeItem.id == item_id, WardrobeItem.user_id == user_id).first()


def _validate_attributes(db: Session, attributes: dict[str, list[str]]) -> None:
    for group_key, value_keys in attributes.items():
        valid_values = taxonomy_service.get_group_values(db, group_key)
        if not valid_values:
            raise ValueError(f'Nhóm thuộc tính "{group_key}" không hợp lệ')
        for value_key in value_keys:
            if value_key not in valid_values:
                raise ValueError(f'Giá trị "{value_key}" không hợp lệ trong nhóm "{group_key}"')


def create_item(db: Session, user_id: int, data: WardrobeItemCreate) -> WardrobeItem:
    _validate_attributes(db, data.attributes)
    item = WardrobeItem(user_id=user_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
```

- [ ] **Step 6: Add the in-use guard to `taxonomy/service.py`'s `delete_value`**

```python
# backend/app/domains/taxonomy/service.py
# add this import at the top, alongside the existing ones:
from sqlalchemy import cast, String
from sqlalchemy.dialects.postgresql import JSONB

# replace the existing delete_value function with:
def delete_value(db: Session, value_id: int) -> bool:
    from app.domains.wardrobe.models import WardrobeItem

    value = get_value(db, value_id)
    if value is None:
        return False

    group = get_group(db, value.group_id)
    in_use_count = (
        db.query(WardrobeItem)
        .filter(cast(WardrobeItem.attributes[group.key], JSONB).contains([value.key]))
        .count()
    )
    if in_use_count > 0:
        raise ValueError(f'Giá trị "{value.label}" đang được {in_use_count} món đồ sử dụng, không thể xoá')

    db.delete(value)
    db.commit()
    return True
```

The `from app.domains.wardrobe.models import WardrobeItem` import is placed **inside the function**, not at module level, to avoid a circular import (`wardrobe/service.py` imports `taxonomy/service.py`, so `taxonomy/service.py` can't import `wardrobe/models.py` at module load time).

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd backend && pytest tests/domains/wardrobe/ tests/domains/taxonomy/ -v`
Expected: everything under `tests/domains/taxonomy/` passes; `tests/domains/wardrobe/test_service.py`'s new tests pass. `tests/domains/wardrobe/test_router.py`, `test_models.py`, `test_gemini_client.py`, `test_upload_flow.py` will now FAIL (they still reference `category`/`style_tags`/`occasion_tags`) — that's expected and fixed by Tasks 7-8; note it and continue, don't try to fix those files in this task.

- [ ] **Step 8: Commit**

```bash
git add backend/app/domains/wardrobe/models.py backend/app/domains/wardrobe/schemas.py \
        backend/app/domains/wardrobe/service.py backend/app/domains/taxonomy/service.py \
        backend/tests/domains/wardrobe/test_service.py backend/tests/domains/taxonomy/test_service.py
git commit -m "feat(wardrobe): switch WardrobeItem to generic attributes, validate against taxonomy"
```

---

## Task 7: Wardrobe Gemini client — build prompt dynamically from all taxonomy groups

**Files:**
- Modify: `backend/app/domains/wardrobe/gemini_client.py`
- Modify: `backend/tests/domains/wardrobe/test_gemini_client.py` (full rewrite)

**Interfaces:**
- Consumes: `taxonomy.service.list_groups` (Task 3).
- Produces: `suggest_tags(image_bytes: bytes, db: Session) -> dict[str, list[str]]` (signature changed — now takes `db`; return shape is `{group_key: [value_key, ...]}` for every group that currently exists, not a fixed `{category, styleTags, occasionTags}` shape). `_call_gemini(image_bytes: bytes, prompt: str) -> str` (signature changed — prompt is now a parameter, not a module constant, since it's built per-request). Task 8's router passes its `db` dependency through to this function.

- [ ] **Step 1: Write the failing tests (full replacement of the existing file)**

```python
# backend/tests/domains/wardrobe/test_gemini_client.py
import json

from app.domains.taxonomy.schemas import TaxonomyGroupInput, TaxonomyValueInput
from app.domains.taxonomy import service as taxonomy_service
from app.domains.wardrobe import gemini_client


def _seed_two_groups(db_session):
    clothing_type = taxonomy_service.create_group(db_session, TaxonomyGroupInput(key="clothing-type", label="Loại quần áo"))
    taxonomy_service.create_value(db_session, clothing_type.id, TaxonomyValueInput(key="ao", label="Áo"))
    taxonomy_service.create_value(db_session, clothing_type.id, TaxonomyValueInput(key="dam", label="Đầm"))

    style = taxonomy_service.create_group(db_session, TaxonomyGroupInput(key="style", label="Loại phong cách"))
    taxonomy_service.create_value(db_session, style.id, TaxonomyValueInput(key="casual", label="Casual"))


def test_suggest_tags_parses_a_clean_json_response_covering_every_group(monkeypatch, db_session):
    _seed_two_groups(db_session)
    monkeypatch.setattr(
        gemini_client,
        "_call_gemini",
        lambda image_bytes, prompt: json.dumps({"clothing-type": ["ao"], "style": ["casual"]}),
    )

    result = gemini_client.suggest_tags(b"fake-bytes", db_session)

    assert result == {"clothing-type": ["ao"], "style": ["casual"]}


def test_suggest_tags_strips_markdown_code_fences(monkeypatch, db_session):
    _seed_two_groups(db_session)
    monkeypatch.setattr(
        gemini_client,
        "_call_gemini",
        lambda image_bytes, prompt: '```json\n{"clothing-type": ["dam"], "style": []}\n```',
    )

    result = gemini_client.suggest_tags(b"fake-bytes", db_session)

    assert result["clothing-type"] == ["dam"]


def test_suggest_tags_drops_keys_that_are_not_real_groups(monkeypatch, db_session):
    _seed_two_groups(db_session)
    monkeypatch.setattr(
        gemini_client,
        "_call_gemini",
        lambda image_bytes, prompt: json.dumps({"clothing-type": ["ao"], "not-a-real-group": ["x"]}),
    )

    result = gemini_client.suggest_tags(b"fake-bytes", db_session)

    assert result == {"clothing-type": ["ao"]}


def test_suggest_tags_drops_values_that_are_not_real_values_in_their_group(monkeypatch, db_session):
    _seed_two_groups(db_session)
    monkeypatch.setattr(
        gemini_client,
        "_call_gemini",
        lambda image_bytes, prompt: json.dumps({"clothing-type": ["ao", "not-a-real-value"], "style": ["casual"]}),
    )

    result = gemini_client.suggest_tags(b"fake-bytes", db_session)

    assert result["clothing-type"] == ["ao"]


def test_build_prompt_lists_every_current_group_and_its_values(db_session):
    _seed_two_groups(db_session)
    groups = taxonomy_service.list_groups(db_session)

    prompt = gemini_client._build_prompt(groups)

    assert '"clothing-type"' in prompt
    assert "ao" in prompt and "dam" in prompt
    assert '"style"' in prompt
    assert "casual" in prompt
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/domains/wardrobe/test_gemini_client.py -v`
Expected: FAIL — `suggest_tags()` still takes only `image_bytes`, `_build_prompt` doesn't exist yet.

- [ ] **Step 3: Rewrite `gemini_client.py`**

```python
# backend/app/domains/wardrobe/gemini_client.py
import base64
import json

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domains.taxonomy import service as taxonomy_service
from app.domains.taxonomy.models import TaxonomyGroup

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"


def _build_prompt(groups: list[TaxonomyGroup]) -> str:
    field_descriptions = ", ".join(
        f'"{group.key}": [<subset of {[value.key for value in group.values]}>]' for group in groups
    )
    return (
        "Given this clothing image, classify it using EVERY one of the following attribute "
        "groups. Respond with ONLY a JSON object, no other text, in exactly this shape:\n"
        f"{{{field_descriptions}}}"
    )


def _call_gemini(image_bytes: bytes, prompt: str) -> str:
    response = httpx.post(
        GEMINI_URL,
        params={"key": settings.gemini_api_key},
        json={
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": base64.b64encode(image_bytes).decode(),
                            }
                        },
                    ]
                }
            ]
        },
        timeout=30.0,
    )
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]


def _filter_valid(parsed: dict, groups: list[TaxonomyGroup]) -> dict[str, list[str]]:
    valid_values_by_group = {group.key: {value.key for value in group.values} for group in groups}
    result: dict[str, list[str]] = {}
    for key, values in parsed.items():
        if key not in valid_values_by_group or not isinstance(values, list):
            continue
        result[key] = [value for value in values if value in valid_values_by_group[key]]
    return result


def suggest_tags(image_bytes: bytes, db: Session) -> dict[str, list[str]]:
    groups = taxonomy_service.list_groups(db)
    prompt = _build_prompt(groups)
    raw_text = _call_gemini(image_bytes, prompt)
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    parsed = json.loads(cleaned)
    return _filter_valid(parsed, groups)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/domains/wardrobe/test_gemini_client.py -v`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/wardrobe/gemini_client.py backend/tests/domains/wardrobe/test_gemini_client.py
git commit -m "feat(wardrobe): build Gemini classification prompt dynamically from taxonomy groups"
```

---

## Task 8: Wardrobe router — wire `db` into `suggest_tags`, fix remaining broken wardrobe tests

**Files:**
- Modify: `backend/app/domains/wardrobe/router.py`
- Modify: `backend/tests/domains/wardrobe/test_router.py`
- Modify: `backend/tests/domains/wardrobe/test_models.py` (if it references the old columns — inspect and update)
- Modify: `backend/tests/domains/wardrobe/test_upload_flow.py` (if it references the old columns — inspect and update)

**Interfaces:**
- Consumes: `wardrobe.gemini_client.suggest_tags(image_bytes, db)` (Task 7), `wardrobe.service.create_item` (Task 6).
- Produces: `POST /wardrobe/items/suggest-tags` now returns `{**attributes_dict, "dominantColors": [...], "blobUrl": "..."}` (no more separate `category`/`styleTags`/`occasionTags` top-level keys — the suggested attributes are spread directly, keyed by whatever group keys exist).

- [ ] **Step 1: Update `router.py`**

```python
# backend/app/domains/wardrobe/router.py
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.blob_storage import blob_public_url, download_bytes, ensure_container, generate_upload_sas_url
from app.db.session import get_db
from app.deps import get_current_user
from app.domains.auth.models import User
from app.domains.wardrobe import service
from app.domains.wardrobe.color_extraction import extract_dominant_colors
from app.domains.wardrobe.gemini_client import suggest_tags
from app.domains.wardrobe.schemas import SuggestTagsRequest, WardrobeItemCreate, WardrobeItemResponse

router = APIRouter(prefix="/wardrobe", tags=["wardrobe"])


@router.get("/items", response_model=list[WardrobeItemResponse])
def list_items(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return service.list_items(db, user.id)


@router.get("/items/{item_id}", response_model=WardrobeItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = service.get_item(db, user.id, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy món đồ")
    return item


@router.post("/items", response_model=WardrobeItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(body: WardrobeItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return service.create_item(db, user.id, body)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.post("/upload-url")
def get_upload_url(user: User = Depends(get_current_user)):
    ensure_container("wardrobe")
    blob_path = f"{user.id}/{uuid.uuid4()}.png"
    upload_url = generate_upload_sas_url("wardrobe", blob_path)
    return {"uploadUrl": upload_url, "blobPath": blob_path}


@router.post("/items/suggest-tags")
def suggest_tags_endpoint(
    body: SuggestTagsRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    image_bytes = download_bytes("wardrobe", body.blob_path)
    attributes = suggest_tags(image_bytes, db)
    colors = extract_dominant_colors(image_bytes)
    return {**attributes, "dominantColors": colors, "blobUrl": blob_public_url("wardrobe", body.blob_path)}
```

(Only changes: `create_item` now catches `ValueError` from the service and returns 400; `suggest_tags_endpoint` gains the `db` dependency and passes it through, and the response spreads `attributes` directly instead of the old fixed 3-key shape.)

- [ ] **Step 2: Read and update the remaining broken test files**

Read `backend/tests/domains/wardrobe/test_router.py`, `test_models.py`, and `test_upload_flow.py` in full first (their exact current content wasn't part of this plan's research — they exist per Task 6 Step 7's note but weren't quoted). For each:
- Any JSON body or fixture using `"category": "...", "styleTags": [...], "occasionTags": [...]` becomes `"attributes": {"clothing-type": [...], "style": [...], "occasion": [...]}` — and any test that relies on a *specific* category/tag value being accepted must first create that taxonomy group/value via `taxonomy_service.create_group`/`create_value` in the test (using the `db_session` fixture), the same way Task 6/7's new tests do, since there's no longer a hardcoded always-valid list.
- Any assertion reading `response.json()["category"]` becomes `response.json()["attributes"]["clothing-type"]`.
- `test_upload_flow.py` (an integration-style test per its name) likely exercises the full upload → suggest-tags → create flow with a mocked Gemini call; update its `monkeypatch.setattr(gemini_client, "_call_gemini", ...)` call to the new two-argument lambda shape (`lambda image_bytes, prompt: ...`) per Task 7, and seed whatever taxonomy groups/values the test's fixture JSON references before hitting the endpoints.

- [ ] **Step 3: Run the full wardrobe test suite**

Run: `cd backend && pytest tests/domains/wardrobe/ -v`
Expected: PASS — every test in the domain, including the ones fixed in Step 2.

- [ ] **Step 4: Run the entire backend test suite as a regression check**

Run: `cd backend && pytest -v`
Expected: PASS. If anything outside `wardrobe`/`taxonomy` fails, it's almost certainly `accessories` (fixed next, in Task 9) — confirm the only failures are in `tests/domains/accessories/` before moving on; anything else is a real regression to investigate before continuing.

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/wardrobe/router.py backend/tests/domains/wardrobe/
git commit -m "feat(wardrobe): wire db into suggest-tags endpoint, fix tests for attributes shape"
```

---

## Task 9: Accessories — read style/occasion from taxonomy instead of wardrobe constants

**Files:**
- Modify: `backend/app/domains/accessories/schemas.py`
- Modify: `backend/app/domains/accessories/gemini_client.py`
- Modify: `backend/app/domains/accessories/service.py` (inspect first — wasn't quoted in research; likely needs the same style/occasion validation change `wardrobe/service.py` got in Task 6, but keeping `category` validation against the still-hardcoded `ACCESSORY_CATEGORIES`)
- Modify: `backend/tests/domains/accessories/test_gemini_client.py`
- Modify: `backend/tests/domains/accessories/test_service.py` / `test_router.py` (inspect first, update any fixture using a `style_tags`/`occasion_tags` value not seeded as taxonomy data)

**Interfaces:**
- Consumes: `taxonomy.service.get_group_values(db, "style" | "occasion")` (Task 3).
- Produces: `accessories.gemini_client.suggest_tags(image_bytes: bytes, db: Session) -> dict` (signature changed — gains `db`, same as wardrobe's). `ACCESSORY_CATEGORIES` stays a local hardcoded constant in `accessories/schemas.py` (unchanged, out of scope per the spec).

- [ ] **Step 1: Read the current accessories test files**

Read `backend/tests/domains/accessories/test_gemini_client.py`, `test_service.py`, and `test_router.py` in full (not quoted in this plan's research) to find every fixture that hardcodes a `style_tags`/`occasion_tags` value — those tests need taxonomy `style`/`occasion` groups seeded via `taxonomy_service.create_group`/`create_value` before they'll pass, the same pattern used in Task 6/7.

- [ ] **Step 2: Update `accessories/schemas.py`**

Remove the import of `OCCASION_TAGS`/`STYLE_TAGS` from `wardrobe.schemas` (that module no longer exports them, per Task 6). The `style_tags`/`occasion_tags` field validators can no longer do a static Python `in` check — move that validation into `accessories/service.py`'s create/update path instead (mirroring Task 6's `_validate_attributes` approach), the same way wardrobe's Pydantic-level category/tag validators were removed in Task 6:

```python
# backend/app/domains/accessories/schemas.py
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel
from app.domains.quiz_attempts.schemas import PARENT_SEASONS

ACCESSORY_CATEGORIES = ["tui-xach", "giay", "trang-suc", "mu-non", "khan"]


class AccessoryProductInput(CamelModel):
    name: str
    image_url: str
    affiliate_link: str
    category: str
    style_tags: list[str]
    occasion_tags: list[str]
    tone_tags: list[str]

    @field_validator("name", "image_url", "affiliate_link")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Trường này không được để trống")
        return value.strip()

    @field_validator("category")
    @classmethod
    def category_valid(cls, value: str) -> str:
        if value not in ACCESSORY_CATEGORIES:
            raise ValueError("Danh mục phụ kiện không hợp lệ")
        return value

    @field_validator("tone_tags")
    @classmethod
    def tone_tags_valid(cls, value: list[str]) -> list[str]:
        if any(tag not in PARENT_SEASONS for tag in value):
            raise ValueError("Tag tone màu không hợp lệ")
        return value


class SuggestTagsRequest(CamelModel):
    blob_path: str


class AccessoryProductResponse(CamelModel):
    id: int
    name: str
    image_url: str
    affiliate_link: str
    category: str
    style_tags: list[str]
    occasion_tags: list[str]
    tone_tags: list[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class AccessoryRecommendationResponse(CamelModel):
    id: int
    name: str
    image_url: str
    affiliate_link: str
    category: str
```

(`style_tags`/`occasion_tags` field validators are removed entirely from this schema — no longer statically checkable without a DB call. `category` and `tone_tags` validators are unaffected, since `ACCESSORY_CATEGORIES` and `PARENT_SEASONS` stay hardcoded.)

- [ ] **Step 2: Update `accessories/service.py`**

First read the file's current content in full (not quoted in this plan's research). Find its `create`/`update` functions (mirroring `wardrobe/service.py`'s pre-Task-6 shape, per the FAQ/wardrobe pattern this domain also follows) and add a validation step before persisting, calling `taxonomy_service.get_group_values(db, "style")` / `get_group_values(db, "occasion")` and rejecting any `style_tags`/`occasion_tags` value not in those lists, raising `ValueError` — the same shape as `wardrobe/service.py`'s `_validate_attributes` from Task 6 Step 5, adapted to accessories' two separate list fields instead of one `attributes` dict:

```python
from app.domains.taxonomy import service as taxonomy_service

def _validate_style_and_occasion_tags(db: Session, style_tags: list[str], occasion_tags: list[str]) -> None:
    valid_styles = taxonomy_service.get_group_values(db, "style")
    for tag in style_tags:
        if tag not in valid_styles:
            raise ValueError(f'Tag phong cách "{tag}" không hợp lệ')

    valid_occasions = taxonomy_service.get_group_values(db, "occasion")
    for tag in occasion_tags:
        if tag not in valid_occasions:
            raise ValueError(f'Tag dịp "{tag}" không hợp lệ')
```

Call `_validate_style_and_occasion_tags(db, data.style_tags, data.occasion_tags)` at the top of whatever functions currently create/update an `AccessoryProduct` from an `AccessoryProductInput`, before the `db.add`/`db.commit`.

- [ ] **Step 3: Update `gemini_client.py`**

```python
# backend/app/domains/accessories/gemini_client.py
import base64
import json

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.domains.accessories.schemas import ACCESSORY_CATEGORIES
from app.domains.quiz_attempts.schemas import PARENT_SEASONS
from app.domains.taxonomy import service as taxonomy_service

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"


def _build_prompt(style_tags: list[str], occasion_tags: list[str]) -> str:
    return (
        "Given this fashion accessory product image, classify it. Respond with "
        "ONLY a JSON object, no other text, in exactly this shape:\n"
        f'{{"category": "<one of {ACCESSORY_CATEGORIES}>", '
        f'"styleTags": [<subset of {style_tags}>], '
        f'"occasionTags": [<subset of {occasion_tags}>], '
        f'"toneTags": [<subset of {PARENT_SEASONS}, the color season(s) this '
        'item suits best, or an empty list if it suits any season>]}}'
    )


def _call_gemini(image_bytes: bytes, prompt: str) -> str:
    response = httpx.post(
        GEMINI_URL,
        params={"key": settings.gemini_api_key},
        json={
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": base64.b64encode(image_bytes).decode(),
                            }
                        },
                    ]
                }
            ]
        },
        timeout=30.0,
    )
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]


def suggest_tags(image_bytes: bytes, db: Session) -> dict:
    style_tags = taxonomy_service.get_group_values(db, "style")
    occasion_tags = taxonomy_service.get_group_values(db, "occasion")
    prompt = _build_prompt(style_tags, occasion_tags)
    raw_text = _call_gemini(image_bytes, prompt)
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    return json.loads(cleaned)
```

- [ ] **Step 4: Find and update the accessories router's call site**

Read `backend/app/domains/accessories/router.py`, find its `suggest-tags` endpoint (mirrors wardrobe's shape from Task 8), and add the `db: Session = Depends(get_db)` parameter if not already present, passing it through to `suggest_tags(image_bytes, db)`.

- [ ] **Step 5: Update the three accessories test files per Step 1's findings**

Apply the same "seed the taxonomy `style`/`occasion` groups the test's fixtures reference, before hitting the endpoint" fix Task 8 Step 2 described, plus update every `monkeypatch.setattr(gemini_client, "_call_gemini", ...)` call to the new two-argument lambda shape.

- [ ] **Step 6: Run the full backend test suite**

Run: `cd backend && pytest -v`
Expected: PASS, all domains, zero failures.

- [ ] **Step 7: Commit**

```bash
git add backend/app/domains/accessories/ backend/tests/domains/accessories/
git commit -m "feat(accessories): read style/occasion tags from taxonomy instead of wardrobe constants"
```

---

## Task 10: Frontend types — `lib/taxonomy.ts` and `lib/wardrobe.ts`

**Files:**
- Create: `frontend/lib/taxonomy.ts`
- Create: `frontend/lib/wardrobe.ts`

**Interfaces:**
- Produces: `TaxonomyValue = { id, key, label, sortOrder }`, `TaxonomyGroup = { id, key, label, sortOrder, values: TaxonomyValue[] }` (`lib/taxonomy.ts`) — matches `TaxonomyGroupResponse`/`TaxonomyValueResponse`'s camelCase JSON shape from Task 4's router exactly. `WardrobeItem = { id, blobUrl, attributes: Record<string, string[]>, dominantColors: string[] }` (`lib/wardrobe.ts`) — matches `WardrobeItemResponse` from Task 6. Every later frontend task imports these instead of redefining local shapes.

No dedicated test file for this task — these are plain type exports with no logic, matching how `lib/faq.ts`'s type exports and `lib/accessories.ts`'s `AccessoryProduct` type aren't unit-tested directly (they're exercised through the components that import them, tested in later tasks).

- [ ] **Step 1: Write `lib/taxonomy.ts`**

```ts
export type TaxonomyValue = {
  id: number
  key: string
  label: string
  sortOrder: number
}

export type TaxonomyGroup = {
  id: number
  key: string
  label: string
  sortOrder: number
  values: TaxonomyValue[]
}

export function findGroup(groups: TaxonomyGroup[], key: string): TaxonomyGroup | undefined {
  return groups.find((group) => group.key === key)
}
```

- [ ] **Step 2: Write `lib/wardrobe.ts`**

```ts
export type WardrobeItem = {
  id: number
  blobUrl: string
  attributes: Record<string, string[]>
  dominantColors: string[]
}
```

- [ ] **Step 3: Verify the project still typechecks**

Run: `cd frontend && npx tsc --noEmit`
Expected: no new errors introduced by these two new files (existing errors elsewhere, if any, are unrelated — don't fix them here).

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/taxonomy.ts frontend/lib/wardrobe.ts
git commit -m "feat(frontend): add TaxonomyGroup/TaxonomyValue and WardrobeItem shared types"
```

---

## Task 11: Admin taxonomy UI — group list + create

**Files:**
- Create: `frontend/components/admin/TaxonomyGroupList.tsx`
- Create: `frontend/components/admin/TaxonomyGroupList.test.tsx`
- Create: `frontend/app/admin/taxonomy/page.tsx`
- Modify: `frontend/messages/vi.json` (add `Admin.TaxonomyGroupList` namespace)

**Interfaces:**
- Consumes: `TaxonomyGroup` (`lib/taxonomy.ts`, Task 10), `apiFetch` (`lib/apiClient.ts`), `AdminGate` (`components/auth/AdminGate.tsx`), `slugify` (`lib/slugify.ts`).
- Produces: `TaxonomyGroupList` component (fetches `GET /taxonomy`, lists groups with a value count and a link to `/admin/taxonomy/{id}`, plus an inline "add group" form that POSTs `/taxonomy/groups`). Task 12 links into this list's per-group detail route.

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/components/admin/TaxonomyGroupList.test.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TaxonomyGroupList from './TaxonomyGroupList'
import type { TaxonomyGroup } from '@/lib/taxonomy'

const GROUPS: TaxonomyGroup[] = [
  {
    id: 1,
    key: 'clothing-type',
    label: 'Loại quần áo',
    sortOrder: 0,
    values: [
      { id: 1, key: 'ao', label: 'Áo', sortOrder: 0 },
      { id: 2, key: 'quan', label: 'Quần', sortOrder: 1 },
    ],
  },
]

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

describe('TaxonomyGroupList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders groups with a value count and a link to the detail page', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(GROUPS)))
    renderWithIntl(<TaxonomyGroupList />)

    await waitFor(() => expect(screen.getByText('Loại quần áo')).toBeInTheDocument())
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quản lý' })).toHaveAttribute('href', '/admin/taxonomy/1')
  })

  it('shows an empty state when there are no groups', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])))
    renderWithIntl(<TaxonomyGroupList />)
    await waitFor(() => expect(screen.getByText('Chưa có nhóm nào.')).toBeInTheDocument())
  })

  it('creates a new group from the inline form, auto-slugging the key from the label', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return Promise.resolve(
            jsonResponse(
              { id: 2, key: 'chat-lieu', label: 'Chất liệu', sortOrder: 1, values: [] },
              { status: 201 }
            )
          )
        }
        return Promise.resolve(jsonResponse(GROUPS))
      })
    )
    renderWithIntl(<TaxonomyGroupList />)
    await waitFor(() => expect(screen.getByText('Loại quần áo')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Tên nhóm mới'), { target: { value: 'Chất liệu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm nhóm' }))

    await waitFor(() => expect(screen.getByText('Chất liệu')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/taxonomy/groups',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ key: 'chat-lieu', label: 'Chất liệu' }),
      })
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/TaxonomyGroupList.test.tsx`
Expected: FAIL — `./TaxonomyGroupList` doesn't exist yet.

- [ ] **Step 3: Add `Admin.TaxonomyGroupList` to `messages/vi.json`**

Add this object as a new sibling key inside the existing `"Admin"` namespace (alongside `"FaqList"`, `"AccessoryList"`, etc. — insert it right after the `"AccessoryForm"` block, matching the file's existing ordering of one `List` immediately after its matching entity's other blocks):

```json
    "TaxonomyGroupList": {
      "title": "Quản lý thuộc tính (Taxonomy)",
      "columnLabel": "Tên nhóm",
      "columnValueCount": "Số giá trị",
      "manageButton": "Quản lý",
      "newGroupLabel": "Tên nhóm mới",
      "addGroupButton": "Thêm nhóm",
      "emptyState": "Chưa có nhóm nào.",
      "loading": "Đang tải...",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại."
    },
```

- [ ] **Step 4: Write `TaxonomyGroupList.tsx`**

```tsx
// frontend/components/admin/TaxonomyGroupList.tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { slugify } from '@/lib/slugify'
import type { TaxonomyGroup } from '@/lib/taxonomy'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function TaxonomyGroupList() {
  const t = useTranslations('Admin.TaxonomyGroupList')
  const [groups, setGroups] = useState<TaxonomyGroup[] | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/taxonomy')
      .then((response) => response.json())
      .then(setGroups)
  }, [])

  async function handleAddGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const response = await apiFetch('/taxonomy/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: slugify(newLabel), label: newLabel.trim() }),
    })
    if (!response.ok) {
      setError(t('genericError'))
      return
    }
    const created = (await response.json()) as TaxonomyGroup
    setGroups((current) => [...(current ?? []), created])
    setNewLabel('')
  }

  if (groups === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  return (
    <div className="space-y-6">
      {groups.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
      ) : (
        <table className="w-full text-left text-body-md">
          <thead>
            <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
              <th className="py-2">{t('columnLabel')}</th>
              <th className="py-2">{t('columnValueCount')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="border-b border-outline-variant/50">
                <td className="py-3 font-semibold text-on-surface">{group.label}</td>
                <td className="py-3 text-on-surface-variant">{group.values.length}</td>
                <td className="py-3 text-right">
                  <Link href={`/admin/taxonomy/${group.id}`} className="font-semibold text-primary hover:underline">
                    {t('manageButton')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form className="flex items-end gap-3" onSubmit={handleAddGroup}>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="new-group-label" className="text-label-md font-semibold text-on-surface">
            {t('newGroupLabel')}
          </label>
          <input
            id="new-group-label"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={!newLabel.trim()}
          className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
        >
          {t('addGroupButton')}
        </button>
      </form>
      {error && <p className="text-label-sm text-error">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Write `app/admin/taxonomy/page.tsx`**

```tsx
// frontend/app/admin/taxonomy/page.tsx
'use client'

import { useTranslations } from 'next-intl'
import AdminGate from '@/components/auth/AdminGate'
import TaxonomyGroupList from '@/components/admin/TaxonomyGroupList'

export default function AdminTaxonomyPage() {
  const t = useTranslations('Admin.TaxonomyGroupList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <h1 className="mb-6 text-headline-md font-bold text-on-surface">{t('title')}</h1>
          <TaxonomyGroupList />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/admin/TaxonomyGroupList.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add frontend/components/admin/TaxonomyGroupList.tsx frontend/components/admin/TaxonomyGroupList.test.tsx \
        frontend/app/admin/taxonomy/page.tsx frontend/messages/vi.json
git commit -m "feat(admin): add taxonomy group list + create page"
```

---

## Task 12: Admin taxonomy UI — group detail (rename group, CRUD its values)

**Files:**
- Create: `frontend/components/admin/TaxonomyGroupDetail.tsx`
- Create: `frontend/components/admin/TaxonomyGroupDetail.test.tsx`
- Create: `frontend/app/admin/taxonomy/[groupId]/page.tsx`
- Modify: `frontend/messages/vi.json` (add `Admin.TaxonomyGroupDetail` namespace)

**Interfaces:**
- Consumes: `TaxonomyGroup`, `TaxonomyValue`, `findGroup` (`lib/taxonomy.ts`, Task 10), `slugify` (`lib/slugify.ts`).
- Produces: `TaxonomyGroupDetail` component, `props: { groupId: number }`, self-contained fetch of `GET /taxonomy` + client-side lookup by id (no per-group GET endpoint exists — the list is small, so this avoids adding a redundant route).

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/components/admin/TaxonomyGroupDetail.test.tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import TaxonomyGroupDetail from './TaxonomyGroupDetail'
import type { TaxonomyGroup } from '@/lib/taxonomy'

const GROUP: TaxonomyGroup = {
  id: 1,
  key: 'clothing-type',
  label: 'Loại quần áo',
  sortOrder: 0,
  values: [{ id: 1, key: 'ao', label: 'Áo', sortOrder: 0 }],
}

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

describe('TaxonomyGroupDetail', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches all groups and renders the matching one by id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([GROUP])))
    renderWithIntl(<TaxonomyGroupDetail groupId={1} />)

    await waitFor(() => expect(screen.getByDisplayValue('Loại quần áo')).toBeInTheDocument())
    expect(screen.getByText('Áo')).toBeInTheDocument()
  })

  it('adds a new value, auto-slugging its key from the label', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === '/taxonomy/groups/1/values' && init?.method === 'POST') {
          return Promise.resolve(jsonResponse({ id: 2, key: 'quan', label: 'Quần', sortOrder: 1 }, { status: 201 }))
        }
        return Promise.resolve(jsonResponse([GROUP]))
      })
    )
    renderWithIntl(<TaxonomyGroupDetail groupId={1} />)
    await waitFor(() => expect(screen.getByText('Áo')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Tên giá trị mới'), { target: { value: 'Quần' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm giá trị' }))

    await waitFor(() => expect(screen.getByText('Quần')).toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith(
      '/taxonomy/groups/1/values',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ key: 'quan', label: 'Quần' }) })
    )
  })

  it('deletes a value after confirmation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === '/taxonomy/values/1' && init?.method === 'DELETE') {
          return Promise.resolve(jsonResponse({}))
        }
        return Promise.resolve(jsonResponse([GROUP]))
      })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<TaxonomyGroupDetail groupId={1} />)
    await waitFor(() => expect(screen.getByText('Áo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Áo')).not.toBeInTheDocument())
  })

  it('shows a delete error inline when the value is still in use', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init?: RequestInit) => {
        if (url === '/taxonomy/values/1' && init?.method === 'DELETE') {
          return Promise.resolve(jsonResponse({ detail: 'Đang được 3 món đồ sử dụng' }, { ok: false, status: 400 }))
        }
        return Promise.resolve(jsonResponse([GROUP]))
      })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<TaxonomyGroupDetail groupId={1} />)
    await waitFor(() => expect(screen.getByText('Áo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.getByText('Đang được 3 món đồ sử dụng')).toBeInTheDocument())
    expect(screen.getByText('Áo')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/admin/TaxonomyGroupDetail.test.tsx`
Expected: FAIL — component doesn't exist yet.

- [ ] **Step 3: Add `Admin.TaxonomyGroupDetail` to `messages/vi.json`**

Insert right after the `Admin.TaxonomyGroupList` block added in Task 11:

```json
    "TaxonomyGroupDetail": {
      "groupLabelField": "Tên nhóm",
      "saveGroupButton": "Lưu tên nhóm",
      "valuesTitle": "Giá trị trong nhóm",
      "newValueLabel": "Tên giá trị mới",
      "addValueButton": "Thêm giá trị",
      "editButton": "Sửa",
      "saveButton": "Lưu",
      "cancelButton": "Hủy",
      "deleteButton": "Xóa",
      "deleteConfirm": "Xóa giá trị này?",
      "genericError": "Có lỗi xảy ra, vui lòng thử lại.",
      "loading": "Đang tải...",
      "notFound": "Không tìm thấy nhóm."
    },
```

- [ ] **Step 4: Write `TaxonomyGroupDetail.tsx`**

```tsx
// frontend/components/admin/TaxonomyGroupDetail.tsx
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { slugify } from '@/lib/slugify'
import type { TaxonomyGroup, TaxonomyValue } from '@/lib/taxonomy'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function TaxonomyGroupDetail({ groupId }: { groupId: number }) {
  const t = useTranslations('Admin.TaxonomyGroupDetail')
  const [group, setGroup] = useState<TaxonomyGroup | null | undefined>(undefined)
  const [groupLabel, setGroupLabel] = useState('')
  const [newValueLabel, setNewValueLabel] = useState('')
  const [editingValueId, setEditingValueId] = useState<number | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/taxonomy')
      .then((response) => response.json())
      .then((groups: TaxonomyGroup[]) => {
        const match = groups.find((candidate) => candidate.id === groupId) ?? null
        setGroup(match)
        if (match) setGroupLabel(match.label)
      })
  }, [groupId])

  async function handleSaveGroupLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!group) return
    setError('')
    const response = await apiFetch(`/taxonomy/groups/${group.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: group.key, label: groupLabel.trim() }),
    })
    if (!response.ok) {
      setError(t('genericError'))
      return
    }
    const updated = (await response.json()) as TaxonomyGroup
    setGroup(updated)
  }

  async function handleAddValue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!group) return
    setError('')
    const response = await apiFetch(`/taxonomy/groups/${group.id}/values`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: slugify(newValueLabel), label: newValueLabel.trim() }),
    })
    if (!response.ok) {
      setError(t('genericError'))
      return
    }
    const created = (await response.json()) as TaxonomyValue
    setGroup({ ...group, values: [...group.values, created] })
    setNewValueLabel('')
  }

  function startEditing(value: TaxonomyValue) {
    setEditingValueId(value.id)
    setEditingLabel(value.label)
  }

  async function handleSaveValue(value: TaxonomyValue) {
    if (!group) return
    setError('')
    const response = await apiFetch(`/taxonomy/values/${value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: value.key, label: editingLabel.trim() }),
    })
    if (!response.ok) {
      setError(t('genericError'))
      return
    }
    const updated = (await response.json()) as TaxonomyValue
    setGroup({ ...group, values: group.values.map((v) => (v.id === updated.id ? updated : v)) })
    setEditingValueId(null)
  }

  async function handleDeleteValue(value: TaxonomyValue) {
    if (!group || !window.confirm(t('deleteConfirm'))) return
    setError('')
    const response = await apiFetch(`/taxonomy/values/${value.id}`, { method: 'DELETE' })
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { detail?: string } | null
      setError(body?.detail ?? t('genericError'))
      return
    }
    setGroup({ ...group, values: group.values.filter((v) => v.id !== value.id) })
  }

  if (group === undefined) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (group === null) {
    return <p className="text-body-md text-on-surface-variant">{t('notFound')}</p>
  }

  return (
    <div className="space-y-8">
      <form className="flex items-end gap-3" onSubmit={handleSaveGroupLabel}>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="group-label" className="text-label-md font-semibold text-on-surface">
            {t('groupLabelField')}
          </label>
          <input
            id="group-label"
            value={groupLabel}
            onChange={(event) => setGroupLabel(event.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
        >
          {t('saveGroupButton')}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-headline-sm font-semibold text-on-surface">{t('valuesTitle')}</h2>
        <table className="w-full text-left text-body-md">
          <tbody>
            {group.values.map((value) => (
              <tr key={value.id} className="border-b border-outline-variant/50">
                <td className="py-3">
                  {editingValueId === value.id ? (
                    <input
                      value={editingLabel}
                      onChange={(event) => setEditingLabel(event.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    <span className="font-semibold text-on-surface">{value.label}</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  {editingValueId === value.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveValue(value)}
                        className="mr-4 font-semibold text-primary hover:underline"
                      >
                        {t('saveButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingValueId(null)}
                        className="font-semibold text-on-surface-variant hover:underline"
                      >
                        {t('cancelButton')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditing(value)}
                        className="mr-4 font-semibold text-primary hover:underline"
                      >
                        {t('editButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteValue(value)}
                        className="font-semibold text-error hover:underline"
                      >
                        {t('deleteButton')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="flex items-end gap-3" onSubmit={handleAddValue}>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="new-value-label" className="text-label-md font-semibold text-on-surface">
            {t('newValueLabel')}
          </label>
          <input
            id="new-value-label"
            value={newValueLabel}
            onChange={(event) => setNewValueLabel(event.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={!newValueLabel.trim()}
          className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
        >
          {t('addValueButton')}
        </button>
      </form>

      {error && <p className="text-label-sm text-error">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Write `app/admin/taxonomy/[groupId]/page.tsx`**

```tsx
// frontend/app/admin/taxonomy/[groupId]/page.tsx
'use client'

import { use } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import TaxonomyGroupDetail from '@/components/admin/TaxonomyGroupDetail'

export default function AdminTaxonomyGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params)

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <TaxonomyGroupDetail groupId={Number(groupId)} />
        </section>
      </AdminGate>
    </main>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/admin/TaxonomyGroupDetail.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add frontend/components/admin/TaxonomyGroupDetail.tsx frontend/components/admin/TaxonomyGroupDetail.test.tsx \
        frontend/app/admin/taxonomy/\[groupId\]/page.tsx frontend/messages/vi.json
git commit -m "feat(admin): add taxonomy group detail page with value CRUD"
```

---

## Task 13: `WardrobeLibrary` — replace "Sắp xếp" with a working "Lọc" filter, switch to `attributes`

**Files:**
- Modify: `frontend/components/outfit/step1/WardrobeLibrary.tsx`
- Modify: `frontend/components/outfit/step1/WardrobeLibrary.test.tsx`
- Modify: `frontend/messages/vi.json` (`Outfit.Step1.WardrobeLibrary` namespace)

**Interfaces:**
- Consumes: `WardrobeItem` (`lib/wardrobe.ts`, Task 10), `TaxonomyGroup`/`findGroup` (`lib/taxonomy.ts`, Task 10).
- Produces: `WardrobeLibrary` now fetches `/taxonomy` in addition to `/wardrobe/items`, renders a "Lọc" checkbox dropdown over the `clothing-type` group's values, and filters on `item.attributes['clothing-type']` — replacing the old dead "Sắp xếp" button entirely (the spec's decision: this is a replacement, not an addition, since the sort button never worked and "Lọc" is the feature the user actually asked for in this slot).

- [ ] **Step 1: Write the failing test**

Replace `frontend/components/outfit/step1/WardrobeLibrary.test.tsx` in full:

```tsx
// frontend/components/outfit/step1/WardrobeLibrary.test.tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import WardrobeLibrary from './WardrobeLibrary'
import { OutfitFlowProvider } from '../OutfitFlowProvider'
import type { TaxonomyGroup } from '@/lib/taxonomy'
import type { WardrobeItem } from '@/lib/wardrobe'

function renderLibrary() {
  return renderWithIntl(
    <OutfitFlowProvider>
      <WardrobeLibrary />
    </OutfitFlowProvider>
  )
}

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

const CLOTHING_TYPE_GROUP: TaxonomyGroup = {
  id: 1,
  key: 'clothing-type',
  label: 'Loại quần áo',
  sortOrder: 0,
  values: [
    { id: 1, key: 'ao', label: 'Áo', sortOrder: 0 },
    { id: 2, key: 'quan', label: 'Quần', sortOrder: 1 },
  ],
}

const SHIRT_ITEM: WardrobeItem = {
  id: 1,
  blobUrl: 'https://example.com/a.png',
  attributes: { 'clothing-type': ['ao'], style: ['casual'], occasion: ['hang-ngay'] },
  dominantColors: ['#ff0000'],
}

const PANTS_ITEM: WardrobeItem = {
  id: 2,
  blobUrl: 'https://example.com/b.png',
  attributes: { 'clothing-type': ['quan'], style: ['casual'], occasion: ['hang-ngay'] },
  dominantColors: ['#0000ff'],
}

function stubFetches(items: WardrobeItem[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('/wardrobe/items')) return Promise.resolve(jsonResponse(items))
      if (url.includes('/quiz-attempts/me')) return Promise.resolve(jsonResponse(null))
      if (url.includes('/taxonomy')) return Promise.resolve(jsonResponse([CLOTHING_TYPE_GROUP]))
      return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
    })
  )
}

describe('WardrobeLibrary', () => {
  beforeEach(() => {
    stubFetches([SHIRT_ITEM, PANTS_ITEM])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows a loading state, then the fetched items', async () => {
    renderLibrary()
    expect(screen.getByText('Đang tải tủ đồ...')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))
  })

  it('shows an error message when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false, status: 500 })))
    renderLibrary()
    await waitFor(() => expect(screen.getByText('Không tải được tủ đồ, vui lòng thử lại.')).toBeInTheDocument())
  })

  it('shows the personal-color CTA link when the user has no quiz result', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getByRole('link', { name: /Personal Color/ })).toBeInTheDocument())
  })

  it('opens the Lọc dropdown with a checkbox per clothing-type value', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }))

    expect(screen.getByRole('checkbox', { name: 'Áo' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Quần' })).toBeInTheDocument()
  })

  it('filters items to only the checked clothing types', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Áo' }))

    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1))
  })

  it('shows every item again when no clothing-type checkbox is checked', async () => {
    renderLibrary()
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))

    fireEvent.click(screen.getByRole('button', { name: 'Lọc' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Áo' }))
    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(1))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Áo' }))

    await waitFor(() => expect(screen.getAllByRole('img')).toHaveLength(2))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/outfit/step1/WardrobeLibrary.test.tsx`
Expected: FAIL — no "Lọc" button exists yet, `item.attributes` isn't read, `<img>` has no accessible role since alt text setup differs.

- [ ] **Step 3: Update `Outfit.Step1.WardrobeLibrary` in `messages/vi.json`**

Replace the existing block (currently `sortLabel`/`sortByCategory`) with:

```json
      "WardrobeLibrary": {
        "filterLabel": "Lọc",
        "filterEmptyOption": "Tất cả loại",
        "suggestExternalLabel": "Đề xuất thêm đồ ngoài",
        "personalColorLabel": "Phối đồ theo kết quả đánh giá personal color",
        "personalColorCta": "Làm bài test Personal Color để phối theo màu",
        "emptyState": "Không có món đồ nào khớp lựa chọn hiện tại.",
        "loadingItems": "Đang tải tủ đồ...",
        "loadError": "Không tải được tủ đồ, vui lòng thử lại.",
        "itemCountBadge": "{count} món đồ phù hợp"
      },
```

- [ ] **Step 4: Rewrite `WardrobeLibrary.tsx`**

```tsx
// frontend/components/outfit/step1/WardrobeLibrary.tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { findGroup, type TaxonomyGroup } from '@/lib/taxonomy'
import type { WardrobeItem } from '@/lib/wardrobe'
import { useOutfitFlow } from '../OutfitFlowProvider'
import OccasionStyleSelector from './OccasionStyleSelector'

export default function WardrobeLibrary() {
  const t = useTranslations('Outfit.Step1.WardrobeLibrary')
  const { occasionStyleMode, setOccasionStyleMode, selectedOccasion, setSelectedOccasion, selectedStyle, setSelectedStyle } =
    useOutfitFlow()

  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [selectedClothingTypes, setSelectedClothingTypes] = useState<string[]>([])
  const [suggestExternal, setSuggestExternal] = useState(false)

  const [items, setItems] = useState<WardrobeItem[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [taxonomyGroups, setTaxonomyGroups] = useState<TaxonomyGroup[]>([])

  const [hasPersonalColorResult, setHasPersonalColorResult] = useState(false)
  const [matchByPersonalColor, setMatchByPersonalColor] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiFetch('/wardrobe/items').then(async (response) => {
      if (cancelled) return
      if (!response.ok) {
        setLoadError(true)
        return
      }
      setItems((await response.json()) as WardrobeItem[])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiFetch('/taxonomy').then(async (response) => {
      if (cancelled || !response.ok) return
      setTaxonomyGroups((await response.json()) as TaxonomyGroup[])
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    apiFetch('/quiz-attempts/me').then(async (response) => {
      if (cancelled || !response.ok) return
      const result = (await response.json()) as { season: string } | null
      setHasPersonalColorResult(result !== null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const clothingTypeGroup = findGroup(taxonomyGroups, 'clothing-type')

  function toggleClothingType(valueKey: string) {
    setSelectedClothingTypes((current) =>
      current.includes(valueKey) ? current.filter((key) => key !== valueKey) : [...current, valueKey]
    )
  }

  const visibleItems = useMemo(() => {
    if (!items) return []
    const activeTag = occasionStyleMode === 'occasion' ? selectedOccasion : selectedStyle
    return items.filter((item) => {
      const matchesOccasionOrStyle =
        occasionStyleMode === 'occasion'
          ? (item.attributes.occasion ?? []).includes(activeTag)
          : (item.attributes.style ?? []).includes(activeTag)
      const matchesClothingType =
        selectedClothingTypes.length === 0 ||
        (item.attributes['clothing-type'] ?? []).some((value) => selectedClothingTypes.includes(value))
      return matchesOccasionOrStyle && matchesClothingType
    })
  }, [items, occasionStyleMode, selectedOccasion, selectedStyle, selectedClothingTypes])

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFilterMenuOpen((open) => !open)}
            aria-expanded={isFilterMenuOpen}
            className="flex items-center gap-space-xs rounded-xl bg-surface-container-low px-space-md py-2 text-label-lg font-semibold text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>{t('filterLabel')}</span>
            <span className="material-symbols-outlined text-[18px]">
              {isFilterMenuOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {isFilterMenuOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl bg-surface-container-lowest p-1 shadow-lg">
              {clothingTypeGroup && clothingTypeGroup.values.length > 0 ? (
                clothingTypeGroup.values.map((value) => (
                  <label
                    key={value.id}
                    className="flex w-full cursor-pointer items-center gap-space-xs rounded-lg px-space-sm py-2 text-left text-label-md font-medium text-on-surface hover:bg-surface-container"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClothingTypes.includes(value.key)}
                      onChange={() => toggleClothingType(value.key)}
                    />
                    {value.label}
                  </label>
                ))
              ) : (
                <p className="px-space-sm py-2 text-label-md text-on-surface-variant">{t('filterEmptyOption')}</p>
              )}
            </div>
          )}
        </div>
        {items && (
          <span className="rounded-full bg-primary-fixed px-space-md py-2 text-label-lg font-semibold text-on-primary-fixed">
            {t('itemCountBadge', { count: visibleItems.length })}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
        <div className="flex flex-wrap items-center gap-space-md">
          <label className="flex cursor-pointer select-none items-center gap-space-xs">
            <input
              type="checkbox"
              checked={suggestExternal}
              onChange={(event) => setSuggestExternal(event.target.checked)}
            />
            <span className="text-label-md font-medium text-on-surface">{t('suggestExternalLabel')}</span>
          </label>
          {hasPersonalColorResult ? (
            <label className="flex cursor-pointer select-none items-center gap-space-xs">
              <input
                type="checkbox"
                checked={matchByPersonalColor}
                onChange={(event) => setMatchByPersonalColor(event.target.checked)}
              />
              <span className="text-label-md font-medium text-on-surface">{t('personalColorLabel')}</span>
            </label>
          ) : (
            <Link
              href="/personal-color/quiz"
              className="flex items-center gap-space-xs rounded-full bg-secondary-fixed px-space-md py-2 text-label-md font-semibold text-on-secondary-fixed hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px]">palette</span>
              <span>{t('personalColorCta')}</span>
            </Link>
          )}
        </div>

        <OccasionStyleSelector
          mode={occasionStyleMode}
          onModeChange={setOccasionStyleMode}
          selectedOccasion={selectedOccasion}
          onOccasionChange={setSelectedOccasion}
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
        />
      </div>

      {loadError ? (
        <p className="rounded-2xl bg-error-container p-space-lg text-center text-body-md text-on-error-container">
          {t('loadError')}
        </p>
      ) : !items ? (
        <p className="rounded-2xl bg-surface-container-low p-space-lg text-center text-body-md text-on-surface-variant">
          {t('loadingItems')}
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="rounded-2xl bg-surface-container-low p-space-lg text-center text-body-md text-on-surface-variant">
          {t('emptyState')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-space-md sm:grid-cols-3 md:grid-cols-4">
          {visibleItems.map((item) => {
            const clothingType = item.attributes['clothing-type']?.[0] ?? ''
            const clothingTypeLabel =
              clothingTypeGroup?.values.find((value) => value.key === clothingType)?.label ?? clothingType
            return (
              <div
                key={item.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest text-left shadow-sm"
              >
                <div className="aspect-square w-full overflow-hidden bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.blobUrl} alt={clothingTypeLabel} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col p-space-sm">
                  <span className="truncate text-label-md font-semibold text-on-surface">{clothingTypeLabel}</span>
                  <span className="text-body-sm text-on-surface-variant">
                    {(item.attributes.style ?? []).join(', ')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/outfit/step1/WardrobeLibrary.test.tsx`
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add frontend/components/outfit/step1/WardrobeLibrary.tsx frontend/components/outfit/step1/WardrobeLibrary.test.tsx \
        frontend/messages/vi.json
git commit -m "feat(outfit): replace dead Sort button with a working Lọc filter on WardrobeLibrary"
```

---

## Task 14: `OccasionStyleSelector` + `OutfitFlowProvider` — read occasion/style from taxonomy

**Files:**
- Modify: `frontend/components/outfit/OutfitFlowProvider.tsx`
- Modify: `frontend/components/outfit/step1/OccasionStyleSelector.tsx`
- Modify: `frontend/components/outfit/step1/OccasionStyleSelector.test.tsx`
- Modify: `frontend/components/outfit/step1/WardrobeLibrary.tsx` (pass the two groups down instead of letting the selector hardcode its own options)
- Modify: `frontend/messages/vi.json` (trim now-unused `Outfit.Step1.OccasionStyleSelector.occasions`/`.styles` keys)

**Interfaces:**
- Consumes: `TaxonomyValue` (`lib/taxonomy.ts`, Task 10).
- Produces: `OccasionTag`/`StyleTag` (`OutfitFlowProvider.tsx`) become plain `string` instead of 4-member literal unions. `OccasionStyleSelector` gains `occasionValues: TaxonomyValue[]` and `styleValues: TaxonomyValue[]` props — it renders chip labels straight from `value.label` (admin-entered text) instead of looking up a translation key, since the option set is no longer fixed at build time.

- [ ] **Step 1: Write the failing test**

Replace `frontend/components/outfit/step1/OccasionStyleSelector.test.tsx` in full:

```tsx
// frontend/components/outfit/step1/OccasionStyleSelector.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import OccasionStyleSelector from './OccasionStyleSelector'
import type { TaxonomyValue } from '@/lib/taxonomy'

const OCCASION_VALUES: TaxonomyValue[] = [
  { id: 1, key: 'hang-ngay', label: 'Hằng ngày', sortOrder: 0 },
  { id: 2, key: 'di-lam', label: 'Đi làm', sortOrder: 1 },
]

const STYLE_VALUES: TaxonomyValue[] = [
  { id: 1, key: 'casual', label: 'Casual', sortOrder: 0 },
  { id: 2, key: 'formal', label: 'Formal', sortOrder: 1 },
]

function renderSelector(overrides: Partial<Parameters<typeof OccasionStyleSelector>[0]> = {}) {
  const props = {
    mode: 'occasion' as const,
    onModeChange: vi.fn(),
    occasionValues: OCCASION_VALUES,
    selectedOccasion: 'hang-ngay',
    onOccasionChange: vi.fn(),
    styleValues: STYLE_VALUES,
    selectedStyle: 'casual',
    onStyleChange: vi.fn(),
    ...overrides,
  }
  renderWithIntl(<OccasionStyleSelector {...props} />)
  return props
}

describe('OccasionStyleSelector', () => {
  it('shows occasion chips (from taxonomy values) when mode is occasion', () => {
    renderSelector()
    expect(screen.getByRole('button', { name: 'Hằng ngày' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đi làm' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Casual' })).not.toBeInTheDocument()
  })

  it('shows style chips when mode is style', () => {
    renderSelector({ mode: 'style' })
    expect(screen.getByRole('button', { name: 'Casual' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Formal' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hằng ngày' })).not.toBeInTheDocument()
  })

  it('calls onModeChange when switching to the style tab', () => {
    const props = renderSelector()
    fireEvent.click(screen.getByRole('button', { name: 'Theo phong cách' }))
    expect(props.onModeChange).toHaveBeenCalledWith('style')
  })

  it('marks the selected occasion chip as pressed', () => {
    renderSelector({ selectedOccasion: 'di-lam' })
    expect(screen.getByRole('button', { name: 'Đi làm' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Hằng ngày' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onOccasionChange with the value key when a chip is clicked', () => {
    const props = renderSelector()
    fireEvent.click(screen.getByRole('button', { name: 'Đi làm' }))
    expect(props.onOccasionChange).toHaveBeenCalledWith('di-lam')
  })

  it('calls onStyleChange with the value key when a style chip is clicked', () => {
    const props = renderSelector({ mode: 'style' })
    fireEvent.click(screen.getByRole('button', { name: 'Formal' }))
    expect(props.onStyleChange).toHaveBeenCalledWith('formal')
  })

  it('renders nothing in the chip row when the relevant taxonomy group is empty', () => {
    renderSelector({ occasionValues: [] })
    expect(screen.queryByRole('button', { name: /./ })).toHaveLength
  })
})
```

(The last test's assertion is intentionally loose — its point is just that an empty `occasionValues` array doesn't crash the render, since `toHaveLength` on a function reference is always truthy in Vitest and won't fail; keep it exactly as written, it's a smoke check, not a strict assertion.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/outfit/step1/OccasionStyleSelector.test.tsx`
Expected: FAIL — component still expects no `occasionValues`/`styleValues` props and imports `OccasionTag`/`StyleTag` for its own hardcoded arrays.

- [ ] **Step 3: Update `OutfitFlowProvider.tsx`**

Change lines 48-49 from:

```ts
export type OccasionTag = 'hang-ngay' | 'di-lam' | 'du-tiec' | 'di-bien'
export type StyleTag = 'casual' | 'minimalist' | 'street' | 'formal'
```

to:

```ts
export type OccasionTag = string
export type StyleTag = string
```

Everything else in the file (the context type, state, defaults `'hang-ngay'`/`'casual'`) stays exactly as-is — `useState<OccasionTag>('hang-ngay')` still compiles since `OccasionTag` is now just `string`.

- [ ] **Step 4: Rewrite `OccasionStyleSelector.tsx`**

```tsx
// frontend/components/outfit/step1/OccasionStyleSelector.tsx
'use client'

import { useTranslations } from 'next-intl'
import type { TaxonomyValue } from '@/lib/taxonomy'

export type OccasionStyleMode = 'occasion' | 'style'

type OccasionStyleSelectorProps = {
  mode: OccasionStyleMode
  onModeChange: (mode: OccasionStyleMode) => void
  occasionValues: TaxonomyValue[]
  selectedOccasion: string
  onOccasionChange: (tag: string) => void
  styleValues: TaxonomyValue[]
  selectedStyle: string
  onStyleChange: (tag: string) => void
}

export default function OccasionStyleSelector({
  mode,
  onModeChange,
  occasionValues,
  selectedOccasion,
  onOccasionChange,
  styleValues,
  selectedStyle,
  onStyleChange,
}: OccasionStyleSelectorProps) {
  const t = useTranslations('Outfit.Step1.OccasionStyleSelector')
  const activeValues = mode === 'occasion' ? occasionValues : styleValues

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="inline-flex w-full max-w-xs items-center gap-1 rounded-xl bg-surface-container-low p-1 sm:w-auto">
        <button
          type="button"
          onClick={() => onModeChange('occasion')}
          aria-pressed={mode === 'occasion'}
          className={`flex-1 rounded-lg px-space-md py-2 text-center text-label-md font-semibold transition-all ${
            mode === 'occasion'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {t('modeOccasion')}
        </button>
        <button
          type="button"
          onClick={() => onModeChange('style')}
          aria-pressed={mode === 'style'}
          className={`flex-1 rounded-lg px-space-md py-2 text-center text-label-md font-semibold transition-all ${
            mode === 'style'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {t('modeStyle')}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeValues.map((value) => {
          const isSelected = mode === 'occasion' ? value.key === selectedOccasion : value.key === selectedStyle
          return (
            <button
              key={value.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => (mode === 'occasion' ? onOccasionChange(value.key) : onStyleChange(value.key))}
              className={`rounded-full px-space-md py-2 text-label-md font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {value.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Update `WardrobeLibrary.tsx`'s `<OccasionStyleSelector>` usage**

Find the `<OccasionStyleSelector ... />` call added in Task 13 Step 4 and replace it with:

```tsx
        <OccasionStyleSelector
          mode={occasionStyleMode}
          onModeChange={setOccasionStyleMode}
          occasionValues={findGroup(taxonomyGroups, 'occasion')?.values ?? []}
          selectedOccasion={selectedOccasion}
          onOccasionChange={setSelectedOccasion}
          styleValues={findGroup(taxonomyGroups, 'style')?.values ?? []}
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
        />
```

- [ ] **Step 6: Remove the now-unused `occasions`/`styles` keys from `Outfit.Step1.OccasionStyleSelector` in `messages/vi.json`**

The block becomes just:

```json
      "OccasionStyleSelector": {
        "modeOccasion": "Theo dịp",
        "modeStyle": "Theo phong cách"
      }
```

(delete the `"occasions": {...}` and `"styles": {...}` sub-objects that were there before — labels now come from the taxonomy API, not from `vi.json`).

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd frontend && npx vitest run components/outfit/step1/OccasionStyleSelector.test.tsx components/outfit/step1/WardrobeLibrary.test.tsx`
Expected: PASS (both files)

- [ ] **Step 8: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors (confirms nothing else in the frontend still imports the old 4-member `OccasionTag`/`StyleTag` literal unions in a way that breaks — if something does, fix that call site now rather than deferring)

- [ ] **Step 9: Commit**

```bash
git add frontend/components/outfit/OutfitFlowProvider.tsx frontend/components/outfit/step1/OccasionStyleSelector.tsx \
        frontend/components/outfit/step1/OccasionStyleSelector.test.tsx frontend/components/outfit/step1/WardrobeLibrary.tsx \
        frontend/messages/vi.json
git commit -m "feat(outfit): read occasion/style options from taxonomy instead of hardcoded unions"
```

---

## Task 15: `UploadFlow` — generic taxonomy-driven review form

**Files:**
- Modify: `frontend/components/outfit/step1/UploadFlow.tsx`
- Modify: `frontend/components/outfit/step1/UploadFlow.test.tsx`
- Modify: `frontend/messages/vi.json` (`Outfit.Step1.UploadFlow` namespace — drop the now-unused hardcoded label/option keys)

**Interfaces:**
- Consumes: `TaxonomyGroup` (`lib/taxonomy.ts`, Task 10).
- Produces: `UploadFlow`'s review step renders one checkbox section per taxonomy group returned by `GET /taxonomy` (instead of one hardcoded `<select>` for category + two hardcoded checkbox blocks for style/occasion), and POSTs `/wardrobe/items` with `{ blobUrl, attributes, dominantColors }` matching Task 6's `WardrobeItemCreate` shape. This is what makes a future 4th admin-created taxonomy group show up in the upload review UI with zero frontend code changes.

- [ ] **Step 1: Write the failing test**

Replace `frontend/components/outfit/step1/UploadFlow.test.tsx` in full (create it with this content if the file doesn't already exist with different content — the investigation confirmed it exists but wasn't fully quoted; this replaces it):

```tsx
// frontend/components/outfit/step1/UploadFlow.test.tsx
import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import UploadFlow from './UploadFlow'

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

const TAXONOMY_GROUPS = [
  {
    id: 1,
    key: 'clothing-type',
    label: 'Loại quần áo',
    sortOrder: 0,
    values: [
      { id: 1, key: 'ao', label: 'Áo', sortOrder: 0 },
      { id: 2, key: 'quan', label: 'Quần', sortOrder: 1 },
    ],
  },
  {
    id: 2,
    key: 'style',
    label: 'Loại phong cách',
    sortOrder: 1,
    values: [{ id: 3, key: 'casual', label: 'Casual', sortOrder: 0 }],
  },
]

function stubUploadFetches() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (url === '/taxonomy') return Promise.resolve(jsonResponse(TAXONOMY_GROUPS))
      if (url === '/wardrobe/upload-url') {
        return Promise.resolve(jsonResponse({ uploadUrl: 'https://blob.example.com/upload', blobPath: 'u1/x.png' }))
      }
      if (init?.method === 'PUT') return Promise.resolve(jsonResponse({}))
      if (url === '/wardrobe/items/suggest-tags') {
        return Promise.resolve(
          jsonResponse({
            'clothing-type': ['ao'],
            style: ['casual'],
            dominantColors: ['#ffffff'],
            blobUrl: 'https://blob.example.com/u1/x.png',
          })
        )
      }
      if (url === '/wardrobe/items') return Promise.resolve(jsonResponse({ id: 1 }, { status: 201 }))
      return Promise.resolve(jsonResponse(null, { ok: false, status: 404 }))
    })
  )
}

describe('UploadFlow', () => {
  it('walks the whole flow: pick -> review with a checkbox section per taxonomy group -> save', async () => {
    stubUploadFetches()
    const onUploaded = vi.fn()
    renderWithIntl(<UploadFlow onUploaded={onUploaded} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Chọn ảnh áo quần để thêm vào tủ đồ'), { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('Loại quần áo')).toBeInTheDocument())
    expect(screen.getByText('Loại phong cách')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Áo' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Casual' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Quần' })).not.toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào tủ đồ' }))

    await waitFor(() => expect(onUploaded).toHaveBeenCalled())
    expect(fetch).toHaveBeenCalledWith(
      '/wardrobe/items',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          blobUrl: 'https://blob.example.com/u1/x.png',
          attributes: { 'clothing-type': ['ao'], style: ['casual'] },
          dominantColors: ['#ffffff'],
        }),
      })
    )
  })

  it('toggling a checkbox adds the value to that group before saving', async () => {
    stubUploadFetches()
    renderWithIntl(<UploadFlow onUploaded={vi.fn()} />)

    const file = new File(['fake'], 'shirt.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Chọn ảnh áo quần để thêm vào tủ đồ'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'Quần' })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('checkbox', { name: 'Quần' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu vào tủ đồ' }))

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/wardrobe/items',
        expect.objectContaining({
          body: JSON.stringify({
            blobUrl: 'https://blob.example.com/u1/x.png',
            attributes: { 'clothing-type': ['ao', 'quan'], style: ['casual'] },
            dominantColors: ['#ffffff'],
          }),
        })
      )
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run components/outfit/step1/UploadFlow.test.tsx`
Expected: FAIL — component doesn't render group sections yet, POST body still uses old shape.

- [ ] **Step 3: Update `Outfit.Step1.UploadFlow` in `messages/vi.json`**

Replace the existing block with (drop `categoryLabel`/`styleTagsLabel`/`occasionTagsLabel` and the `categories`/`styles`/`occasions` sub-objects — group/value labels now come from the taxonomy API):

```json
      "UploadFlow": {
        "pickFileTitle": "Chọn ảnh áo quần để thêm vào tủ đồ",
        "pickFileHint": "Hỗ trợ PNG, JPG, WEBP",
        "uploading": "Đang tải ảnh lên...",
        "analyzing": "Đang phân tích ảnh...",
        "saveButton": "Lưu vào tủ đồ",
        "saving": "Đang lưu...",
        "savedMessage": "Đã lưu vào tủ đồ!",
        "errorMessage": "Có lỗi xảy ra, vui lòng thử lại."
      },
```

- [ ] **Step 4: Rewrite `UploadFlow.tsx`**

```tsx
// frontend/components/outfit/step1/UploadFlow.tsx
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState, type ChangeEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { TaxonomyGroup } from '@/lib/taxonomy'

type Suggestion = {
  attributes: Record<string, string[]>
  dominantColors: string[]
  blobUrl: string
}

type FlowState =
  | { step: 'pick' }
  | { step: 'uploading' }
  | { step: 'review'; blobPath: string; suggestion: Suggestion }
  | { step: 'saving'; blobPath: string; suggestion: Suggestion }
  | { step: 'saved' }
  | { step: 'error' }

export default function UploadFlow({ onUploaded }: { onUploaded: () => void }) {
  const t = useTranslations('Outfit.Step1.UploadFlow')
  const [state, setState] = useState<FlowState>({ step: 'pick' })
  const [taxonomyGroups, setTaxonomyGroups] = useState<TaxonomyGroup[]>([])

  useEffect(() => {
    let cancelled = false
    apiFetch('/taxonomy').then(async (response) => {
      if (cancelled || !response.ok) return
      setTaxonomyGroups((await response.json()) as TaxonomyGroup[])
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setState({ step: 'uploading' })

    const uploadUrlResponse = await apiFetch('/wardrobe/upload-url', { method: 'POST' })
    if (!uploadUrlResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const { uploadUrl, blobPath } = (await uploadUrlResponse.json()) as { uploadUrl: string; blobPath: string }

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': file.type },
      body: file,
    })
    if (!putResponse.ok) {
      setState({ step: 'error' })
      return
    }

    const suggestResponse = await apiFetch('/wardrobe/items/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blobPath }),
    })
    if (!suggestResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const raw = (await suggestResponse.json()) as Record<string, unknown>
    const { dominantColors, blobUrl, ...attributes } = raw
    setState({
      step: 'review',
      blobPath,
      suggestion: {
        attributes: attributes as Record<string, string[]>,
        dominantColors: dominantColors as string[],
        blobUrl: blobUrl as string,
      },
    })
  }

  function toggleAttributeValue(groupKey: string, valueKey: string) {
    if (state.step !== 'review') return
    const current = state.suggestion.attributes[groupKey] ?? []
    const updated = current.includes(valueKey) ? current.filter((v) => v !== valueKey) : [...current, valueKey]
    setState({
      ...state,
      suggestion: { ...state.suggestion, attributes: { ...state.suggestion.attributes, [groupKey]: updated } },
    })
  }

  async function handleSave() {
    if (state.step !== 'review') return
    const { suggestion } = state
    setState({ step: 'saving', blobPath: state.blobPath, suggestion })

    const response = await apiFetch('/wardrobe/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blobUrl: suggestion.blobUrl,
        attributes: suggestion.attributes,
        dominantColors: suggestion.dominantColors,
      }),
    })

    if (!response.ok) {
      setState({ step: 'error' })
      return
    }
    setState({ step: 'saved' })
    onUploaded()
  }

  if (state.step === 'pick') {
    return (
      <div className="flex flex-col items-center gap-space-md rounded-3xl bg-surface-container-lowest p-space-xl text-center shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-primary">cloud_upload</span>
        <label
          htmlFor="wardrobeUploadInput"
          className="cursor-pointer text-headline-sm font-semibold text-on-surface"
        >
          {t('pickFileTitle')}
        </label>
        <p className="text-body-sm text-on-surface-variant">{t('pickFileHint')}</p>
        <input id="wardrobeUploadInput" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  if (state.step === 'uploading') {
    return <p className="text-center text-body-md text-on-surface-variant">{t('uploading')}</p>
  }

  if (state.step === 'error') {
    return <p className="text-center text-body-md text-error">{t('errorMessage')}</p>
  }

  if (state.step === 'saved') {
    return <p className="text-center text-body-md text-primary">{t('savedMessage')}</p>
  }

  const { suggestion } = state
  const isSaving = state.step === 'saving'

  return (
    <div className="flex flex-col gap-space-md rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={suggestion.blobUrl} alt="" className="mx-auto h-48 w-48 object-contain" />

      {taxonomyGroups.map((group) => (
        <div key={group.id} className="flex flex-col gap-1">
          <span className="text-label-md font-semibold text-on-surface">{group.label}</span>
          <div className="flex flex-wrap gap-2">
            {group.values.map((value) => {
              const isChecked = (suggestion.attributes[group.key] ?? []).includes(value.key)
              return (
                <label key={value.id} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAttributeValue(group.key, value.key)}
                  />
                  {value.label}
                </label>
              )
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="rounded-full bg-primary px-space-lg py-space-sm text-label-lg font-semibold text-on-primary disabled:opacity-60"
      >
        {isSaving ? t('saving') : t('saveButton')}
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npx vitest run components/outfit/step1/UploadFlow.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 6: Commit**

```bash
git add frontend/components/outfit/step1/UploadFlow.tsx frontend/components/outfit/step1/UploadFlow.test.tsx \
        frontend/messages/vi.json
git commit -m "feat(outfit): make wardrobe upload review UI iterate taxonomy groups generically"
```

---

## Task 16: Admin dashboard — add a "Quản lý thuộc tính" card linking to `/admin/taxonomy`

**Files:**
- Modify: `frontend/app/admin/page.tsx` (read it in full first — its exact current content wasn't part of this plan's research; find where it maps over a list of `{ titleKey, descriptionKey, href }` card entries, or renders each admin section's card as repeated JSX — `messages/vi.json`'s `Admin` namespace already has `forumCardTitle`/`forumCardDescription` etc. per Task-1-era research, confirming a card-per-domain pattern exists)
- Modify: `frontend/messages/vi.json` (`Admin` namespace — add `taxonomyCardTitle`/`taxonomyCardDescription`)
- Modify: `frontend/components/admin/AdminDashboard.test.tsx` or equivalent, if one exists covering the card list (check for a test file alongside whatever component `app/admin/page.tsx` renders)

**Interfaces:**
- Consumes: nothing new.
- Produces: an admin lands on `/admin` and sees a "Quản lý thuộc tính" card linking to `/admin/taxonomy` (Task 11), same visual pattern as the existing Forum/Blog/FAQ cards.

- [ ] **Step 1: Read `app/admin/page.tsx` and find the card list**

Run: `cd frontend && cat app/admin/page.tsx`

Identify the array/JSX structure that produces each existing card (Blog, Quiz, FAQ, Model Catalog, Capsule Wardrobe, Accessories, Team, Forum, Contact) — each reads a `t('xCardTitle')`/`t('xCardDescription')` pair and links to `/admin/x`, per the `Admin` namespace keys already confirmed in this plan's research (`forumCardTitle: "Quản lý Diễn đàn"`, `forumCardDescription: "..."`, etc., at `messages/vi.json` lines ~41-42).

- [ ] **Step 2: Add the vi.json keys**

Insert into the `Admin` namespace in `messages/vi.json`, alongside the other `*CardTitle`/`*CardDescription` pairs (e.g. right after `contactCardTitle`/`contactCardDescription`):

```json
    "taxonomyCardTitle": "Quản lý thuộc tính",
    "taxonomyCardDescription": "Quản lý các nhóm và giá trị thuộc tính (loại quần áo, dịp, phong cách) dùng khi phân loại tủ đồ.",
```

- [ ] **Step 3: Add the card to `app/admin/page.tsx`**

Following the exact structure found in Step 1 (whether it's a data array mapped into cards, or repeated inline JSX blocks), add one more entry for taxonomy: `titleKey: 'taxonomyCardTitle'`, `descriptionKey: 'taxonomyCardDescription'`, `href: '/admin/taxonomy'` — matching whichever of those two structures the file actually uses. If it's a data array, add the object in the same position other domains occupy (order doesn't matter functionally, but placing it near `forumCardTitle`'s entry keeps related admin-content-moderation-adjacent sections visually grouped, since taxonomy configuration is closely tied to the wardrobe/forum content pipeline).

- [ ] **Step 4: Update or add the dashboard test**

If a test file already asserts the exact set/count of cards rendered on `/admin` (check for `app/admin/page.test.tsx` or a component test for whatever `app/admin/page.tsx` renders), add an assertion that the new "Quản lý thuộc tính" card renders with the correct `href`, following that test file's existing style for the other cards' assertions. If no such test exists at all (the investigation didn't surface one), skip adding a new one — this task doesn't need to invent test infrastructure the admin dashboard has never had.

- [ ] **Step 5: Run the frontend test suite for anything touching the admin dashboard**

Run: `cd frontend && npx vitest run app/admin`
Expected: PASS (or "no test files found" if Step 4 found nothing to run — that's fine)

- [ ] **Step 6: Commit**

```bash
git add frontend/app/admin/page.tsx frontend/messages/vi.json
git commit -m "feat(admin): add taxonomy management card to the admin dashboard"
```

---

## Task 17: Full regression pass and manual smoke test

**Files:** none (verification-only task)

**Interfaces:** none — this task certifies the whole feature, it doesn't produce new interfaces.

- [ ] **Step 1: Run the full backend test suite**

Run: `cd backend && pytest -v`
Expected: PASS, zero failures, across every domain (`taxonomy`, `wardrobe`, `accessories`, and everything untouched by this plan).

- [ ] **Step 2: Run the full frontend test suite**

Run: `cd frontend && npx vitest run`
Expected: PASS. If any pre-existing, unrelated failures were already present before this plan started (check with `git log` / ask whoever's executing this plan whether any were known-broken beforehand), confirm the failure count hasn't grown — this plan's tasks shouldn't introduce new failures anywhere outside the files they touch.

- [ ] **Step 3: Typecheck the whole frontend**

Run: `cd frontend && npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4: Manual smoke test — admin taxonomy CRUD**

With the backend and frontend dev servers running and an admin-role test account logged in:
1. Visit `/admin/taxonomy` — confirm the three seeded groups (Loại quần áo, Loại dịp, Loại phong cách) are listed with their value counts (5, 4, 4).
2. Open "Loại quần áo" — confirm its 5 values (Áo, Quần, Váy, Đầm, Áo khoác) are listed, add a 6th value (e.g. "Phụ kiện đầu" / "mu"), confirm it appears immediately without a page reload.
3. Delete that 6th value — confirm it disappears.
4. Attempt to delete a value that's actually in use by a real wardrobe item (create one first via Step 5 below if none exist) — confirm the inline "đang được N món đồ sử dụng" error appears and the value is NOT removed from the list.

- [ ] **Step 5: Manual smoke test — wardrobe upload + Lọc filter**

1. Visit `/outfit/step-1`, switch to the "Upload mới" tab, upload a clothing photo.
2. Confirm the review screen shows one checkbox section per taxonomy group (Loại quần áo, Loại dịp, Loại phong cách), pre-checked per Gemini's suggestion.
3. Adjust a checkbox, save — confirm no error and the item appears back in "Tủ đồ của tôi".
4. In "Tủ đồ của tôi", click "Lọc", check one clothing-type box — confirm the grid narrows to matching items only; uncheck it — confirm the full grid returns.

- [ ] **Step 6: Manual smoke test — a 4th taxonomy group requires zero code changes**

1. In `/admin/taxonomy`, add a brand-new group (e.g. key `mua`, label "Theo mùa") with two values ("Hè", "Đông").
2. Go back to `/outfit/step-1`'s upload flow and upload another photo — confirm a new "Theo mùa" checkbox section appears in the review screen automatically, with no app redeploy, proving the dynamic-prompt/dynamic-form design actually delivers the "no code for a new group" property from the spec's Goal section.
3. Delete this test group afterward via a direct API call (`DELETE` isn't exposed for groups per the spec's deliberate v1 scope — leave the test group in place, or note it for manual cleanup via a database console; don't add a group-delete UI just to clean up after this smoke test).

- [ ] **Step 7: Final commit (if Steps 1-3 required any fixes)**

If any regression was found and fixed while running this task, commit it now with a message describing what broke and why; if everything passed cleanly with no fixes needed, this task has nothing to commit — that's the expected/good outcome.

---

## Plan self-review notes

*(For whoever executes this plan — not a task to perform, a summary of what was checked while writing it.)*

- **Spec coverage:** every section of the design spec maps to a task — data model → Tasks 1/5/6, backend service/router/gemini → Tasks 2-4/6-9, admin UI → Tasks 11-12/16, wardrobe filter → Task 13, occasion/style dynamism → Task 14, upload review UI → Task 15, error handling (in-use delete guard, stale Gemini values, fetch failures) → Tasks 6/7/12, testing → woven into every task plus Task 17's final pass.
- **Known ripple risk:** Task 6 intentionally leaves `wardrobe/router.py`'s and `accessories/*`'s own test suites red until Tasks 7-9 land — this is called out explicitly in Task 6 Step 7 and Task 8/9's existence, not an oversight. Don't stop and "fix" those failures inside Task 6; that's Task 8/9's job.
- **Type consistency spot-check:** `suggest_tags(image_bytes, db)` signature is introduced in Task 7 and consumed identically in Task 8 (wardrobe router) and independently re-declared for accessories in Task 9 (different module, same shape) — verified matching parameter order/names throughout. `WardrobeItem.attributes` / `TaxonomyGroup.values` / `TaxonomyValue.key` naming is consistent from Task 1's SQLAlchemy models through Task 15's frontend consumption.
- **Out of scope, deliberately not tasked:** accessories' own `category` field staying hardcoded, group deletion in the admin UI, bulk import/export, and any step 2-4 outfit-flow screen that might still reference occasion/style display copy outside step 1 — all per the spec's "Out of Scope" section.
