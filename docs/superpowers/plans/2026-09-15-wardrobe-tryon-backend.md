# Wardrobe + Try-On Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new backend domains — `wardrobe` (user-uploaded garment photos, auto-tagged) and `tryon` (async try-on jobs that pick a garment and call the CatVTON service) — to the existing TwistFit FastAPI backend.

**Architecture:** Follows the backend's existing domain-driven pattern exactly (`router.py` / `models.py` / `schemas.py` / `service.py` per domain, Alembic migration per schema change, `CamelModel` for camelCase JSON). Images live in Azure Blob Storage (tested locally against Azurite, not mocks — same "real dependency, not a fake" philosophy the codebase already uses for Postgres). The try-on job table doubles as the async work queue; a background task does garment selection, calls the separately-deployed CatVTON service (see the sibling `2026-09-15-catvton-service.md` plan) over HTTP, and writes the result back.

**Tech Stack:** FastAPI, SQLAlchemy 2.0, Alembic, `azure-storage-blob`, Pillow, `httpx`, Gemini 2.0 Flash (called directly via its REST API through `httpx`, no SDK dependency).

**Spec:** `frontend/docs/superpowers/specs/2026-09-15-virtual-tryon-design.md`

## Global Constraints

- Follow `backend/README.md`'s "Adding a new domain" convention exactly: `models.py` subclasses `app.db.session.Base`; `schemas.py` extends `app.domains.auth.schemas.CamelModel`; `service.py` takes `Session` as an explicit parameter; `router.py` is mounted in `app/main.py`.
- Tests mirror `tests/domains/<name>/` and use the real Postgres test database via the `db_session`/`client` fixtures in `tests/conftest.py` — no SQLite, no DB mocks. Azure Blob Storage calls are tested against a real local Azurite container (same philosophy), not mocked.
- New tables need a migration via `alembic revision --autogenerate -m "..."` after registering the new models in `alembic/env.py`, per the README.
- Protect user-scoped routes with `Depends(app.deps.get_current_user)`.
- `CatalogModel.image` (from the existing `model_catalog` domain) is a relative path into the frontend's static assets today, not a Blob Storage URL — code that fetches it must treat it as an arbitrary HTTP(S) URL, not assume it lives in Blob Storage.
- The user's personal color is `quiz_attempts.season`, one of `spring`/`summer`/`autumn`/`winter` — no 12-way sub-variant is available server-side.
- CatVTON's non-commercial license applies transitively here too (see the CatVTON service plan's constraints) — this whole feature is part of the same non-commercial project.

---

## Task 1: Azure Blob Storage helper (Azurite-backed)

**Files:**
- Create: `backend/app/core/blob_storage.py`
- Test: `backend/tests/core/test_blob_storage.py`
- Create: `backend/tests/core/__init__.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/docker-compose.yml`
- Modify: `backend/requirements.txt`
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `ensure_container(container: str) -> None`, `generate_upload_sas_url(container: str, blob_path: str, expiry_minutes: int = 10) -> str`, `upload_bytes(container: str, blob_path: str, data: bytes, content_type: str = "image/png") -> str`, `download_bytes(container: str, blob_path: str) -> bytes`, `blob_public_url(container: str, blob_path: str) -> str`, and `download_bytes_from_url(url: str) -> bytes` in `app/core/blob_storage.py` — consumed by Tasks 5 and 9.

- [ ] **Step 1: Add the Azurite service and dependency**

Add to `backend/docker-compose.yml` (alongside the existing `db` service):

```yaml
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    command: "azurite-blob --blobHost 0.0.0.0 --blobPort 10000"
    ports:
      - "10000:10000"
```

Append to `backend/requirements.txt`:

```
azure-storage-blob==12.23.0
```

Add to `backend/app/core/config.py`, inside the `Settings` class:

```python
    azure_storage_connection_string: str = (
        "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;"
        "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;"
        "BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"
    )
```

(This default is Azurite's well-known, publicly-documented development
account — safe to commit. Production `.env` on Azure App Service
overrides it with the real Azure Storage connection string.)

Add to `backend/.env.example`:

```
# Local dev default points at Azurite (see docker-compose.yml). Override
# with the real Azure Storage connection string in production.
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;
```

Start Azurite before running tests:

```bash
cd backend && docker compose up -d azurite
```

- [ ] **Step 2: Write the failing test**

Create `backend/tests/core/__init__.py` (empty file).

Create `backend/tests/core/test_blob_storage.py`:

```python
import uuid

import httpx

from app.core.blob_storage import (
    download_bytes,
    download_bytes_from_url,
    ensure_container,
    generate_upload_sas_url,
    upload_bytes,
)

CONTAINER = "test-container"


def test_upload_and_download_round_trip():
    ensure_container(CONTAINER)
    blob_path = f"{uuid.uuid4()}.png"

    url = upload_bytes(CONTAINER, blob_path, b"fake-image-bytes", content_type="image/png")

    assert download_bytes(CONTAINER, blob_path) == b"fake-image-bytes"
    assert blob_path in url


def test_download_bytes_from_url_fetches_over_http():
    ensure_container(CONTAINER)
    blob_path = f"{uuid.uuid4()}.png"
    url = upload_bytes(CONTAINER, blob_path, b"another-blob", content_type="image/png")

    result = download_bytes_from_url(url)

    assert result == b"another-blob"


def test_generate_upload_sas_url_contains_a_signature():
    ensure_container(CONTAINER)
    blob_path = f"{uuid.uuid4()}.png"

    url = generate_upload_sas_url(CONTAINER, blob_path)

    assert blob_path in url
    assert "sig=" in url
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
docker compose up -d azurite
pytest tests/core/test_blob_storage.py -v
```

Expected: FAIL — `app.core.blob_storage` doesn't exist yet.

- [ ] **Step 4: Implement the helper**

Create `backend/app/core/blob_storage.py`:

```python
from datetime import datetime, timedelta, timezone

import httpx
from azure.storage.blob import BlobSasPermissions, BlobServiceClient, ContentSettings, generate_blob_sas

from app.core.config import settings


def _client() -> BlobServiceClient:
    return BlobServiceClient.from_connection_string(settings.azure_storage_connection_string)


def ensure_container(container: str) -> None:
    # public_access="blob" allows anonymous reads of individual blobs (not
    # container listing) — fine here since wardrobe/result images aren't
    # sensitive; writes still require a signed SAS URL (see
    # generate_upload_sas_url).
    client = _client()
    container_client = client.get_container_client(container)
    if not container_client.exists():
        container_client.create_container(public_access="blob")


def blob_public_url(container: str, blob_path: str) -> str:
    return _client().get_blob_client(container=container, blob=blob_path).url


def generate_upload_sas_url(container: str, blob_path: str, expiry_minutes: int = 10) -> str:
    client = _client()
    sas_token = generate_blob_sas(
        account_name=client.account_name,
        container_name=container,
        blob_name=blob_path,
        account_key=client.credential.account_key,
        permission=BlobSasPermissions(write=True, create=True),
        expiry=datetime.now(timezone.utc) + timedelta(minutes=expiry_minutes),
    )
    blob_client = client.get_blob_client(container=container, blob=blob_path)
    return f"{blob_client.url}?{sas_token}"


def upload_bytes(container: str, blob_path: str, data: bytes, content_type: str = "image/png") -> str:
    client = _client()
    blob_client = client.get_blob_client(container=container, blob=blob_path)
    blob_client.upload_blob(data, overwrite=True, content_settings=ContentSettings(content_type=content_type))
    return blob_client.url


def download_bytes(container: str, blob_path: str) -> bytes:
    client = _client()
    blob_client = client.get_blob_client(container=container, blob=blob_path)
    return blob_client.download_blob().readall()


def download_bytes_from_url(url: str) -> bytes:
    response = httpx.get(url, timeout=30.0)
    response.raise_for_status()
    return response.content
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/core/test_blob_storage.py -v
```

Expected: PASS (3 tests). If it fails with a connection error, confirm
`docker compose up -d azurite` succeeded (`docker compose ps`).

- [ ] **Step 6: Commit**

```bash
git add app/core/blob_storage.py tests/core/ app/core/config.py docker-compose.yml requirements.txt .env.example
git commit -m "feat: add Azure Blob Storage helper, tested against Azurite"
```

---

## Task 2: `wardrobe` domain — model, migration, and basic CRUD

**Files:**
- Create: `backend/app/domains/wardrobe/__init__.py`
- Create: `backend/app/domains/wardrobe/models.py`
- Create: `backend/app/domains/wardrobe/schemas.py`
- Create: `backend/app/domains/wardrobe/service.py`
- Create: `backend/app/domains/wardrobe/router.py`
- Modify: `backend/alembic/env.py`
- Create: `backend/alembic/versions/<generated>_create_wardrobe_items_table.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/domains/wardrobe/__init__.py`
- Test: `backend/tests/domains/wardrobe/test_models.py`
- Test: `backend/tests/domains/wardrobe/test_service.py`
- Test: `backend/tests/domains/wardrobe/test_router.py`

**Interfaces:**
- Produces: `WardrobeItem` model (`app/domains/wardrobe/models.py`), `WardrobeItemCreate`/`WardrobeItemResponse` schemas, `service.list_items(db, user_id)`, `service.get_item(db, user_id, item_id)`, `service.create_item(db, user_id, data)` — consumed by Tasks 5, 7, 9.

- [ ] **Step 1: Write the failing model test**

Create `backend/tests/domains/wardrobe/__init__.py` (empty file).

Create `backend/tests/domains/wardrobe/test_models.py`:

```python
from app.core.security import hash_password
from app.domains.auth.models import User
from app.domains.wardrobe.models import WardrobeItem


def test_create_wardrobe_item(db_session):
    user = User(name="Test", email="wardrobe-model@example.com", password_hash=hash_password("password123"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    item = WardrobeItem(
        user_id=user.id,
        blob_url="https://example.com/wardrobe/1.png",
        category="ao-thun",
        style_tags=["casual"],
        occasion_tags=["hang-ngay"],
        dominant_colors=["#ff0000"],
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    assert item.id is not None
    assert item.user_id == user.id
    assert item.style_tags == ["casual"]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/wardrobe/test_models.py -v
```

Expected: FAIL — `app.domains.wardrobe.models` doesn't exist yet.

- [ ] **Step 3: Implement the model**

Create `backend/app/domains/wardrobe/__init__.py` (empty file).

Create `backend/app/domains/wardrobe/models.py`:

```python
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
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    style_tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
    occasion_tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False)
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

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/domains/wardrobe/test_models.py -v
```

Expected: still FAILS at this point with a "relation wardrobe_items does
not exist" error — the table doesn't exist in the test database until
the migration is created and applied next.

- [ ] **Step 5: Generate and apply the migration**

Add to `backend/alembic/env.py`, alongside the other domain model imports:

```python
from app.domains.wardrobe import models as wardrobe_models  # noqa: F401
```

```bash
alembic revision --autogenerate -m "create wardrobe_items table"
alembic upgrade head
```

Inspect the generated file under `backend/alembic/versions/` — it should
create a `wardrobe_items` table matching the model above (columns,
`ix_wardrobe_items_user_id` index, FK to `users.id` with `ondelete='CASCADE'`).
Commit the generated file as-is if correct.

- [ ] **Step 6: Run test to verify it passes**

```bash
pytest tests/domains/wardrobe/test_models.py -v
```

Expected: PASS.

- [ ] **Step 7: Write the failing service test**

Create `backend/tests/domains/wardrobe/test_service.py`:

```python
from app.domains.auth import service as auth_service
from app.domains.wardrobe import service
from app.domains.wardrobe.schemas import WardrobeItemCreate


def test_create_and_list_items_for_a_user(db_session):
    user = auth_service.create_user(db_session, name="Test", email="wardrobe-svc@example.com", password="password123")
    other_user = auth_service.create_user(db_session, name="Other", email="wardrobe-svc-2@example.com", password="password123")

    service.create_item(
        db_session,
        user.id,
        WardrobeItemCreate(
            blob_url="https://example.com/a.png",
            category="ao-thun",
            style_tags=["casual"],
            occasion_tags=["hang-ngay"],
            dominant_colors=["#ff0000"],
        ),
    )
    service.create_item(
        db_session,
        other_user.id,
        WardrobeItemCreate(
            blob_url="https://example.com/b.png",
            category="dam",
            style_tags=["formal"],
            occasion_tags=["du-tiec"],
            dominant_colors=["#0000ff"],
        ),
    )

    items = service.list_items(db_session, user.id)

    assert len(items) == 1
    assert items[0].category == "ao-thun"


def test_get_item_returns_none_for_another_users_item(db_session):
    user = auth_service.create_user(db_session, name="Test", email="wardrobe-svc-3@example.com", password="password123")
    other_user = auth_service.create_user(db_session, name="Other", email="wardrobe-svc-4@example.com", password="password123")
    item = service.create_item(
        db_session,
        other_user.id,
        WardrobeItemCreate(
            blob_url="https://example.com/c.png",
            category="quan-jean",
            style_tags=["street"],
            occasion_tags=["hang-ngay"],
            dominant_colors=["#111111"],
        ),
    )

    assert service.get_item(db_session, user.id, item.id) is None
```

- [ ] **Step 8: Run test to verify it fails**

```bash
pytest tests/domains/wardrobe/test_service.py -v
```

Expected: FAIL — `app.domains.wardrobe.service` and `.schemas` don't
exist yet.

- [ ] **Step 9: Implement schemas and service**

Create `backend/app/domains/wardrobe/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

CATEGORIES = ["ao-thun", "ao-so-mi", "quan-jean", "dam", "ao-khoac"]
STYLE_TAGS = ["casual", "minimalist", "street", "formal"]
OCCASION_TAGS = ["di-lam", "du-tiec", "di-bien", "hang-ngay"]


class WardrobeItemCreate(CamelModel):
    blob_url: str
    category: str
    style_tags: list[str]
    occasion_tags: list[str]
    dominant_colors: list[str]

    @field_validator("category")
    @classmethod
    def category_valid(cls, value: str) -> str:
        if value not in CATEGORIES:
            raise ValueError("Danh mục không hợp lệ")
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


class WardrobeItemResponse(CamelModel):
    id: int
    user_id: int
    blob_url: str
    category: str
    style_tags: list[str]
    occasion_tags: list[str]
    dominant_colors: list[str]
    created_at: datetime
    updated_at: datetime
```

Create `backend/app/domains/wardrobe/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.wardrobe.models import WardrobeItem
from app.domains.wardrobe.schemas import WardrobeItemCreate


def list_items(db: Session, user_id: int) -> list[WardrobeItem]:
    return db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id).order_by(WardrobeItem.id.desc()).all()


def get_item(db: Session, user_id: int, item_id: int) -> WardrobeItem | None:
    return db.query(WardrobeItem).filter(WardrobeItem.id == item_id, WardrobeItem.user_id == user_id).first()


def create_item(db: Session, user_id: int, data: WardrobeItemCreate) -> WardrobeItem:
    item = WardrobeItem(user_id=user_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
```

- [ ] **Step 10: Run test to verify it passes**

```bash
pytest tests/domains/wardrobe/test_service.py -v
```

Expected: PASS (2 tests).

- [ ] **Step 11: Write the failing router test**

Create `backend/tests/domains/wardrobe/test_router.py`:

```python
def _login(client, email: str):
    client.post("/auth/register", json={"name": "Test", "email": email, "password": "password123"})
    client.post("/auth/login", json={"email": email, "password": "password123"})


def test_create_item_requires_authentication(client):
    response = client.post(
        "/wardrobe/items",
        json={
            "blobUrl": "https://example.com/a.png",
            "category": "ao-thun",
            "styleTags": ["casual"],
            "occasionTags": ["hang-ngay"],
            "dominantColors": ["#ff0000"],
        },
    )
    assert response.status_code == 401


def test_create_and_list_items(client):
    _login(client, "wardrobe-router@example.com")

    create_response = client.post(
        "/wardrobe/items",
        json={
            "blobUrl": "https://example.com/a.png",
            "category": "ao-thun",
            "styleTags": ["casual"],
            "occasionTags": ["hang-ngay"],
            "dominantColors": ["#ff0000"],
        },
    )
    assert create_response.status_code == 201

    list_response = client.get("/wardrobe/items")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_create_item_rejects_an_invalid_category(client):
    _login(client, "wardrobe-router-2@example.com")

    response = client.post(
        "/wardrobe/items",
        json={
            "blobUrl": "https://example.com/a.png",
            "category": "not-a-real-category",
            "styleTags": ["casual"],
            "occasionTags": ["hang-ngay"],
            "dominantColors": ["#ff0000"],
        },
    )
    assert response.status_code == 422
```

- [ ] **Step 12: Run test to verify it fails**

```bash
pytest tests/domains/wardrobe/test_router.py -v
```

Expected: FAIL — no `/wardrobe` routes registered yet (404).

- [ ] **Step 13: Implement the router and mount it**

Create `backend/app/domains/wardrobe/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user
from app.domains.auth.models import User
from app.domains.wardrobe import service
from app.domains.wardrobe.schemas import WardrobeItemCreate, WardrobeItemResponse

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
    return service.create_item(db, user.id, body)
```

In `backend/app/main.py`, add the import and mount alongside the other
routers:

```python
from app.domains.wardrobe.router import router as wardrobe_router
```

```python
app.include_router(wardrobe_router)
```

- [ ] **Step 14: Run test to verify it passes**

```bash
pytest tests/domains/wardrobe/test_router.py -v
```

Expected: PASS (3 tests).

- [ ] **Step 15: Commit**

```bash
git add app/domains/wardrobe app/main.py alembic/env.py alembic/versions tests/domains/wardrobe
git commit -m "feat: add wardrobe domain with model, migration, and CRUD"
```

---

## Task 3: Dominant color extraction (pure, no AI)

**Files:**
- Create: `backend/app/domains/wardrobe/color_extraction.py`
- Test: `backend/tests/domains/wardrobe/test_color_extraction.py`
- Modify: `backend/requirements.txt`

**Interfaces:**
- Produces: `extract_dominant_colors(image_bytes: bytes, count: int = 2) -> list[str]` (hex strings) — consumed by Task 5.

- [ ] **Step 1: Add Pillow**

Append to `backend/requirements.txt`:

```
pillow==11.0.0
```

- [ ] **Step 2: Write the failing test**

Create `backend/tests/domains/wardrobe/test_color_extraction.py`:

```python
import io

from PIL import Image

from app.domains.wardrobe.color_extraction import extract_dominant_colors


def _solid_image_bytes(color: tuple[int, int, int]) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (32, 32), color).save(buffer, format="PNG")
    return buffer.getvalue()


def test_extracts_the_dominant_color_of_a_solid_image():
    colors = extract_dominant_colors(_solid_image_bytes((255, 0, 0)), count=1)
    assert colors == ["#ff0000"]


def _two_tone_image_bytes(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> bytes:
    image = Image.new("RGB", (32, 32), top)
    for y in range(16, 32):
        for x in range(32):
            image.putpixel((x, y), bottom)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_returns_the_requested_number_of_colors():
    # A solid-color image only ever has one dominant color, however many
    # are requested — use a genuinely two-toned image here instead.
    colors = extract_dominant_colors(_two_tone_image_bytes((0, 255, 0), (0, 0, 255)), count=2)
    assert len(colors) == 2
    assert all(c.startswith("#") and len(c) == 7 for c in colors)
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pip install -r requirements.txt
pytest tests/domains/wardrobe/test_color_extraction.py -v
```

Expected: FAIL — module doesn't exist yet.

- [ ] **Step 4: Implement color extraction**

Create `backend/app/domains/wardrobe/color_extraction.py`:

```python
import io

from PIL import Image


def extract_dominant_colors(image_bytes: bytes, count: int = 2) -> list[str]:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    quantized = image.quantize(colors=max(count, 8), method=Image.Quantize.MEDIANCUT)
    palette = quantized.getpalette()
    color_counts = sorted(quantized.getcolors(), key=lambda item: item[0], reverse=True)

    colors = []
    for _, index in color_counts[:count]:
        r, g, b = palette[index * 3], palette[index * 3 + 1], palette[index * 3 + 2]
        colors.append(f"#{r:02x}{g:02x}{b:02x}")
    return colors
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/domains/wardrobe/test_color_extraction.py -v
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add app/domains/wardrobe/color_extraction.py tests/domains/wardrobe/test_color_extraction.py requirements.txt
git commit -m "feat: add dominant color extraction via k-means-style quantization"
```

---

## Task 4: Gemini 2.0 Flash garment tagging client

**Files:**
- Create: `backend/app/domains/wardrobe/gemini_client.py`
- Test: `backend/tests/domains/wardrobe/test_gemini_client.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `suggest_tags(image_bytes: bytes) -> dict` (keys: `category`, `styleTags`, `occasionTags`) in `app/domains/wardrobe/gemini_client.py` — consumed by Task 5. Internally calls `_call_gemini(image_bytes) -> str`, which is the only part that makes a real network call and is therefore the only part tests replace.

- [ ] **Step 1: Add the Gemini API key setting**

Add to `backend/app/core/config.py`, inside `Settings`:

```python
    gemini_api_key: str = "dev-only-placeholder-gemini-key"
```

Add to `backend/.env.example`:

```
GEMINI_API_KEY=your-real-gemini-api-key-here
```

- [ ] **Step 2: Write the failing test**

Create `backend/tests/domains/wardrobe/test_gemini_client.py`:

```python
import json

from app.domains.wardrobe import gemini_client


def test_suggest_tags_parses_a_clean_json_response(monkeypatch):
    monkeypatch.setattr(
        gemini_client,
        "_call_gemini",
        lambda image_bytes: json.dumps(
            {"category": "ao-thun", "styleTags": ["casual"], "occasionTags": ["hang-ngay"]}
        ),
    )

    result = gemini_client.suggest_tags(b"fake-bytes")

    assert result == {"category": "ao-thun", "styleTags": ["casual"], "occasionTags": ["hang-ngay"]}


def test_suggest_tags_strips_markdown_code_fences(monkeypatch):
    monkeypatch.setattr(
        gemini_client,
        "_call_gemini",
        lambda image_bytes: '```json\n{"category": "dam", "styleTags": ["formal"], "occasionTags": ["du-tiec"]}\n```',
    )

    result = gemini_client.suggest_tags(b"fake-bytes")

    assert result["category"] == "dam"
    assert result["styleTags"] == ["formal"]
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pytest tests/domains/wardrobe/test_gemini_client.py -v
```

Expected: FAIL — `app.domains.wardrobe.gemini_client` doesn't exist yet.

- [ ] **Step 4: Implement the client**

Create `backend/app/domains/wardrobe/gemini_client.py`:

```python
import base64
import json

import httpx

from app.core.config import settings
from app.domains.wardrobe.schemas import CATEGORIES, OCCASION_TAGS, STYLE_TAGS

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

PROMPT = (
    "Given this clothing image, classify it. Respond with ONLY a JSON "
    "object, no other text, in exactly this shape:\n"
    f'{{"category": "<one of {CATEGORIES}>", '
    f'"styleTags": [<subset of {STYLE_TAGS}>], '
    f'"occasionTags": [<subset of {OCCASION_TAGS}>]}}'
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

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/domains/wardrobe/test_gemini_client.py -v
```

Expected: PASS (2 tests). No real Gemini API call happens in this test —
`_call_gemini` was replaced.

- [ ] **Step 6: Commit**

```bash
git add app/domains/wardrobe/gemini_client.py tests/domains/wardrobe/test_gemini_client.py app/core/config.py .env.example
git commit -m "feat: add Gemini 2.0 Flash garment tagging client"
```

---

## Task 5: Wardrobe upload flow (SAS upload URL + tag suggestion)

**Files:**
- Modify: `backend/app/domains/wardrobe/router.py`
- Test: `backend/tests/domains/wardrobe/test_upload_flow.py`

**Interfaces:**
- Consumes: `generate_upload_sas_url`, `ensure_container`, `download_bytes`, `blob_public_url` from `app/core/blob_storage.py` (Task 1); `extract_dominant_colors` from `app/domains/wardrobe/color_extraction.py` (Task 3); `suggest_tags` from `app/domains/wardrobe/gemini_client.py` (Task 4).
- Produces: `POST /wardrobe/upload-url` and `POST /wardrobe/items/suggest-tags` routes.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/wardrobe/test_upload_flow.py`:

```python
import uuid

from app.core.blob_storage import ensure_container, upload_bytes
from app.domains.wardrobe import router as wardrobe_router


def _login(client, email: str):
    client.post("/auth/register", json={"name": "Test", "email": email, "password": "password123"})
    client.post("/auth/login", json={"email": email, "password": "password123"})


def test_upload_url_requires_authentication(client):
    response = client.post("/wardrobe/upload-url")
    assert response.status_code == 401


def test_upload_url_returns_a_writable_sas_url(client):
    _login(client, "wardrobe-upload@example.com")

    response = client.post("/wardrobe/upload-url")

    assert response.status_code == 200
    body = response.json()
    assert "uploadUrl" in body
    assert "sig=" in body["uploadUrl"]
    assert "blobPath" in body


def test_suggest_tags_combines_gemini_and_color_extraction(client, monkeypatch):
    _login(client, "wardrobe-suggest@example.com")

    ensure_container("wardrobe")
    blob_path = f"{uuid.uuid4()}.png"
    import io

    from PIL import Image

    buffer = io.BytesIO()
    Image.new("RGB", (16, 16), (255, 0, 0)).save(buffer, format="PNG")
    upload_bytes("wardrobe", blob_path, buffer.getvalue())

    # Patch the name as bound in the router module (where `from
    # gemini_client import suggest_tags` copied the reference at import
    # time) — patching gemini_client.suggest_tags itself wouldn't affect
    # what the router already imported.
    monkeypatch.setattr(
        wardrobe_router,
        "suggest_tags",
        lambda image_bytes: {"category": "ao-thun", "styleTags": ["casual"], "occasionTags": ["hang-ngay"]},
    )

    response = client.post("/wardrobe/items/suggest-tags", json={"blobPath": blob_path})

    assert response.status_code == 200
    body = response.json()
    assert body["category"] == "ao-thun"
    assert body["dominantColors"] == ["#ff0000"]
    assert blob_path in body["blobUrl"]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/wardrobe/test_upload_flow.py -v
```

Expected: FAIL — the two new routes don't exist yet (404).

- [ ] **Step 3: Implement the routes**

Add to `backend/app/domains/wardrobe/schemas.py` (schemas live here, not
inline in the router, per the existing convention):

```python
class SuggestTagsRequest(CamelModel):
    blob_path: str
```

Add to `backend/app/domains/wardrobe/router.py` (new imports at the top,
new routes anywhere in the file):

```python
import uuid

from app.core.blob_storage import blob_public_url, download_bytes, ensure_container, generate_upload_sas_url
from app.domains.wardrobe.color_extraction import extract_dominant_colors
from app.domains.wardrobe.gemini_client import suggest_tags
from app.domains.wardrobe.schemas import SuggestTagsRequest
```

```python
@router.post("/upload-url")
def get_upload_url(user: User = Depends(get_current_user)):
    ensure_container("wardrobe")
    blob_path = f"{user.id}/{uuid.uuid4()}.png"
    upload_url = generate_upload_sas_url("wardrobe", blob_path)
    return {"uploadUrl": upload_url, "blobPath": blob_path}


@router.post("/items/suggest-tags")
def suggest_tags_endpoint(body: SuggestTagsRequest, user: User = Depends(get_current_user)):
    image_bytes = download_bytes("wardrobe", body.blob_path)
    tags = suggest_tags(image_bytes)
    colors = extract_dominant_colors(image_bytes)
    return {**tags, "dominantColors": colors, "blobUrl": blob_public_url("wardrobe", body.blob_path)}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/domains/wardrobe/test_upload_flow.py -v
```

Expected: PASS (3 tests).

- [ ] **Step 5: Run the full wardrobe test suite**

```bash
pytest tests/domains/wardrobe -v
```

Expected: all tests across Tasks 2-5 PASS.

- [ ] **Step 6: Commit**

```bash
git add app/domains/wardrobe/router.py tests/domains/wardrobe/test_upload_flow.py
git commit -m "feat: add wardrobe upload-url and suggest-tags endpoints"
```

---

## Task 6: `tryon` domain — model, migration, and job create/get endpoints

**Files:**
- Create: `backend/app/domains/tryon/__init__.py`
- Create: `backend/app/domains/tryon/models.py`
- Create: `backend/app/domains/tryon/schemas.py`
- Create: `backend/app/domains/tryon/service.py`
- Create: `backend/app/domains/tryon/router.py`
- Modify: `backend/alembic/env.py`
- Create: `backend/alembic/versions/<generated>_create_tryon_jobs_table.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/domains/tryon/__init__.py`
- Test: `backend/tests/domains/tryon/test_models.py`
- Test: `backend/tests/domains/tryon/test_router.py`

**Interfaces:**
- Produces: `TryOnJob` model with `status` in `{pending, processing, done, failed}`; `service.create_job(db, user_id, catalog_model_id, occasion, style) -> TryOnJob`; `service.get_job(db, user_id, job_id) -> TryOnJob | None` — consumed by Task 9.

This task deliberately stops short of background processing — a job is
created as `pending` and can be fetched, but nothing advances its status
yet. That's Task 9.

- [ ] **Step 1: Write the failing model test**

Create `backend/tests/domains/tryon/__init__.py` (empty file).

Create `backend/tests/domains/tryon/test_models.py`:

```python
from app.core.security import hash_password
from app.domains.auth.models import User
from app.domains.tryon.models import TryOnJob


def test_create_tryon_job(db_session):
    user = User(name="Test", email="tryon-model@example.com", password_hash=hash_password("password123"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    job = TryOnJob(
        user_id=user.id,
        catalog_model_id=1,
        occasion="hang-ngay",
        style="casual",
        status="pending",
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    assert job.id is not None
    assert job.status == "pending"
    assert job.wardrobe_item_id is None
    assert job.result_blob_url is None
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/tryon/test_models.py -v
```

Expected: FAIL — `app.domains.tryon.models` doesn't exist yet.

- [ ] **Step 3: Implement the model**

Create `backend/app/domains/tryon/__init__.py` (empty file).

Create `backend/app/domains/tryon/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class TryOnJob(Base):
    __tablename__ = "tryon_jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    wardrobe_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("wardrobe_items.id", ondelete="SET NULL"), nullable=True
    )
    catalog_model_id: Mapped[int] = mapped_column(Integer, nullable=False)
    occasion: Mapped[str] = mapped_column(String(100), nullable=False)
    style: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    result_blob_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
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

Add to `backend/alembic/env.py`:

```python
from app.domains.tryon import models as tryon_models  # noqa: F401
```

```bash
alembic revision --autogenerate -m "create tryon_jobs table"
alembic upgrade head
```

Inspect the generated migration for a `tryon_jobs` table with FKs to
`users.id` (CASCADE) and `wardrobe_items.id` (SET NULL) as modeled above.

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/domains/tryon/test_models.py -v
```

Expected: PASS.

- [ ] **Step 6: Write the failing router test**

Create `backend/tests/domains/tryon/test_router.py`:

```python
from app.domains.model_catalog.models import CatalogModel


def _login(client, email: str):
    client.post("/auth/register", json={"name": "Test", "email": email, "password": "password123"})
    client.post("/auth/login", json={"email": email, "password": "password123"})


def _seed_catalog_model(db_session) -> CatalogModel:
    model = CatalogModel(
        name="Test Model",
        image="/outfit/models/test.jpg",
        dossier_image="/outfit/models/test.jpg",
        pose_count=1,
        tagline="Test",
        undertone="warm",
        height="1m70",
        body_shape="Test",
        waist="60cm",
        personal_color="Autumn Warm",
    )
    db_session.add(model)
    db_session.commit()
    db_session.refresh(model)
    return model


def test_create_job_requires_authentication(client):
    response = client.post("/tryon", json={"catalogModelId": 1, "occasion": "hang-ngay", "style": "casual"})
    assert response.status_code == 401


def test_create_job_returns_404_for_an_unknown_catalog_model(client):
    _login(client, "tryon-router@example.com")
    response = client.post("/tryon", json={"catalogModelId": 999999, "occasion": "hang-ngay", "style": "casual"})
    assert response.status_code == 404


def test_create_and_fetch_job(client, db_session):
    _login(client, "tryon-router-2@example.com")
    model = _seed_catalog_model(db_session)

    create_response = client.post(
        "/tryon", json={"catalogModelId": model.id, "occasion": "hang-ngay", "style": "casual"}
    )
    assert create_response.status_code == 201
    job_id = create_response.json()["id"]

    get_response = client.get(f"/tryon/{job_id}")
    assert get_response.status_code == 200
    assert get_response.json()["status"] in ("pending", "processing", "done", "failed")


def test_get_job_404s_for_another_users_job(client, db_session):
    _login(client, "tryon-router-3@example.com")
    model = _seed_catalog_model(db_session)
    create_response = client.post(
        "/tryon", json={"catalogModelId": model.id, "occasion": "hang-ngay", "style": "casual"}
    )
    job_id = create_response.json()["id"]

    client.post("/auth/logout")
    _login(client, "tryon-router-4@example.com")

    response = client.get(f"/tryon/{job_id}")
    assert response.status_code == 404
```

- [ ] **Step 7: Run test to verify it fails**

```bash
pytest tests/domains/tryon/test_router.py -v
```

Expected: FAIL — no `/tryon` routes registered yet.

- [ ] **Step 8: Implement schemas, service, and router**

Create `backend/app/domains/tryon/schemas.py`:

```python
from datetime import datetime

from app.domains.auth.schemas import CamelModel


class TryOnJobCreate(CamelModel):
    catalog_model_id: int
    occasion: str
    style: str


class TryOnJobResponse(CamelModel):
    id: int
    user_id: int
    wardrobe_item_id: int | None
    catalog_model_id: int
    occasion: str
    style: str
    status: str
    result_blob_url: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
```

Create `backend/app/domains/tryon/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.tryon.models import TryOnJob


def create_job(db: Session, user_id: int, catalog_model_id: int, occasion: str, style: str) -> TryOnJob:
    job = TryOnJob(
        user_id=user_id,
        catalog_model_id=catalog_model_id,
        occasion=occasion,
        style=style,
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_job(db: Session, user_id: int, job_id: int) -> TryOnJob | None:
    return db.query(TryOnJob).filter(TryOnJob.id == job_id, TryOnJob.user_id == user_id).first()
```

Create `backend/app/domains/tryon/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user
from app.domains.auth.models import User
from app.domains.model_catalog.models import CatalogModel
from app.domains.tryon import service
from app.domains.tryon.schemas import TryOnJobCreate, TryOnJobResponse

router = APIRouter(prefix="/tryon", tags=["tryon"])


@router.post("", response_model=TryOnJobResponse, status_code=status.HTTP_201_CREATED)
def create_tryon_job(body: TryOnJobCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    catalog_model = db.get(CatalogModel, body.catalog_model_id)
    if catalog_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy model")

    return service.create_job(db, user.id, body.catalog_model_id, body.occasion, body.style)


@router.get("/{job_id}", response_model=TryOnJobResponse)
def get_tryon_job(job_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    job = service.get_job(db, user.id, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy job")
    return job
```

In `backend/app/main.py`:

```python
from app.domains.tryon.router import router as tryon_router
```

```python
app.include_router(tryon_router)
```

- [ ] **Step 9: Run test to verify it passes**

```bash
pytest tests/domains/tryon/test_router.py -v
```

Expected: PASS (4 tests).

- [ ] **Step 10: Commit**

```bash
git add app/domains/tryon app/main.py alembic/env.py alembic/versions tests/domains/tryon
git commit -m "feat: add tryon domain with job model and create/get endpoints"
```

---

## Task 7: Garment selection algorithm

**Files:**
- Create: `backend/app/domains/wardrobe/season_palettes.py`
- Create: `backend/app/domains/tryon/garment_selection.py`
- Test: `backend/tests/domains/tryon/test_garment_selection.py`

**Interfaces:**
- Produces: `SEASON_REFERENCE_COLORS: dict[str, list[str]]` in `app/domains/wardrobe/season_palettes.py`; `select_best_matching_item(items: list[WardrobeItem], season: str) -> WardrobeItem | None` in `app/domains/tryon/garment_selection.py` — consumed by Task 9.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/tryon/test_garment_selection.py`:

```python
from app.domains.tryon.garment_selection import select_best_matching_item
from app.domains.wardrobe.models import WardrobeItem


def _item(colors: list[str]) -> WardrobeItem:
    return WardrobeItem(
        user_id=1,
        blob_url="https://example.com/x.png",
        category="ao-thun",
        style_tags=["casual"],
        occasion_tags=["hang-ngay"],
        dominant_colors=colors,
    )


def test_picks_the_item_closest_to_the_season_palette():
    orange_item = _item(["#F2A93B"])  # an exact spring-warm color
    navy_item = _item(["#000080"])  # far from every spring color

    best = select_best_matching_item([navy_item, orange_item], "spring")

    assert best is orange_item


def test_returns_none_for_an_empty_list():
    assert select_best_matching_item([], "spring") is None


def test_falls_back_to_the_first_item_for_an_unknown_season():
    item = _item(["#ffffff"])
    assert select_best_matching_item([item], "not-a-season") is item
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/tryon/test_garment_selection.py -v
```

Expected: FAIL — modules don't exist yet.

- [ ] **Step 3: Add the mirrored season palette data**

Create `backend/app/domains/wardrobe/season_palettes.py`:

```python
# Mirrors frontend/lib/palettes.ts's 12 palettes, grouped by season
# (union of that season's 3 sub-variants). The frontend TypeScript file
# is the source of truth for these colors — if it changes, update this
# file to match by hand (the two runtimes can't share a module).

SEASON_REFERENCE_COLORS: dict[str, list[str]] = {
    "spring": [
        "#F2A93B", "#F4C542", "#8FC93A", "#E8622C", "#C23B3B", "#B23A6B", "#6C4FA0", "#3F7FBF", "#2FA6A0", "#4AA648",
        "#F6D65A", "#F2A6C4", "#8FD1E0", "#A6D96A", "#F2B84B", "#E88A9A", "#B7DC8F", "#6FB5D9", "#9E7FC9", "#F0E48A",
        "#3EC77A", "#F5E23E", "#F2A93B", "#E8452C", "#D6336C", "#7B3FA0", "#2F6FE0", "#1FB6C9", "#4ADE80", "#F5D742",
    ],
    "summer": [
        "#3F7F9E", "#5B9BD5", "#6FB7C9", "#8B6CA8", "#C2568F", "#7A8FC2", "#5FA0A0", "#4A6FA5", "#9E6FA0", "#3F5F8F",
        "#A9D4E0", "#C9A9D4", "#F2C6D6", "#B7D9A9", "#9EC9E0", "#D4B7E0", "#A9E0C6", "#E0C9A9", "#C6A9E0", "#9ED4C9",
        "#8A7F6A", "#9E8FA0", "#7F8F7A", "#A08F7F", "#6A7F8F", "#8F7A8A", "#7F9E9E", "#9E7F7A", "#6A8A7F", "#8F8A6A",
    ],
    "autumn": [
        "#2F8F6A", "#D9822B", "#B2481C", "#8F3F2F", "#2F6F5A", "#C9A22B", "#7A3F1C", "#4F7F3F", "#B2601C", "#2F5F4F",
        "#1F5F5A", "#6F1F2F", "#8F4F1F", "#2F4F1F", "#4F2F1F", "#7F5F1F", "#1F3F3F", "#5F1F3F", "#3F5F2F", "#6F3F1F",
        "#8F7A5F", "#9E8F6A", "#7A8F6A", "#8F6A5F", "#6A7A5F", "#9E7A6A", "#7F8F7F", "#8A7A6F", "#6F8A7A", "#9E8A7F",
    ],
    "winter": [
        "#1F3F6F", "#2F5F8F", "#0F6F6F", "#3F2F6F", "#6F1F4F", "#1F4F8F", "#4F1F6F", "#0F4F5F", "#2F1F5F", "#1F6F8F",
        "#0F1F4F", "#3F0F2F", "#4F0F3F", "#0F3F3F", "#2F0F4F", "#4F0F1F", "#0F2F4F", "#3F0F4F", "#1F0F3F", "#0F4F2F",
        "#2F6FE0", "#D6336C", "#F5E23E", "#7B3FA0", "#0FBF9F", "#E0247A", "#3EC77A", "#2F2FE0", "#F5D742", "#C71585",
    ],
}
```

- [ ] **Step 4: Implement the selection algorithm**

Create `backend/app/domains/tryon/garment_selection.py`:

```python
from app.domains.wardrobe.models import WardrobeItem
from app.domains.wardrobe.season_palettes import SEASON_REFERENCE_COLORS


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    value = hex_color.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def _color_distance(hex_a: str, hex_b: str) -> float:
    ra, ga, ba = _hex_to_rgb(hex_a)
    rb, gb, bb = _hex_to_rgb(hex_b)
    return ((ra - rb) ** 2 + (ga - gb) ** 2 + (ba - bb) ** 2) ** 0.5


def select_best_matching_item(items: list[WardrobeItem], season: str) -> WardrobeItem | None:
    if not items:
        return None

    reference_colors = SEASON_REFERENCE_COLORS.get(season)
    if not reference_colors:
        return items[0]

    def item_score(item: WardrobeItem) -> float:
        return min(
            (_color_distance(c, ref) for c in item.dominant_colors for ref in reference_colors),
            default=float("inf"),
        )

    return min(items, key=item_score)
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/domains/tryon/test_garment_selection.py -v
```

Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add app/domains/wardrobe/season_palettes.py app/domains/tryon/garment_selection.py tests/domains/tryon/test_garment_selection.py
git commit -m "feat: add color-distance garment selection against season palettes"
```

---

## Task 8: CatVTON HTTP client

**Files:**
- Create: `backend/app/domains/tryon/catvton_client.py`
- Test: `backend/tests/domains/tryon/test_catvton_client.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `call_catvton_service(person_bytes: bytes, garment_bytes: bytes, cloth_type: str) -> bytes` — consumed by Task 9. Calls the service built in the sibling `2026-09-15-catvton-service.md` plan.

- [ ] **Step 1: Add CatVTON service settings**

Add to `backend/app/core/config.py`, inside `Settings`:

```python
    catvton_service_url: str = "http://localhost:8001"
    catvton_api_key: str = "dev-only-placeholder-catvton-key"
```

Add to `backend/.env.example`:

```
# Update these after starting the Vast.ai instance (see catvton-service/README.md)
CATVTON_SERVICE_URL=http://<vast-ai-public-ip>:<mapped-port>
CATVTON_API_KEY=<the secret set on the Vast.ai instance>
```

- [ ] **Step 2: Write the failing test**

Create `backend/tests/domains/tryon/test_catvton_client.py`:

```python
import httpx
import pytest

from app.core.config import settings
from app.domains.tryon.catvton_client import call_catvton_service


def test_call_catvton_service_sends_the_api_key_and_returns_bytes(monkeypatch):
    captured = {}

    def fake_post(url, headers=None, files=None, data=None, timeout=None):
        captured["url"] = url
        captured["headers"] = headers
        captured["data"] = data
        return httpx.Response(200, content=b"fake-result-bytes", request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)

    result = call_catvton_service(b"person-bytes", b"garment-bytes", "upper")

    assert result == b"fake-result-bytes"
    assert captured["url"].endswith("/generate")
    assert captured["headers"]["X-API-Key"] == settings.catvton_api_key
    assert captured["data"]["cloth_type"] == "upper"


def test_call_catvton_service_raises_on_error_status(monkeypatch):
    def fake_post(url, headers=None, files=None, data=None, timeout=None):
        return httpx.Response(500, content=b"error", request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)

    with pytest.raises(httpx.HTTPStatusError):
        call_catvton_service(b"person-bytes", b"garment-bytes", "upper")
```

- [ ] **Step 3: Run test to verify it fails**

```bash
pytest tests/domains/tryon/test_catvton_client.py -v
```

Expected: FAIL — module doesn't exist yet.

- [ ] **Step 4: Implement the client**

Create `backend/app/domains/tryon/catvton_client.py`:

```python
import httpx

from app.core.config import settings


def call_catvton_service(person_bytes: bytes, garment_bytes: bytes, cloth_type: str) -> bytes:
    response = httpx.post(
        f"{settings.catvton_service_url}/generate",
        headers={"X-API-Key": settings.catvton_api_key},
        files={
            "person_image": ("person.png", person_bytes, "image/png"),
            "garment_image": ("garment.png", garment_bytes, "image/png"),
        },
        data={"cloth_type": cloth_type},
        timeout=60.0,
    )
    response.raise_for_status()
    return response.content
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/domains/tryon/test_catvton_client.py -v
```

Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add app/domains/tryon/catvton_client.py tests/domains/tryon/test_catvton_client.py app/core/config.py .env.example
git commit -m "feat: add CatVTON service HTTP client"
```

---

## Task 9: Background job orchestration

**Files:**
- Modify: `backend/app/domains/tryon/service.py`
- Modify: `backend/app/domains/tryon/router.py`
- Test: `backend/tests/domains/tryon/test_process_job.py`

**Interfaces:**
- Consumes: `select_best_matching_item` (Task 7), `call_catvton_service` (Task 8), `download_bytes_from_url`/`upload_bytes` (Task 1).
- Produces: `process_job(db: Session, job_id: int, season: str, catalog_model_image_url: str) -> None` in `app/domains/tryon/service.py` — a plain function taking an explicit `Session`, so it's directly callable both from tests (with `db_session`) and from the router's background-task wrapper (with a fresh session).

A FastAPI `BackgroundTasks`-scheduled function must **not** reuse the
request's `db` session — by the time a background task runs, the
`get_db` dependency has already closed it (this is a documented FastAPI
gotcha, not a hypothetical). `process_job` itself takes `db` as a
parameter and stays fully testable; only the thin wrapper the router
schedules opens a fresh session.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/tryon/test_process_job.py`:

```python
from app.domains.auth import service as auth_service
from app.domains.tryon import service as tryon_service
from app.domains.tryon.models import TryOnJob
from app.domains.wardrobe import service as wardrobe_service
from app.domains.wardrobe.schemas import WardrobeItemCreate


def test_process_job_completes_successfully(db_session, monkeypatch):
    user = auth_service.create_user(db_session, name="Test", email="process-job@example.com", password="password123")
    wardrobe_service.create_item(
        db_session,
        user.id,
        WardrobeItemCreate(
            blob_url="https://example.com/garment.png",
            category="ao-thun",
            style_tags=["casual"],
            occasion_tags=["hang-ngay"],
            dominant_colors=["#F2A93B"],
        ),
    )
    job = tryon_service.create_job(db_session, user.id, catalog_model_id=1, occasion="hang-ngay", style="casual")

    monkeypatch.setattr(tryon_service, "download_bytes_from_url", lambda url: b"fake-image-bytes")
    monkeypatch.setattr(tryon_service, "call_catvton_service", lambda person, garment, cloth_type: b"result-bytes")
    monkeypatch.setattr(tryon_service, "upload_bytes", lambda container, path, data, content_type="image/png": "https://example.com/results/1.png")

    tryon_service.process_job(db_session, job.id, season="spring", catalog_model_image_url="https://example.com/model.png")

    updated = db_session.get(TryOnJob, job.id)
    assert updated.status == "done"
    assert updated.result_blob_url == "https://example.com/results/1.png"
    assert updated.wardrobe_item_id is not None


def test_process_job_marks_failed_when_no_matching_item_exists(db_session):
    user = auth_service.create_user(db_session, name="Test", email="process-job-2@example.com", password="password123")
    job = tryon_service.create_job(db_session, user.id, catalog_model_id=1, occasion="du-tiec", style="formal")

    tryon_service.process_job(db_session, job.id, season="spring", catalog_model_image_url="https://example.com/model.png")

    updated = db_session.get(TryOnJob, job.id)
    assert updated.status == "failed"
    assert updated.error_message is not None
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/tryon/test_process_job.py -v
```

Expected: FAIL — `tryon_service.process_job` doesn't exist yet.

- [ ] **Step 3: Implement `process_job` and the router wrapper**

Add to `backend/app/domains/tryon/service.py` (new imports at the top,
new function appended):

```python
from app.core.blob_storage import download_bytes_from_url, upload_bytes
from app.domains.tryon.catvton_client import call_catvton_service
from app.domains.tryon.garment_selection import select_best_matching_item
from app.domains.wardrobe.models import WardrobeItem
```

```python
def process_job(db: Session, job_id: int, season: str, catalog_model_image_url: str) -> None:
    job = db.get(TryOnJob, job_id)
    if job is None:
        return

    job.status = "processing"
    db.commit()

    try:
        candidates = (
            db.query(WardrobeItem)
            .filter(
                WardrobeItem.user_id == job.user_id,
                WardrobeItem.occasion_tags.contains([job.occasion]),
                WardrobeItem.style_tags.contains([job.style]),
            )
            .all()
        )
        selected = select_best_matching_item(candidates, season)
        if selected is None:
            raise ValueError("Không tìm thấy món đồ phù hợp trong tủ đồ cho dịp/phong cách này")

        job.wardrobe_item_id = selected.id
        db.commit()

        garment_bytes = download_bytes_from_url(selected.blob_url)
        person_bytes = download_bytes_from_url(catalog_model_image_url)

        result_bytes = call_catvton_service(person_bytes, garment_bytes, "upper")

        result_url = upload_bytes("results", f"{job.user_id}/{job.id}.png", result_bytes)

        job.result_blob_url = result_url
        job.status = "done"
        db.commit()
    except Exception as error:  # noqa: BLE001 — any failure here must land the job in `failed`, not crash the background task
        job.status = "failed"
        job.error_message = str(error)
        db.commit()
```

Modify `backend/app/domains/tryon/router.py` to schedule processing with
its own fresh session:

```python
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.db.session import SessionLocal
from app.domains.auth.models import User
from app.domains.quiz_attempts.models import QuizAttempt
```

```python
def _process_job_with_fresh_session(job_id: int, season: str, catalog_model_image_url: str) -> None:
    db = SessionLocal()
    try:
        service.process_job(db, job_id, season, catalog_model_image_url)
    finally:
        db.close()


@router.post("", response_model=TryOnJobResponse, status_code=status.HTTP_201_CREATED)
def create_tryon_job(
    body: TryOnJobCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    catalog_model = db.get(CatalogModel, body.catalog_model_id)
    if catalog_model is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy model")

    latest_attempt = (
        db.query(QuizAttempt).filter(QuizAttempt.user_id == user.id).order_by(QuizAttempt.id.desc()).first()
    )
    season = latest_attempt.season if latest_attempt else "spring"

    job = service.create_job(db, user.id, body.catalog_model_id, body.occasion, body.style)
    background_tasks.add_task(_process_job_with_fresh_session, job.id, season, catalog_model.image)
    return job
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/domains/tryon/test_process_job.py -v
```

Expected: PASS (2 tests).

- [ ] **Step 5: Run the full backend test suite**

```bash
cd backend && pytest -v
```

Expected: every test across both this plan and the pre-existing backend
passes.

- [ ] **Step 6: Commit**

```bash
git add app/domains/tryon/service.py app/domains/tryon/router.py tests/domains/tryon/test_process_job.py
git commit -m "feat: wire background job orchestration into try-on creation"
```

---

## Task 10: Manual end-to-end verification

**Files:** none — verification only, since it requires the real Gemini
API, real Azure Blob Storage, and the real CatVTON service (Vast.ai)
running together, none of which are available in an automated test run.

- [ ] **Step 1: Configure real credentials**

Set real values for `GEMINI_API_KEY`, `AZURE_STORAGE_CONNECTION_STRING`
(pointing at a real Azure Storage account, not Azurite),
`CATVTON_SERVICE_URL`, and `CATVTON_API_KEY` (from the deployed
CatVTON service — see the sibling plan) in the backend's `.env` (local)
or Azure App Service configuration (deployed).

- [ ] **Step 2: Upload a wardrobe item through the real flow**

Via the frontend or `curl`/HTTPie against the running backend: call
`POST /wardrobe/upload-url`, PUT an actual clothing photo to the
returned `uploadUrl`, then `POST /wardrobe/items/suggest-tags` with the
returned `blobPath`. Confirm Gemini returns a plausible category/tags
for the photo and the dominant color looks right, then `POST
/wardrobe/items` to persist it with tags matching an occasion/style
you'll try later (e.g. `occasionTags: ["hang-ngay"]`,
`styleTags: ["casual"]`).

- [ ] **Step 3: Run a real try-on job**

`POST /tryon` with a real `catalogModelId` (from `GET /model-catalog`)
and matching `occasion`/`style`. Poll `GET /tryon/{id}` every few
seconds. Confirm it reaches `status: "done"` within roughly the time
CatVTON takes per generation (tens of seconds), and that
`resultBlobUrl` points to a real, viewable composited image.

- [ ] **Step 4: Verify the failure path**

Run a `POST /tryon` with an `occasion`/`style` combination that matches
no wardrobe item. Confirm the job reaches `status: "failed"` with a
clear `errorMessage`, rather than hanging in `processing` or crashing
the server.
