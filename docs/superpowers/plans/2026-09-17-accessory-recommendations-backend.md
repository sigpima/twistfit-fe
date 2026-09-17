# Accessory Recommendations (Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `accessories` backend domain: an admin-curated catalog of affiliate-linked accessory products, auto-tagged via Gemini at creation time, with a recommendation endpoint that scores the catalog against the current outfit's occasion/style and the user's personal color.

**Architecture:** Follows the existing domain-driven FastAPI pattern exactly (`models.py`/`schemas.py`/`service.py`/`router.py`, Alembic migration, `CamelModel` for camelCase JSON) — the same shape as `capsule_wardrobe` (public reads, admin-gated writes) combined with `wardrobe`'s Gemini-tagging-at-upload-time flow. The recommendation endpoint resolves the user's personal color server-side from their latest `quiz_attempts` row (same lookup `tryon/router.py` uses, now pointed at the correct `parent_season` column) rather than trusting anything the frontend sends.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Alembic, `azure-storage-blob` (via the existing `app/core/blob_storage.py`), `httpx`, Gemini (via its REST API, no SDK).

**Spec:** `frontend/docs/superpowers/specs/2026-09-17-accessory-recommendations-design.md`

## Global Constraints

- Follow `backend/README.md`'s "Adding a new domain" convention exactly: `models.py` subclasses `app.db.session.Base`; `schemas.py` extends `app.domains.auth.schemas.CamelModel`; `service.py` takes `Session` as an explicit parameter; `router.py` is mounted in `app/main.py`.
- Tests mirror `tests/domains/<name>/` and use the real Postgres test database via the `db_session`/`client` fixtures in `tests/conftest.py` — no SQLite, no DB mocks. `POST /accessories/upload-url` and `/suggest-tags` tests need a running Azurite (`docker compose up -d azurite`), same as the existing wardrobe upload-flow tests.
- Auth request bodies use `identifier` (email or phone), not `email` — e.g. `client.post("/auth/register", json={"name": "T", "identifier": "x@example.com", "password": "password123"})`. This is the **current** schema; do not copy the older `email`-keyed examples from `2026-09-15-wardrobe-tryon-backend.md`, which predates a schema change.
- Protect admin-only routes with `Depends(app.deps.require_admin)`; the recommendations route with `Depends(app.deps.get_current_user)` (every other CRUD read is public, matching `capsule_wardrobe`).
- Reuse existing vocabularies instead of redefining them: `STYLE_TAGS`/`OCCASION_TAGS` from `app.domains.wardrobe.schemas`, `PARENT_SEASONS` from `app.domains.quiz_attempts.schemas`.
- New tables need a migration via `alembic revision --autogenerate -m "..."` after registering the new model in `alembic/env.py`, per the README.
- `git diff` after `alembic revision --autogenerate` and read the generated file before committing — autogenerate is a starting point, not a guarantee.

---

## Task 1: `accessories` domain — model, migration, and CRUD

**Files:**
- Create: `backend/app/domains/accessories/__init__.py`
- Create: `backend/app/domains/accessories/models.py`
- Create: `backend/app/domains/accessories/schemas.py`
- Create: `backend/app/domains/accessories/service.py`
- Create: `backend/app/domains/accessories/router.py`
- Modify: `backend/alembic/env.py`
- Create: `backend/alembic/versions/<generated>_create_accessory_products_table.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/domains/accessories/__init__.py`
- Test: `backend/tests/domains/accessories/test_models.py`
- Test: `backend/tests/domains/accessories/test_router.py`

**Interfaces:**
- Produces: `AccessoryProduct` model (`app/domains/accessories/models.py`); `ACCESSORY_CATEGORIES` list; `AccessoryProductInput`/`AccessoryProductResponse` schemas; `service.list_accessories(db) -> list[AccessoryProduct]`, `service.get_accessory(db, accessory_id) -> AccessoryProduct | None`, `service.create_accessory(db, data) -> AccessoryProduct`, `service.update_accessory(db, accessory_id, data) -> AccessoryProduct | None`, `service.delete_accessory(db, accessory_id) -> bool` — consumed by Tasks 3 and 4.

- [ ] **Step 1: Write the failing model test**

Create `backend/tests/domains/accessories/__init__.py` (empty file).

Create `backend/tests/domains/accessories/test_models.py`:

```python
from app.domains.accessories.models import AccessoryProduct


def test_create_accessory_product(db_session):
    product = AccessoryProduct(
        name="Túi tote nâu",
        image_url="https://example.com/tote.png",
        affiliate_link="https://shop.example.com/tote",
        category="tui-xach",
        style_tags=["casual"],
        occasion_tags=["hang-ngay"],
        tone_tags=["autumn"],
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    assert product.id is not None
    assert product.is_active is True
    assert product.category == "tui-xach"
    assert product.tone_tags == ["autumn"]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend
source venv/bin/activate
pytest tests/domains/accessories/test_models.py -v
```

Expected: FAIL — `app.domains.accessories.models` doesn't exist yet.

- [ ] **Step 3: Implement the model**

Create `backend/app/domains/accessories/__init__.py` (empty file).

Create `backend/app/domains/accessories/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class AccessoryProduct(Base):
    __tablename__ = "accessory_products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    image_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    affiliate_link: Mapped[str] = mapped_column(String(1000), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    style_tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    occasion_tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    tone_tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
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

- [ ] **Step 4: Generate and apply the migration**

Add to `backend/alembic/env.py`, alongside the other domain model imports:

```python
from app.domains.accessories import models as accessories_models  # noqa: F401
```

```bash
alembic revision --autogenerate -m "create accessory_products table"
alembic upgrade head
```

Inspect the generated file under `backend/alembic/versions/` — it should create an `accessory_products` table matching the model above (no foreign keys, no indexes beyond the primary key). Commit it as-is if correct.

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/domains/accessories/test_models.py -v
```

Expected: PASS.

- [ ] **Step 6: Write the failing router test**

Create `backend/tests/domains/accessories/test_router.py`:

```python
VALID_BODY = {
    "name": "Túi tote nâu",
    "imageUrl": "https://example.com/tote.png",
    "affiliateLink": "https://shop.example.com/tote",
    "category": "tui-xach",
    "styleTags": ["casual"],
    "occasionTags": ["hang-ngay"],
    "toneTags": ["autumn"],
}


def _promote_to_admin(db_session, email: str) -> None:
    from app.domains.auth.models import User

    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()


def test_list_accessories_is_public(client):
    response = client.get("/accessories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_accessory_returns_404_when_missing(client):
    response = client.get("/accessories/99999")
    assert response.status_code == 404


def test_create_accessory_requires_authentication(client):
    response = client.post("/accessories", json=VALID_BODY)
    assert response.status_code == 401


def test_create_accessory_requires_admin_role(client):
    client.post(
        "/auth/register", json={"name": "T", "identifier": "accessory-user@example.com", "password": "password123"}
    )
    client.post("/auth/login", json={"identifier": "accessory-user@example.com", "password": "password123"})
    response = client.post("/accessories", json=VALID_BODY)
    assert response.status_code == 403


def test_admin_can_create_get_update_and_delete_accessory(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "identifier": "accessory-admin@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "accessory-admin@example.com")
    client.post("/auth/login", json={"identifier": "accessory-admin@example.com", "password": "password123"})

    create_response = client.post("/accessories", json=VALID_BODY)
    assert create_response.status_code == 201
    accessory_id = create_response.json()["id"]
    assert create_response.json()["isActive"] is True

    get_response = client.get(f"/accessories/{accessory_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Túi tote nâu"

    update_response = client.put(f"/accessories/{accessory_id}", json={**VALID_BODY, "name": "Túi tote đã sửa"})
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Túi tote đã sửa"

    delete_response = client.delete(f"/accessories/{accessory_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/accessories/{accessory_id}").status_code == 404


def test_create_accessory_rejects_an_invalid_category(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "identifier": "accessory-admin2@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "accessory-admin2@example.com")
    client.post("/auth/login", json={"identifier": "accessory-admin2@example.com", "password": "password123"})

    response = client.post("/accessories", json={**VALID_BODY, "category": "not-a-real-category"})
    assert response.status_code == 422


def test_create_accessory_rejects_empty_style_tags(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "identifier": "accessory-admin3@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "accessory-admin3@example.com")
    client.post("/auth/login", json={"identifier": "accessory-admin3@example.com", "password": "password123"})

    response = client.post("/accessories", json={**VALID_BODY, "styleTags": []})
    assert response.status_code == 422
```

- [ ] **Step 7: Run test to verify it fails**

```bash
pytest tests/domains/accessories/test_router.py -v
```

Expected: FAIL — no `/accessories` routes registered yet (404s where 200/201/etc. are expected).

- [ ] **Step 8: Implement schemas, service, and router**

Create `backend/app/domains/accessories/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel
from app.domains.quiz_attempts.schemas import PARENT_SEASONS
from app.domains.wardrobe.schemas import OCCASION_TAGS, STYLE_TAGS

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

    @field_validator("style_tags")
    @classmethod
    def style_tags_valid(cls, value: list[str]) -> list[str]:
        if not value or any(tag not in STYLE_TAGS for tag in value):
            raise ValueError("Tag phong cách không hợp lệ")
        return value

    @field_validator("occasion_tags")
    @classmethod
    def occasion_tags_valid(cls, value: list[str]) -> list[str]:
        if not value or any(tag not in OCCASION_TAGS for tag in value):
            raise ValueError("Tag dịp không hợp lệ")
        return value

    @field_validator("tone_tags")
    @classmethod
    def tone_tags_valid(cls, value: list[str]) -> list[str]:
        if any(tag not in PARENT_SEASONS for tag in value):
            raise ValueError("Tag tone màu không hợp lệ")
        return value


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
```

Note `tone_tags` allows an empty list (unlike `style_tags`/`occasion_tags`) — a product with no season lean (e.g. a plain black clutch) is still recommendable on occasion+style alone; it just never earns the tone-match score bonus (see Task 4).

Create `backend/app/domains/accessories/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.accessories.models import AccessoryProduct
from app.domains.accessories.schemas import AccessoryProductInput


def list_accessories(db: Session) -> list[AccessoryProduct]:
    return db.query(AccessoryProduct).order_by(AccessoryProduct.id.desc()).all()


def get_accessory(db: Session, accessory_id: int) -> AccessoryProduct | None:
    return db.get(AccessoryProduct, accessory_id)


def create_accessory(db: Session, data: AccessoryProductInput) -> AccessoryProduct:
    accessory = AccessoryProduct(**data.model_dump())
    db.add(accessory)
    db.commit()
    db.refresh(accessory)
    return accessory


def update_accessory(db: Session, accessory_id: int, data: AccessoryProductInput) -> AccessoryProduct | None:
    accessory = get_accessory(db, accessory_id)
    if accessory is None:
        return None
    for field, value in data.model_dump().items():
        setattr(accessory, field, value)
    db.commit()
    db.refresh(accessory)
    return accessory


def delete_accessory(db: Session, accessory_id: int) -> bool:
    accessory = get_accessory(db, accessory_id)
    if accessory is None:
        return False
    db.delete(accessory)
    db.commit()
    return True
```

Create `backend/app/domains/accessories/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.accessories import service
from app.domains.accessories.schemas import AccessoryProductInput, AccessoryProductResponse
from app.domains.auth.models import User

router = APIRouter(prefix="/accessories", tags=["accessories"])


@router.get("", response_model=list[AccessoryProductResponse])
def list_accessories(db: Session = Depends(get_db)):
    return service.list_accessories(db)


@router.get("/{accessory_id}", response_model=AccessoryProductResponse)
def get_accessory(accessory_id: int, db: Session = Depends(get_db)):
    accessory = service.get_accessory(db, accessory_id)
    if accessory is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phụ kiện")
    return accessory


@router.post("", response_model=AccessoryProductResponse, status_code=status.HTTP_201_CREATED)
def create_accessory(body: AccessoryProductInput, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return service.create_accessory(db, body)


@router.put("/{accessory_id}", response_model=AccessoryProductResponse)
def update_accessory(
    accessory_id: int,
    body: AccessoryProductInput,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    updated = service.update_accessory(db, accessory_id, body)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phụ kiện")
    return updated


@router.delete("/{accessory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_accessory(accessory_id: int, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    deleted = service.delete_accessory(db, accessory_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phụ kiện")
```

In `backend/app/main.py`, add the import and mount alongside the other routers:

```python
from app.domains.accessories.router import router as accessories_router
```

```python
app.include_router(accessories_router)
```

- [ ] **Step 9: Run test to verify it passes**

```bash
pytest tests/domains/accessories/test_router.py -v
```

Expected: PASS (7 tests).

- [ ] **Step 10: Commit**

```bash
git add app/domains/accessories app/main.py alembic/env.py alembic/versions tests/domains/accessories
git commit -m "feat: add accessories domain with model, migration, and CRUD"
```

---

## Task 2: Gemini auto-tagging client for accessories

**Files:**
- Create: `backend/app/domains/accessories/gemini_client.py`
- Test: `backend/tests/domains/accessories/test_gemini_client.py`

**Interfaces:**
- Consumes: `ACCESSORY_CATEGORIES` from `app/domains/accessories/schemas.py` (Task 1), `STYLE_TAGS`/`OCCASION_TAGS` from `app/domains/wardrobe/schemas.py`, `PARENT_SEASONS` from `app/domains/quiz_attempts/schemas.py`.
- Produces: `suggest_tags(image_bytes: bytes) -> dict` (keys: `category`, `styleTags`, `occasionTags`, `toneTags`) in `app/domains/accessories/gemini_client.py` — consumed by Task 3. Internally calls `_call_gemini(image_bytes) -> str`, the only part tests replace.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/accessories/test_gemini_client.py`:

```python
import json

from app.domains.accessories import gemini_client


def test_suggest_tags_parses_a_clean_json_response(monkeypatch):
    monkeypatch.setattr(
        gemini_client,
        "_call_gemini",
        lambda image_bytes: json.dumps(
            {
                "category": "tui-xach",
                "styleTags": ["casual"],
                "occasionTags": ["hang-ngay"],
                "toneTags": ["autumn"],
            }
        ),
    )

    result = gemini_client.suggest_tags(b"fake-bytes")

    assert result == {
        "category": "tui-xach",
        "styleTags": ["casual"],
        "occasionTags": ["hang-ngay"],
        "toneTags": ["autumn"],
    }


def test_suggest_tags_strips_markdown_code_fences(monkeypatch):
    monkeypatch.setattr(
        gemini_client,
        "_call_gemini",
        lambda image_bytes: (
            '```json\n{"category": "giay", "styleTags": ["formal"], '
            '"occasionTags": ["du-tiec"], "toneTags": []}\n```'
        ),
    )

    result = gemini_client.suggest_tags(b"fake-bytes")

    assert result["category"] == "giay"
    assert result["toneTags"] == []
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/accessories/test_gemini_client.py -v
```

Expected: FAIL — `app.domains.accessories.gemini_client` doesn't exist yet.

- [ ] **Step 3: Implement the client**

Create `backend/app/domains/accessories/gemini_client.py`:

```python
import base64
import json

import httpx

from app.core.config import settings
from app.domains.accessories.schemas import ACCESSORY_CATEGORIES
from app.domains.quiz_attempts.schemas import PARENT_SEASONS
from app.domains.wardrobe.schemas import OCCASION_TAGS, STYLE_TAGS

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent"

PROMPT = (
    "Given this fashion accessory product image, classify it. Respond with "
    "ONLY a JSON object, no other text, in exactly this shape:\n"
    f'{{"category": "<one of {ACCESSORY_CATEGORIES}>", '
    f'"styleTags": [<subset of {STYLE_TAGS}>], '
    f'"occasionTags": [<subset of {OCCASION_TAGS}>], '
    f'"toneTags": [<subset of {PARENT_SEASONS}, the color season(s) this '
    'item suits best, or an empty list if it suits any season>]}}'
)


def _call_gemini(image_bytes: bytes) -> str:
    response = httpx.post(
        GEMINI_URL,
        params={"key": settings.gemini_api_key},
        json={
            "contents": [
                {
                    "parts": [
                        {"text": PROMPT},
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


def suggest_tags(image_bytes: bytes) -> dict:
    raw_text = _call_gemini(image_bytes)
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    return json.loads(cleaned)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/domains/accessories/test_gemini_client.py -v
```

Expected: PASS (2 tests). No real Gemini API call happens — `_call_gemini` was replaced.

- [ ] **Step 5: Commit**

```bash
git add app/domains/accessories/gemini_client.py tests/domains/accessories/test_gemini_client.py
git commit -m "feat: add Gemini auto-tagging client for accessories"
```

---

## Task 3: Upload flow (SAS upload URL + tag suggestion)

**Files:**
- Modify: `backend/app/domains/accessories/router.py`
- Modify: `backend/app/domains/accessories/schemas.py`
- Test: `backend/tests/domains/accessories/test_upload_flow.py`

**Interfaces:**
- Consumes: `generate_upload_sas_url`, `ensure_container`, `download_bytes`, `blob_public_url` from `app/core/blob_storage.py` (already exists); `suggest_tags` from `app/domains/accessories/gemini_client.py` (Task 2).
- Produces: `POST /accessories/upload-url` and `POST /accessories/suggest-tags` routes, both admin-gated.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/accessories/test_upload_flow.py`:

```python
import io
import uuid

from PIL import Image

from app.core.blob_storage import ensure_container, upload_bytes
from app.domains.accessories import router as accessories_router


def _promote_to_admin(db_session, email: str) -> None:
    from app.domains.auth.models import User

    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()


def _login_as_admin(client, db_session, email: str) -> None:
    client.post("/auth/register", json={"name": "Admin", "identifier": email, "password": "password123"})
    _promote_to_admin(db_session, email)
    client.post("/auth/login", json={"identifier": email, "password": "password123"})


def test_upload_url_requires_admin(client):
    response = client.post("/accessories/upload-url")
    assert response.status_code == 401


def test_upload_url_returns_a_writable_sas_url(client, db_session):
    _login_as_admin(client, db_session, "accessory-upload@example.com")

    response = client.post("/accessories/upload-url")

    assert response.status_code == 200
    body = response.json()
    assert "uploadUrl" in body
    assert "sig=" in body["uploadUrl"]
    assert "blobPath" in body


def test_suggest_tags_returns_the_gemini_result_and_blob_url(client, db_session, monkeypatch):
    _login_as_admin(client, db_session, "accessory-suggest@example.com")

    ensure_container("accessories")
    blob_path = f"{uuid.uuid4()}.png"
    buffer = io.BytesIO()
    Image.new("RGB", (16, 16), (255, 0, 0)).save(buffer, format="PNG")
    upload_bytes("accessories", blob_path, buffer.getvalue())

    # Patch the name as bound in the router module (where `from
    # gemini_client import suggest_tags` copied the reference at import
    # time) — patching gemini_client.suggest_tags itself wouldn't affect
    # what the router already imported.
    monkeypatch.setattr(
        accessories_router,
        "suggest_tags",
        lambda image_bytes: {
            "category": "tui-xach",
            "styleTags": ["casual"],
            "occasionTags": ["hang-ngay"],
            "toneTags": ["autumn"],
        },
    )

    response = client.post("/accessories/suggest-tags", json={"blobPath": blob_path})

    assert response.status_code == 200
    body = response.json()
    assert body["category"] == "tui-xach"
    assert body["toneTags"] == ["autumn"]
    assert blob_path in body["blobUrl"]


def test_suggest_tags_falls_back_to_empty_tags_when_gemini_fails(client, db_session, monkeypatch):
    # Gemini is a third-party call that can fail (rate limit, outage,
    # malformed response) independently of the upload itself — the admin
    # must still get the image back to tag by hand rather than a dead end.
    _login_as_admin(client, db_session, "accessory-suggest-2@example.com")

    ensure_container("accessories")
    blob_path = f"{uuid.uuid4()}.png"
    buffer = io.BytesIO()
    Image.new("RGB", (16, 16), (255, 0, 0)).save(buffer, format="PNG")
    upload_bytes("accessories", blob_path, buffer.getvalue())

    def _raise(image_bytes):
        raise ValueError("Gemini returned malformed JSON")

    monkeypatch.setattr(accessories_router, "suggest_tags", _raise)

    response = client.post("/accessories/suggest-tags", json={"blobPath": blob_path})

    assert response.status_code == 200
    body = response.json()
    assert body["category"] == "tui-xach"
    assert body["styleTags"] == []
    assert body["occasionTags"] == []
    assert body["toneTags"] == []
    assert blob_path in body["blobUrl"]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/accessories/test_upload_flow.py -v
```

Expected: FAIL — the two new routes don't exist yet (404). Requires Azurite running: `docker compose up -d azurite`.

- [ ] **Step 3: Implement the routes**

Add to `backend/app/domains/accessories/schemas.py`:

```python
class SuggestTagsRequest(CamelModel):
    blob_path: str
```

Replace the top of `backend/app/domains/accessories/router.py` with:

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.blob_storage import blob_public_url, download_bytes, ensure_container, generate_upload_sas_url
from app.db.session import get_db
from app.deps import require_admin
from app.domains.accessories import service
from app.domains.accessories.gemini_client import suggest_tags
from app.domains.accessories.schemas import (
    ACCESSORY_CATEGORIES,
    AccessoryProductInput,
    AccessoryProductResponse,
    SuggestTagsRequest,
)
from app.domains.auth.models import User

router = APIRouter(prefix="/accessories", tags=["accessories"])

# Gemini can fail independently of the upload (rate limit, outage,
# malformed response) — fall back to an empty-but-valid suggestion so the
# admin still gets the image back to tag by hand, instead of a dead end.
_FALLBACK_SUGGESTION = {
    "category": ACCESSORY_CATEGORIES[0],
    "styleTags": [],
    "occasionTags": [],
    "toneTags": [],
}
```

Add these routes anywhere in the file (after `router = APIRouter(...)`):

```python
@router.post("/upload-url")
def get_upload_url(_admin: User = Depends(require_admin)):
    ensure_container("accessories")
    blob_path = f"{uuid.uuid4()}.png"
    upload_url = generate_upload_sas_url("accessories", blob_path)
    return {"uploadUrl": upload_url, "blobPath": blob_path}


@router.post("/suggest-tags")
def suggest_tags_endpoint(body: SuggestTagsRequest, _admin: User = Depends(require_admin)):
    image_bytes = download_bytes("accessories", body.blob_path)
    try:
        tags = suggest_tags(image_bytes)
    except Exception:  # noqa: BLE001 — any Gemini failure must degrade to the fallback, not 500
        tags = _FALLBACK_SUGGESTION
    return {**tags, "blobUrl": blob_public_url("accessories", body.blob_path)}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/domains/accessories/test_upload_flow.py -v
```

Expected: PASS (4 tests).

- [ ] **Step 5: Run the full accessories test suite so far**

```bash
pytest tests/domains/accessories -v
```

Expected: all tests across Tasks 1-3 PASS.

- [ ] **Step 6: Commit**

```bash
git add app/domains/accessories/router.py app/domains/accessories/schemas.py tests/domains/accessories/test_upload_flow.py
git commit -m "feat: add accessories upload-url and suggest-tags endpoints"
```

---

## Task 4: Recommendation endpoint (scoring, diversity, tone resolution)

**Files:**
- Modify: `backend/app/domains/accessories/service.py`
- Modify: `backend/app/domains/accessories/schemas.py`
- Modify: `backend/app/domains/accessories/router.py`
- Test: `backend/tests/domains/accessories/test_service.py`
- Test: `backend/tests/domains/accessories/test_router.py`

**Interfaces:**
- Consumes: `AccessoryProduct` (Task 1), `QuizAttempt` model (`app.domains.quiz_attempts.models`, already exists — has `.parent_season`, fixed in the tryon domain by commit `0eeff96` on this same branch of work).
- Produces: `service._select_recommendations(products, occasion, style, tone, limit) -> list[AccessoryProduct]` (pure, no DB — the primary unit-test target), `service.recommend(db, occasion, style, tone, limit=6) -> list[AccessoryProduct]`, `GET /accessories/recommendations` route.

- [ ] **Step 1: Write the failing scoring/grouping tests**

Create `backend/tests/domains/accessories/test_service.py`:

```python
from datetime import datetime, timezone

from app.domains.accessories.models import AccessoryProduct
from app.domains.accessories.service import _select_recommendations


def _product(category, style_tags, occasion_tags, tone_tags, created_at) -> AccessoryProduct:
    return AccessoryProduct(
        name="Test",
        image_url="https://example.com/x.png",
        affiliate_link="https://example.com",
        category=category,
        style_tags=style_tags,
        occasion_tags=occasion_tags,
        tone_tags=tone_tags,
        is_active=True,
        created_at=created_at,
    )


def test_picks_the_highest_scoring_product_per_category():
    low = _product("tui-xach", ["casual"], [], [], datetime(2026, 1, 1, tzinfo=timezone.utc))
    high = _product("tui-xach", ["casual"], ["du-tiec"], ["winter"], datetime(2026, 1, 1, tzinfo=timezone.utc))

    result = _select_recommendations([low, high], occasion="du-tiec", style="casual", tone="winter", limit=6)

    assert result == [high]


def test_returns_at_most_one_item_per_category_for_diversity():
    bag = _product("tui-xach", ["formal"], ["du-tiec"], ["winter"], datetime(2026, 1, 1, tzinfo=timezone.utc))
    shoes = _product("giay", ["formal"], ["du-tiec"], ["winter"], datetime(2026, 1, 1, tzinfo=timezone.utc))

    result = _select_recommendations([bag, shoes], occasion="du-tiec", style="formal", tone="winter", limit=6)

    assert {item.category for item in result} == {"tui-xach", "giay"}
    assert len(result) == 2


def test_excludes_a_zero_scoring_category_while_keeping_others():
    matching_bag = _product("tui-xach", ["formal"], ["du-tiec"], ["winter"], datetime(2026, 1, 1, tzinfo=timezone.utc))
    unrelated_shoes = _product("giay", ["street"], ["hang-ngay"], ["summer"], datetime(2026, 1, 1, tzinfo=timezone.utc))

    result = _select_recommendations(
        [matching_bag, unrelated_shoes], occasion="du-tiec", style="formal", tone="winter", limit=6
    )

    assert result == [matching_bag]


def test_falls_back_to_newest_per_category_when_nothing_scores():
    older = _product("giay", ["street"], ["hang-ngay"], ["summer"], datetime(2026, 1, 1, tzinfo=timezone.utc))
    newer = _product("giay", ["street"], ["hang-ngay"], ["summer"], datetime(2026, 6, 1, tzinfo=timezone.utc))

    result = _select_recommendations([older, newer], occasion="du-tiec", style="formal", tone="winter", limit=6)

    assert result == [newer]


def test_ignores_tone_scoring_when_tone_is_none():
    product = _product("tui-xach", ["casual"], ["hang-ngay"], ["winter"], datetime(2026, 1, 1, tzinfo=timezone.utc))

    result = _select_recommendations([product], occasion="hang-ngay", style="casual", tone=None, limit=6)

    assert result == [product]


def test_respects_the_limit_across_categories():
    bag = _product("tui-xach", ["casual"], ["hang-ngay"], [], datetime(2026, 1, 1, tzinfo=timezone.utc))
    shoes = _product("giay", ["casual"], ["hang-ngay"], [], datetime(2026, 1, 1, tzinfo=timezone.utc))
    jewelry = _product("trang-suc", ["casual"], ["hang-ngay"], [], datetime(2026, 1, 1, tzinfo=timezone.utc))

    result = _select_recommendations([bag, shoes, jewelry], occasion="hang-ngay", style="casual", tone=None, limit=2)

    assert len(result) == 2
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/accessories/test_service.py -v
```

Expected: FAIL — `_select_recommendations` doesn't exist yet.

- [ ] **Step 3: Implement the scoring/grouping/fallback logic**

Append to `backend/app/domains/accessories/service.py`:

```python
def _score(product: AccessoryProduct, occasion: str, style: str, tone: str | None) -> int:
    score = 0
    if occasion in product.occasion_tags:
        score += 2
    if tone is not None and tone in product.tone_tags:
        score += 2
    if style in product.style_tags:
        score += 1
    return score


def _select_recommendations(
    products: list[AccessoryProduct], occasion: str, style: str, tone: str | None, limit: int
) -> list[AccessoryProduct]:
    best_by_category: dict[str, tuple[AccessoryProduct, int]] = {}
    for product in products:
        score = _score(product, occasion, style, tone)
        if score <= 0:
            continue
        current = best_by_category.get(product.category)
        if (
            current is None
            or score > current[1]
            or (score == current[1] and product.created_at > current[0].created_at)
        ):
            best_by_category[product.category] = (product, score)

    if not best_by_category:
        # Nothing scored at all (e.g. a freshly-seeded catalog that
        # doesn't cover this occasion/style/tone yet) — surface the
        # newest active item per category instead of an empty section.
        newest_by_category: dict[str, AccessoryProduct] = {}
        for product in products:
            current = newest_by_category.get(product.category)
            if current is None or product.created_at > current.created_at:
                newest_by_category[product.category] = product
        ranked = sorted(newest_by_category.values(), key=lambda item: item.created_at, reverse=True)
        return ranked[:limit]

    ranked = sorted(best_by_category.values(), key=lambda pair: pair[1], reverse=True)
    return [product for product, _matched_score in ranked][:limit]


def recommend(db: Session, occasion: str, style: str, tone: str | None, limit: int = 6) -> list[AccessoryProduct]:
    products = db.query(AccessoryProduct).filter(AccessoryProduct.is_active.is_(True)).all()
    return _select_recommendations(products, occasion, style, tone, limit)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/domains/accessories/test_service.py -v
```

Expected: PASS (6 tests).

- [ ] **Step 5: Write the failing router test for the recommendations endpoint**

Add to `backend/tests/domains/accessories/test_router.py`:

```python
from datetime import datetime, timezone

from app.domains.accessories.models import AccessoryProduct
from app.domains.auth.models import User
from app.domains.quiz_attempts.models import QuizAttempt


def _seed_product(db_session, **overrides) -> AccessoryProduct:
    defaults = dict(
        name="Túi tote nâu",
        image_url="https://example.com/tote.png",
        affiliate_link="https://shop.example.com/tote",
        category="tui-xach",
        style_tags=["casual"],
        occasion_tags=["hang-ngay"],
        tone_tags=["autumn"],
    )
    defaults.update(overrides)
    product = AccessoryProduct(**defaults)
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


def test_recommendations_requires_authentication(client):
    response = client.get("/accessories/recommendations", params={"occasion": "hang-ngay", "style": "casual"})
    assert response.status_code == 401


def test_recommendations_matches_by_occasion_style_and_quiz_tone(client, db_session):
    client.post(
        "/auth/register", json={"name": "T", "identifier": "accessory-rec@example.com", "password": "password123"}
    )
    client.post("/auth/login", json={"identifier": "accessory-rec@example.com", "password": "password123"})

    _seed_product(db_session, category="tui-xach", occasion_tags=["hang-ngay"], style_tags=["casual"], tone_tags=["autumn"])
    _seed_product(db_session, category="giay", occasion_tags=["du-tiec"], style_tags=["formal"], tone_tags=["winter"])

    user = db_session.query(User).filter(User.email == "accessory-rec@example.com").first()
    db_session.add(
        QuizAttempt(
            sub_season="true-autumn",
            parent_season="autumn",
            hue_result="warm",
            value_result="medium",
            chroma_result="bright",
            user_id=user.id,
        )
    )
    db_session.commit()

    response = client.get("/accessories/recommendations", params={"occasion": "hang-ngay", "style": "casual"})

    assert response.status_code == 200
    categories = [item["category"] for item in response.json()]
    assert categories == ["tui-xach"]


def test_recommendations_work_without_a_quiz_attempt(client, db_session):
    client.post(
        "/auth/register", json={"name": "T", "identifier": "accessory-rec-2@example.com", "password": "password123"}
    )
    client.post("/auth/login", json={"identifier": "accessory-rec-2@example.com", "password": "password123"})

    _seed_product(db_session, category="tui-xach", occasion_tags=["hang-ngay"], style_tags=["casual"], tone_tags=["autumn"])

    response = client.get("/accessories/recommendations", params={"occasion": "hang-ngay", "style": "casual"})

    assert response.status_code == 200
    assert len(response.json()) == 1
```

- [ ] **Step 6: Run test to verify it fails**

```bash
pytest tests/domains/accessories/test_router.py -v
```

Expected: FAIL — `/accessories/recommendations` doesn't exist yet (the literal string "recommendations" would otherwise be swallowed by the `/{accessory_id}` route, so this route must be declared **before** the `/{accessory_id}` routes in the next step).

- [ ] **Step 7: Implement the endpoint**

Add to `backend/app/domains/accessories/schemas.py`:

```python
class AccessoryRecommendationResponse(CamelModel):
    id: int
    name: str
    image_url: str
    affiliate_link: str
    category: str
```

Update the imports at the top of `backend/app/domains/accessories/router.py`:

```python
from app.deps import get_current_user, require_admin
from app.domains.accessories.schemas import (
    AccessoryProductInput,
    AccessoryProductResponse,
    AccessoryRecommendationResponse,
    SuggestTagsRequest,
)
from app.domains.quiz_attempts.models import QuizAttempt
```

Add this route **immediately after** `router = APIRouter(...)`, before the `list_accessories`/`get_accessory`/etc. routes defined in Task 1 (a static path must come before a `/{accessory_id}` path that could otherwise be tried first):

```python
@router.get("/recommendations", response_model=list[AccessoryRecommendationResponse])
def get_recommendations(
    occasion: str,
    style: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    latest_attempt = (
        db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).order_by(QuizAttempt.id.desc()).first()
    )
    tone = latest_attempt.parent_season if latest_attempt else None
    return service.recommend(db, occasion, style, tone)
```

- [ ] **Step 8: Run test to verify it passes**

```bash
pytest tests/domains/accessories/test_router.py -v
```

Expected: PASS (10 tests total in this file).

- [ ] **Step 9: Run the full accessories test suite**

```bash
pytest tests/domains/accessories -v
```

Expected: all tests across Tasks 1-4 PASS.

- [ ] **Step 10: Commit**

```bash
git add app/domains/accessories tests/domains/accessories
git commit -m "feat: add accessory recommendation scoring endpoint"
```
