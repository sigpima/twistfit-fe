# Outfit Wiring — Backend Additions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the three small backend pieces the outfit wizard frontend needs before it can be wired to real APIs: reading back a user's personal-color result, a second per-model photo for the pose choice, and a `pose` field on try-on job creation.

**Architecture:** Three independent additions to already-existing domains (`quiz_attempts`, `model_catalog`, `tryon`), each following the domain's existing model/schema/service/router/test shape exactly. No new domains, no new tables — one new column each on `catalog_models` and `tryon_jobs`.

**Spec:** `frontend/docs/superpowers/specs/2026-09-15-outfit-wizard-api-wiring-design.md`

## Global Constraints

- Follow `backend/README.md`'s existing domain conventions: `models.py` (SQLAlchemy), `schemas.py` (`CamelModel` for camelCase JSON), `service.py` (plain functions taking `Session`), `router.py` (FastAPI routes).
- Tests use the real Postgres test database via `db_session`/`client` fixtures — no mocks.
- New columns need `alembic revision --autogenerate` after registering nothing new in `alembic/env.py` (these are column additions to already-registered models, not new tables).
- Current Alembic head is `005a8816383c` — new migrations chain after it.
- Protect authenticated routes with `Depends(app.deps.get_current_user)`.

---

## Task 1: `GET /quiz-attempts/me`

**Files:**
- Modify: `backend/app/domains/quiz_attempts/schemas.py`
- Modify: `backend/app/domains/quiz_attempts/service.py`
- Modify: `backend/app/domains/quiz_attempts/router.py`
- Test: `backend/tests/domains/quiz_attempts/test_service.py`
- Test: `backend/tests/domains/quiz_attempts/test_router.py`

**Interfaces:**
- Produces: `service.get_latest_attempt(db: Session, user_id: int) -> QuizAttempt | None` and `GET /quiz-attempts/me` returning `QuizAttemptResponse | null` — consumed by the frontend wiring plan's personal-color check.

- [ ] **Step 1: Write the failing service test**

Add to `backend/tests/domains/quiz_attempts/test_service.py` (create the file if it doesn't exist yet, matching the existing `service.py` test conventions used elsewhere in this codebase):

```python
from app.domains.auth import service as auth_service
from app.domains.quiz_attempts import service


def test_get_latest_attempt_returns_none_when_the_user_has_no_attempts(db_session):
    user = auth_service.create_user(db_session, name="Test", email="quiz-latest-1@example.com", password="password123")
    assert service.get_latest_attempt(db_session, user.id) is None


def test_get_latest_attempt_returns_the_most_recent_one(db_session):
    user = auth_service.create_user(db_session, name="Test", email="quiz-latest-2@example.com", password="password123")
    service.create_quiz_attempt(db_session, "spring", user.id)
    latest = service.create_quiz_attempt(db_session, "winter", user.id)

    result = service.get_latest_attempt(db_session, user.id)

    assert result is not None
    assert result.id == latest.id
    assert result.season == "winter"


def test_get_latest_attempt_ignores_other_users_attempts(db_session):
    user = auth_service.create_user(db_session, name="Test", email="quiz-latest-3@example.com", password="password123")
    other_user = auth_service.create_user(db_session, name="Other", email="quiz-latest-4@example.com", password="password123")
    service.create_quiz_attempt(db_session, "summer", other_user.id)

    assert service.get_latest_attempt(db_session, user.id) is None
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && source venv/bin/activate
pytest tests/domains/quiz_attempts/test_service.py -v
```

Expected: FAIL — `service.get_latest_attempt` doesn't exist yet.

- [ ] **Step 3: Implement the service function**

Add to `backend/app/domains/quiz_attempts/service.py`:

```python
def get_latest_attempt(db: Session, user_id: int) -> QuizAttempt | None:
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.id.desc())
        .first()
    )
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/domains/quiz_attempts/test_service.py -v
```

Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing router test**

Add to `backend/tests/domains/quiz_attempts/test_router.py`:

```python
def test_get_me_requires_authentication(client):
    response = client.get("/quiz-attempts/me")
    assert response.status_code == 401


def test_get_me_returns_null_when_no_attempt_exists(client):
    client.post("/auth/register", json={"name": "Test", "email": "quiz-me-1@example.com", "password": "password123"})
    client.post("/auth/login", json={"email": "quiz-me-1@example.com", "password": "password123"})

    response = client.get("/quiz-attempts/me")

    assert response.status_code == 200
    assert response.json() is None


def test_get_me_returns_the_latest_attempt(client):
    client.post("/auth/register", json={"name": "Test", "email": "quiz-me-2@example.com", "password": "password123"})
    client.post("/auth/login", json={"email": "quiz-me-2@example.com", "password": "password123"})

    client.post("/quiz-attempts", json={"season": "spring"})
    client.post("/quiz-attempts", json={"season": "autumn"})

    response = client.get("/quiz-attempts/me")

    assert response.status_code == 200
    assert response.json()["season"] == "autumn"
```

- [ ] **Step 6: Run test to verify it fails**

```bash
pytest tests/domains/quiz_attempts/test_router.py -v
```

Expected: FAIL — `/quiz-attempts/me` route doesn't exist (404, or matched by the `POST ""` route mismatch — either way, not 401/200 as expected).

- [ ] **Step 7: Implement the route**

Modify `backend/app/domains/quiz_attempts/router.py`:

```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user, get_current_user_optional
from app.domains.auth.models import User
from app.domains.quiz_attempts import service
from app.domains.quiz_attempts.schemas import QuizAttemptCreate, QuizAttemptResponse

router = APIRouter(prefix="/quiz-attempts", tags=["quiz-attempts"])


@router.post("", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
def create_attempt(
    body: QuizAttemptCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    return service.create_quiz_attempt(db, body.season, user.id if user else None)


@router.get("/me", response_model=QuizAttemptResponse | None)
def get_my_latest_attempt(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return service.get_latest_attempt(db, user.id)
```

Note the route order: FastAPI matches `/me` correctly here because it's a distinct literal path, not a `{param}` route — no ordering conflict with the `POST ""` route.

- [ ] **Step 8: Run test to verify it passes**

```bash
pytest tests/domains/quiz_attempts/test_router.py -v
```

Expected: PASS (all tests in the file, including the 4 pre-existing ones).

- [ ] **Step 9: Commit**

```bash
git add app/domains/quiz_attempts/service.py app/domains/quiz_attempts/router.py tests/domains/quiz_attempts/test_service.py tests/domains/quiz_attempts/test_router.py
git commit -m "feat: add GET /quiz-attempts/me to read back the user's latest result"
```

---

## Task 2: `CatalogModel.side_image`

**Files:**
- Modify: `backend/app/domains/model_catalog/models.py`
- Modify: `backend/app/domains/model_catalog/schemas.py`
- Modify: `backend/app/domains/model_catalog/seed.py`
- Create: `backend/alembic/versions/<generated>_add_side_image_to_catalog_models.py`
- Test: `backend/tests/domains/model_catalog/test_seed.py`

**Interfaces:**
- Produces: `CatalogModel.side_image: str | None` column and `CatalogModelResponse.side_image: str | None` (→ `sideImage` in JSON) — consumed by Task 3 and the frontend wiring plan.

- [ ] **Step 1: Write the failing seed test**

Modify `backend/tests/domains/model_catalog/test_seed.py`, adding an assertion to the existing test:

```python
def test_seed_demo_models_creates_twelve_models(db_session):
    seed_demo_models(db_session)
    models = db_session.query(CatalogModel).order_by(CatalogModel.id.asc()).all()
    assert len(models) == 12
    assert models[0].name == "Carmen"
    assert models[0].undertone == "neutral"
    assert models[0].side_image == models[0].image
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/model_catalog/test_seed.py -v
```

Expected: FAIL — `CatalogModel` has no `side_image` attribute yet.

- [ ] **Step 3: Add the column to the model**

Modify `backend/app/domains/model_catalog/models.py`, adding the field after `dossier_image`:

```python
    dossier_image: Mapped[str] = mapped_column(String(500), nullable=False)
    side_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
```

- [ ] **Step 4: Add it to the response schema**

Modify `backend/app/domains/model_catalog/schemas.py`, adding to `CatalogModelResponse`:

```python
class CatalogModelResponse(CamelModel):
    id: int
    name: str
    image: str
    dossier_image: str
    side_image: str | None
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

(`CatalogModelInput`, used by the admin create/update endpoints, is intentionally left unchanged — out of scope per the spec.)

- [ ] **Step 5: Update the seed data**

Modify `backend/app/domains/model_catalog/seed.py`'s `seed_demo_models` to set `side_image` equal to `image` for every demo model as a placeholder, without hand-editing all 12 dict literals:

```python
def seed_demo_models(db: Session) -> None:
    if db.query(CatalogModel).count() > 0:
        return
    for model in DEMO_MODELS:
        db.add(CatalogModel(**model, side_image=model["image"]))
    db.commit()
```

- [ ] **Step 6: Generate and apply the migration**

```bash
alembic revision --autogenerate -m "add side_image to catalog_models"
```

Inspect the generated file — it should be a single `op.add_column('catalog_models', sa.Column('side_image', sa.String(length=500), nullable=True))` with a matching `op.drop_column` in `downgrade()`, chained after `005a8816383c`. Then:

```bash
alembic upgrade head
```

- [ ] **Step 7: Run test to verify it passes**

```bash
pytest tests/domains/model_catalog/test_seed.py -v
```

Expected: PASS (both tests in the file).

- [ ] **Step 8: Run the full model_catalog test suite to check for regressions**

```bash
pytest tests/domains/model_catalog -v
```

Expected: all tests pass — `CatalogModelResponse` gaining a field doesn't break the existing `test_router.py`/`test_service.py` assertions since they check specific fields, not exact response equality.

- [ ] **Step 9: Commit**

```bash
git add app/domains/model_catalog alembic/versions tests/domains/model_catalog/test_seed.py
git commit -m "feat: add side_image column to catalog_models for pose-based rendering"
```

---

## Task 3: `POST /tryon` gains `pose`

**Files:**
- Modify: `backend/app/domains/tryon/models.py`
- Modify: `backend/app/domains/tryon/schemas.py`
- Modify: `backend/app/domains/tryon/service.py`
- Modify: `backend/app/domains/tryon/router.py`
- Create: `backend/alembic/versions/<generated>_add_pose_to_tryon_jobs.py`
- Test: `backend/tests/domains/tryon/test_router.py`
- Test: `backend/tests/domains/tryon/test_service.py` (add if creating new coverage for `create_job`'s `pose` param — check whether this file exists yet; if not, this step only touches `test_router.py`)

**Interfaces:**
- Consumes: `CatalogModel.side_image` from Task 2.
- Produces: `TryOnJobCreate.pose: Literal["front", "side"] = "front"`, `TryOnJob.pose: str`, `TryOnJobResponse.pose: str` — the router picks `catalog_model.side_image or catalog_model.image` when `pose == "side"`, else always `catalog_model.image`.

- [ ] **Step 1: Write the failing router test**

Add to `backend/tests/domains/tryon/test_router.py`:

```python
def _seed_catalog_model_with_side_image(db_session) -> CatalogModel:
    model = CatalogModel(
        name="Test Model",
        image="/outfit/models/test-front.jpg",
        dossier_image="/outfit/models/test-front.jpg",
        side_image="/outfit/models/test-side.jpg",
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


def test_create_job_defaults_pose_to_front(client, db_session):
    _login(client, "tryon-pose-1@example.com")
    model = _seed_catalog_model(db_session)

    response = client.post("/tryon", json={"catalogModelId": model.id, "occasion": "hang-ngay", "style": "casual"})

    assert response.status_code == 201
    assert response.json()["pose"] == "front"


def test_create_job_accepts_an_explicit_pose(client, db_session):
    _login(client, "tryon-pose-2@example.com")
    model = _seed_catalog_model_with_side_image(db_session)

    response = client.post(
        "/tryon", json={"catalogModelId": model.id, "occasion": "hang-ngay", "style": "casual", "pose": "side"}
    )

    assert response.status_code == 201
    assert response.json()["pose"] == "side"


def test_create_job_rejects_an_invalid_pose(client, db_session):
    _login(client, "tryon-pose-3@example.com")
    model = _seed_catalog_model(db_session)

    response = client.post(
        "/tryon", json={"catalogModelId": model.id, "occasion": "hang-ngay", "style": "casual", "pose": "flying"}
    )

    assert response.status_code == 422
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/domains/tryon/test_router.py -v
```

Expected: FAIL — `pose` isn't accepted/returned yet (422 on the valid-pose tests since the field doesn't exist on the schema in a way that round-trips, or the response simply has no `pose` key).

- [ ] **Step 3: Add the column to the model**

Modify `backend/app/domains/tryon/models.py`:

```python
    style: Mapped[str] = mapped_column(String(100), nullable=False)
    pose: Mapped[str] = mapped_column(String(20), nullable=False, default="front")
```

- [ ] **Step 4: Add `pose` to the schemas**

Modify `backend/app/domains/tryon/schemas.py`:

```python
from datetime import datetime
from typing import Literal

from app.domains.auth.schemas import CamelModel


class TryOnJobCreate(CamelModel):
    catalog_model_id: int
    occasion: str
    style: str
    pose: Literal["front", "side"] = "front"


class TryOnJobResponse(CamelModel):
    id: int
    user_id: int
    wardrobe_item_id: int | None
    catalog_model_id: int
    occasion: str
    style: str
    pose: str
    status: str
    result_blob_url: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 5: Thread `pose` through the service**

Modify `backend/app/domains/tryon/service.py`'s `create_job`:

```python
def create_job(db: Session, user_id: int, catalog_model_id: int, occasion: str, style: str, pose: str = "front") -> TryOnJob:
    job = TryOnJob(
        user_id=user_id,
        catalog_model_id=catalog_model_id,
        occasion=occasion,
        style=style,
        pose=pose,
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job
```

- [ ] **Step 6: Use `pose` to pick the person-image URL in the router**

Modify `backend/app/domains/tryon/router.py`'s `create_tryon_job`:

```python
    job = service.create_job(db, user.id, body.catalog_model_id, body.occasion, body.style, body.pose)
    person_image_url = catalog_model.side_image if body.pose == "side" and catalog_model.side_image else catalog_model.image
    background_tasks.add_task(_process_job_with_fresh_session, job.id, season, person_image_url)
    return job
```

- [ ] **Step 7: Generate and apply the migration**

```bash
alembic revision --autogenerate -m "add pose to tryon_jobs"
```

Inspect the generated file — a single `op.add_column('tryon_jobs', sa.Column('pose', sa.String(length=20), nullable=False, server_default='front'))` (the autogenerate step should add a `server_default` automatically to satisfy `NOT NULL` on a table that may already have rows; if it doesn't, add `server_default='front'` yourself so existing rows get a value). Then:

```bash
alembic upgrade head
```

- [ ] **Step 8: Run test to verify it passes**

```bash
pytest tests/domains/tryon/test_router.py -v
```

Expected: PASS (all tests in the file, including the 4 pre-existing ones).

- [ ] **Step 9: Run the full backend test suite**

```bash
pytest -v
```

Expected: all tests pass — this confirms Tasks 1-3 together haven't broken anything else.

- [ ] **Step 10: Commit**

```bash
git add app/domains/tryon alembic/versions tests/domains/tryon/test_router.py
git commit -m "feat: add pose field to try-on jobs, selecting front/side model photo"
```
