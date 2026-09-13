# Contact + Quiz-Attempts Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `contact` and `quiz-attempts` from Next.js/SQLite to the FastAPI backend, and cut the frontend fully over, deleting the old implementation.

**Architecture:** Two new self-contained, unrelated domains under `app/domains/{contact,quiz_attempts}/` in the backend, following the `models.py`/`schemas.py`/`service.py`/`router.py` shape established in Phases 1-3. Neither domain seeds data, so neither gets a `seed.py`. `contact` inverts the public/admin split seen in every prior domain (public write, admin-gated reads). `quiz-attempts` introduces the first *optional* auth dependency, `get_current_user_optional`, so anonymous quiz attempts keep working while logged-in attempts get attributed. Frontend components switch their `fetch('/api/...')` calls to `apiFetch('/...')`, same mechanical change as every prior phase, and `lib/contact.ts`/`lib/quizAttempts.ts` are trimmed to minimal legacy shims (not fully deleted) so `/admin/stats` keeps working until its own migration in Phase 6.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL (unchanged from Phases 1-3). Frontend: Next.js 16, Vitest (unchanged).

**Spec:** `docs/superpowers/specs/2026-09-14-contact-quiz-attempts-migration-design.md`

## Global Constraints

- `contact`'s public/admin split is inverted from every prior domain: `POST /contact` is public, `GET /contact`, `PATCH /contact/{id}`, `DELETE /contact/{id}` are all `require_admin`.
- `quiz-attempts` has a single endpoint, `POST /quiz-attempts`, which never returns `401` — an absent, expired, or invalid `access_token` cookie simply results in an anonymous attempt (`userId: null`), resolved via the new `get_current_user_optional` dependency in `app/deps.py`.
- Neither domain seeds data (both hold real visitor-generated records) — no `seed.py`, no `test_seed.py`, no seed wiring in `app/main.py`'s `lifespan`.
- "Enum-like" string fields (`subject`, `season`) are plain `String` Postgres columns validated in Pydantic — never a Postgres native `ENUM`, matching every prior domain.
- `quiz_attempts.user_id` is a nullable FK to `users.id` with `ON DELETE SET NULL` (an intentional improvement over the current SQLite schema's unqualified `REFERENCES users(id)`, which has no user-deletion feature to interact with today anyway).
- Backend tests run against the real Postgres test database via the existing `tests/conftest.py` fixtures (`db_session`, `client`) — no mocks, no SQLite.
- `lib/contact.ts` and `lib/quizAttempts.ts` are **not** fully deleted — each is trimmed to a legacy shim keeping `initSchema` plus its single `create*` function, because `lib/stats.test.ts` calls `createContactMessage`/`createQuizAttempt` to seed fixture rows before asserting `getAdminStats`'s counts. This mirrors the `createBlogPost` bridge kept in `lib/db.ts` during Phase 3. Everything else in both files (list/read/update/delete functions, row types, `ContactSubject`/`CONTACT_SUBJECTS`) is deleted once confirmed unused.
- `ContactMessage`'s type survives in `lib/contact.ts` because `components/admin/ContactMessageList.tsx` keeps using it to type API responses after cutover. `QuizAttempt`'s type does not survive — nothing consumes it after cutover (`QuizFlow.tsx` ignores the response body).
- Admin **list** components (`ContactMessageList.tsx`) get a plain `fetch` → `apiFetch` swap with no new error-handling UI, matching `FaqList.tsx`'s precedent — the generic `t('unauthorizedError')`/`t('genericError')` treatment from prior phases only applies to admin **forms**, and neither domain in this phase has one.
- `components/home/ContactSection.tsx` (the public marketing contact form) keeps its existing bespoke success/error UI (`t('successMessage')`/`t('errorMessage')`) — only its `fetch` call is swapped to `apiFetch`.

---

## Task 1: `contact` domain — model and migration

**Files:**
- Create: `backend/app/domains/contact/__init__.py`
- Create: `backend/app/domains/contact/models.py`
- Modify: `backend/alembic/env.py` (register the model)
- Create: `backend/tests/domains/contact/__init__.py`
- Create: `backend/tests/domains/contact/test_models.py`

**Interfaces:**
- Consumes: `app.db.session.Base` (Phase 1).
- Produces: `app.domains.contact.models.ContactMessage` (columns: `id`, `name`, `email`, `phone`, `subject`, `message`, `is_read`, `created_at`).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/contact/__init__.py` (empty).

Create `backend/tests/domains/contact/test_models.py`:

```python
from app.domains.contact.models import ContactMessage


def test_create_contact_message_persists_expected_fields(db_session):
    message = ContactMessage(
        name="Nguyễn Văn Test",
        email="test@twistfit.vn",
        phone=None,
        subject="other",
        message="Nội dung test",
    )
    db_session.add(message)
    db_session.commit()
    db_session.refresh(message)

    assert message.id is not None
    assert message.is_read is False
    assert message.created_at is not None


def test_contact_message_stores_an_optional_phone(db_session):
    message = ContactMessage(
        name="Nguyễn Văn Test",
        email="test@twistfit.vn",
        phone="0909123456",
        subject="stylist",
        message="Nội dung test",
    )
    db_session.add(message)
    db_session.commit()
    db_session.refresh(message)

    assert message.phone == "0909123456"
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/contact/test_models.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.contact'`.

- [ ] **Step 3: Create the model**

Create `backend/app/domains/contact/__init__.py` (empty).

Create `backend/app/domains/contact/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    subject: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
```

- [ ] **Step 4: Register the model with Alembic**

Modify `backend/alembic/env.py` — add this line next to the existing model imports:

```python
from app.domains.contact import models as contact_models  # noqa: F401
```

- [ ] **Step 5: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "create contact_messages table"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\d contact_messages'` shows the expected columns.

- [ ] **Step 6: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/contact/test_models.py -v`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/contact alembic/env.py alembic/versions tests/domains/contact
git commit -m "feat: add contact_messages model and migration"
```

---

## Task 2: `contact` domain — schemas and service

**Files:**
- Create: `backend/app/domains/contact/schemas.py`
- Create: `backend/app/domains/contact/service.py`
- Create: `backend/tests/domains/contact/test_service.py`

**Interfaces:**
- Consumes: `ContactMessage` (Task 1).
- Produces: `ContactMessageCreate`, `ContactMessageUpdate`, `ContactMessageResponse` (Pydantic schemas). `list_contact_messages(db) -> list[ContactMessage]`, `get_contact_message(db, message_id) -> ContactMessage | None`, `create_contact_message(db, data: ContactMessageCreate) -> ContactMessage`, `set_contact_message_read(db, message_id, is_read) -> ContactMessage | None`, `delete_contact_message(db, message_id) -> bool`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/contact/test_service.py`:

```python
from app.domains.contact import service
from app.domains.contact.schemas import ContactMessageCreate

VALID_INPUT = ContactMessageCreate(
    name="Nguyễn Văn Test",
    email="test@twistfit.vn",
    phone=None,
    subject="other",
    message="Nội dung test",
)


def test_create_contact_message_defaults_is_read_to_false(db_session):
    created = service.create_contact_message(db_session, VALID_INPUT)
    assert created.id is not None
    assert created.is_read is False
    assert created.name == "Nguyễn Văn Test"


def test_list_contact_messages_orders_newest_first(db_session):
    service.create_contact_message(db_session, VALID_INPUT.model_copy(update={"name": "Tin 1"}))
    service.create_contact_message(db_session, VALID_INPUT.model_copy(update={"name": "Tin 2"}))
    names = [message.name for message in service.list_contact_messages(db_session)]
    assert names == ["Tin 2", "Tin 1"]


def test_get_contact_message_returns_none_when_missing(db_session):
    assert service.get_contact_message(db_session, 999999) is None


def test_set_contact_message_read_toggles_flag(db_session):
    created = service.create_contact_message(db_session, VALID_INPUT)
    marked = service.set_contact_message_read(db_session, created.id, True)
    assert marked is not None
    assert marked.is_read is True
    unmarked = service.set_contact_message_read(db_session, created.id, False)
    assert unmarked.is_read is False


def test_set_contact_message_read_returns_none_when_missing(db_session):
    assert service.set_contact_message_read(db_session, 999999, True) is None


def test_delete_contact_message_removes_it(db_session):
    created = service.create_contact_message(db_session, VALID_INPUT)
    assert service.delete_contact_message(db_session, created.id) is True
    assert service.get_contact_message(db_session, created.id) is None
    assert service.delete_contact_message(db_session, created.id) is False
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/contact/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.contact.schemas'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/contact/schemas.py`:

```python
from datetime import datetime

from pydantic import EmailStr, field_validator

from app.domains.auth.schemas import CamelModel

CONTACT_SUBJECTS = ["color-test", "virtual-fitting", "stylist", "other"]


class ContactMessageCreate(CamelModel):
    name: str
    email: EmailStr
    phone: str | None = None
    subject: str
    message: str

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Họ tên không được để trống")
        return stripped

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("subject")
    @classmethod
    def subject_valid(cls, value: str) -> str:
        if value not in CONTACT_SUBJECTS:
            raise ValueError("Chủ đề không hợp lệ")
        return value

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Nội dung không được để trống")
        return stripped


class ContactMessageUpdate(CamelModel):
    is_read: bool


class ContactMessageResponse(CamelModel):
    id: int
    name: str
    email: str
    phone: str | None
    subject: str
    message: str
    is_read: bool
    created_at: datetime
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/contact/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.contact.models import ContactMessage
from app.domains.contact.schemas import ContactMessageCreate


def list_contact_messages(db: Session) -> list[ContactMessage]:
    return db.query(ContactMessage).order_by(ContactMessage.id.desc()).all()


def get_contact_message(db: Session, message_id: int) -> ContactMessage | None:
    return db.get(ContactMessage, message_id)


def create_contact_message(db: Session, data: ContactMessageCreate) -> ContactMessage:
    message = ContactMessage(**data.model_dump())
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def set_contact_message_read(db: Session, message_id: int, is_read: bool) -> ContactMessage | None:
    message = get_contact_message(db, message_id)
    if message is None:
        return None
    message.is_read = is_read
    db.commit()
    db.refresh(message)
    return message


def delete_contact_message(db: Session, message_id: int) -> bool:
    message = get_contact_message(db, message_id)
    if message is None:
        return False
    db.delete(message)
    db.commit()
    return True
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/contact/test_service.py -v`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/contact/schemas.py app/domains/contact/service.py tests/domains/contact/test_service.py
git commit -m "feat: add contact schemas and service"
```

---

## Task 3: `contact` domain — router

**Files:**
- Create: `backend/app/domains/contact/router.py`
- Modify: `backend/app/main.py` (wire the router)
- Create: `backend/tests/domains/contact/test_router.py`

**Interfaces:**
- Consumes: `service` module and schemas (Task 2), `require_admin` (Phase 1's `app/deps.py`).
- Produces: `router` (FastAPI `APIRouter`, prefix `/contact`) with `POST /contact`, `GET /contact`, `PATCH /contact/{id}`, `DELETE /contact/{id}`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/contact/test_router.py`:

```python
def _register_and_promote_admin(client, db_session, email: str) -> None:
    from app.domains.auth.models import User

    client.post("/auth/register", json={"name": "Admin", "email": email, "password": "password123"})
    db_session.query(User).filter(User.email == email).update({"role": "admin"})
    db_session.commit()
    client.post("/auth/login", json={"email": email, "password": "password123"})


VALID_BODY = {
    "name": "Nguyễn Văn Test",
    "email": "test@twistfit.vn",
    "phone": "0909123456",
    "subject": "other",
    "message": "Nội dung test",
}


def test_create_message_requires_no_authentication(client):
    response = client.post("/contact", json=VALID_BODY)
    assert response.status_code == 201
    body = response.json()
    assert body["isRead"] is False
    assert body["name"] == "Nguyễn Văn Test"


def test_create_message_rejects_invalid_body(client):
    response = client.post("/contact", json={**VALID_BODY, "email": "not-an-email"})
    assert response.status_code == 422


def test_list_messages_requires_authentication(client):
    response = client.get("/contact")
    assert response.status_code == 401


def test_list_messages_requires_admin_role(client, db_session):
    client.post(
        "/auth/register", json={"name": "User", "email": "contact-user@example.com", "password": "password123"}
    )
    client.post("/auth/login", json={"email": "contact-user@example.com", "password": "password123"})
    response = client.get("/contact")
    assert response.status_code == 403


def test_admin_can_list_update_and_delete_messages(client, db_session):
    _register_and_promote_admin(client, db_session, "contact-admin@example.com")

    create_response = client.post("/contact", json=VALID_BODY)
    message_id = create_response.json()["id"]

    list_response = client.get("/contact")
    assert list_response.status_code == 200
    assert any(message["id"] == message_id for message in list_response.json())

    update_response = client.patch(f"/contact/{message_id}", json={"isRead": True})
    assert update_response.status_code == 200
    assert update_response.json()["isRead"] is True

    delete_response = client.delete(f"/contact/{message_id}")
    assert delete_response.status_code == 204

    assert client.patch(f"/contact/{message_id}", json={"isRead": True}).status_code == 404


def test_update_and_delete_return_404_when_missing(client, db_session):
    _register_and_promote_admin(client, db_session, "contact-admin2@example.com")
    assert client.patch("/contact/999999", json={"isRead": True}).status_code == 404
    assert client.delete("/contact/999999").status_code == 404
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/contact/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.contact.router'`.

- [ ] **Step 3: Write the router**

Create `backend/app/domains/contact/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.contact import service
from app.domains.contact.schemas import ContactMessageCreate, ContactMessageResponse, ContactMessageUpdate

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
def create_message(body: ContactMessageCreate, db: Session = Depends(get_db)):
    return service.create_contact_message(db, body)


@router.get("", response_model=list[ContactMessageResponse])
def list_messages(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return service.list_contact_messages(db)


@router.patch("/{message_id}", response_model=ContactMessageResponse)
def update_message(
    message_id: int,
    body: ContactMessageUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    updated = service.set_contact_message_read(db, message_id, body.is_read)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tin nhắn")
    return updated


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(message_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    deleted = service.delete_contact_message(db, message_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy tin nhắn")
```

- [ ] **Step 4: Wire the router into the app**

Modify `backend/app/main.py` — add the import next to the other domain router imports:

```python
from app.domains.contact.router import router as contact_router
```

and add the include next to the other `app.include_router(...)` calls:

```python
app.include_router(contact_router)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/contact/test_router.py -v`
Expected: PASS (6 tests).

- [ ] **Step 6: Run the full backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/contact/router.py app/main.py tests/domains/contact/test_router.py
git commit -m "feat: add contact router"
```

---

## Task 4: `quiz_attempts` domain — model and migration

**Files:**
- Create: `backend/app/domains/quiz_attempts/__init__.py`
- Create: `backend/app/domains/quiz_attempts/models.py`
- Modify: `backend/alembic/env.py` (register the model)
- Create: `backend/tests/domains/quiz_attempts/__init__.py`
- Create: `backend/tests/domains/quiz_attempts/test_models.py`

**Interfaces:**
- Consumes: `app.db.session.Base` (Phase 1), `app.domains.auth.models.User` (Phase 1, for the FK).
- Produces: `app.domains.quiz_attempts.models.QuizAttempt` (columns: `id`, `season`, `user_id`, `created_at`).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/quiz_attempts/__init__.py` (empty).

Create `backend/tests/domains/quiz_attempts/test_models.py`:

```python
from app.core.security import hash_password
from app.domains.auth.models import User
from app.domains.quiz_attempts.models import QuizAttempt


def test_create_quiz_attempt_allows_a_null_user_id(db_session):
    attempt = QuizAttempt(season="summer", user_id=None)
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)

    assert attempt.id is not None
    assert attempt.user_id is None
    assert attempt.created_at is not None


def test_create_quiz_attempt_can_be_attributed_to_a_user(db_session):
    user = User(
        name="Test", email="quiz-attempt-model@example.com", password_hash=hash_password("password123")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    attempt = QuizAttempt(season="winter", user_id=user.id)
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)

    assert attempt.user_id == user.id
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/quiz_attempts/test_models.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.quiz_attempts'`.

- [ ] **Step 3: Create the model**

Create `backend/app/domains/quiz_attempts/__init__.py` (empty).

Create `backend/app/domains/quiz_attempts/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    season: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
```

- [ ] **Step 4: Register the model with Alembic**

Modify `backend/alembic/env.py` — add this line next to the existing model imports:

```python
from app.domains.quiz_attempts import models as quiz_attempts_models  # noqa: F401
```

- [ ] **Step 5: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "create quiz_attempts table"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\d quiz_attempts'` shows the expected columns and the FK's `ON DELETE SET NULL` rule.

- [ ] **Step 6: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/quiz_attempts/test_models.py -v`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/quiz_attempts alembic/env.py alembic/versions tests/domains/quiz_attempts
git commit -m "feat: add quiz_attempts model and migration"
```

---

## Task 5: `quiz_attempts` domain — schemas and service

**Files:**
- Create: `backend/app/domains/quiz_attempts/schemas.py`
- Create: `backend/app/domains/quiz_attempts/service.py`
- Create: `backend/tests/domains/quiz_attempts/test_service.py`

**Interfaces:**
- Consumes: `QuizAttempt` (Task 4).
- Produces: `QuizAttemptCreate`, `QuizAttemptResponse` (Pydantic schemas), `SEASONS` (list of valid season strings). `create_quiz_attempt(db, season: str, user_id: int | None) -> QuizAttempt`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/quiz_attempts/test_service.py`:

```python
from app.domains.quiz_attempts import service


def test_create_quiz_attempt_with_no_user(db_session):
    created = service.create_quiz_attempt(db_session, "summer", None)
    assert created.id is not None
    assert created.season == "summer"
    assert created.user_id is None


def test_create_quiz_attempt_with_a_user(db_session):
    from app.domains.auth import service as auth_service

    user = auth_service.create_user(db_session, name="Test", email="quiz-attempt-svc@example.com", password="password123")
    created = service.create_quiz_attempt(db_session, "winter", user.id)
    assert created.user_id == user.id
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/quiz_attempts/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.quiz_attempts.service'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/quiz_attempts/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

SEASONS = ["spring", "summer", "autumn", "winter"]


class QuizAttemptCreate(CamelModel):
    season: str

    @field_validator("season")
    @classmethod
    def season_valid(cls, value: str) -> str:
        if value not in SEASONS:
            raise ValueError("Kết quả mùa không hợp lệ")
        return value


class QuizAttemptResponse(CamelModel):
    id: int
    season: str
    user_id: int | None
    created_at: datetime
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/quiz_attempts/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.quiz_attempts.models import QuizAttempt


def create_quiz_attempt(db: Session, season: str, user_id: int | None) -> QuizAttempt:
    attempt = QuizAttempt(season=season, user_id=user_id)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/quiz_attempts/test_service.py -v`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/quiz_attempts/schemas.py app/domains/quiz_attempts/service.py tests/domains/quiz_attempts/test_service.py
git commit -m "feat: add quiz_attempts schemas and service"
```

---

## Task 6: `quiz_attempts` domain — router and optional-auth dependency

**Files:**
- Modify: `backend/app/deps.py` (add `get_current_user_optional`)
- Modify: `backend/tests/domains/auth/test_deps.py` (add tests for it)
- Create: `backend/app/domains/quiz_attempts/router.py`
- Modify: `backend/app/main.py` (wire the router)
- Create: `backend/tests/domains/quiz_attempts/test_router.py`

**Interfaces:**
- Consumes: `decode_access_token` (Phase 1), `app.domains.auth.models.User`, `get_db` (Phase 1), `service`/schemas (Task 5).
- Produces: `get_current_user_optional(access_token: str | None, db: Session) -> User | None` in `app/deps.py`. `router` (FastAPI `APIRouter`, prefix `/quiz-attempts`) with `POST /quiz-attempts`.

- [ ] **Step 1: Write the failing dependency tests**

Modify `backend/tests/domains/auth/test_deps.py` — add these tests and the needed import at the top of the file (append `get_current_user_optional` to the existing `from app.deps import get_current_user, require_admin` line):

```python
def test_get_current_user_optional_returns_none_for_missing_cookie(db_session):
    assert get_current_user_optional(access_token=None, db=db_session) is None


def test_get_current_user_optional_returns_none_for_invalid_token(db_session):
    assert get_current_user_optional(access_token="garbage", db=db_session) is None


def test_get_current_user_optional_returns_user_for_valid_token(db_session):
    user = service.create_user(db_session, name="A", email="deps-optional@example.com", password="password123")
    token = create_access_token(user_id=user.id, role=user.role)

    result = get_current_user_optional(access_token=token, db=db_session)
    assert result is not None
    assert result.id == user.id


def test_get_current_user_optional_returns_none_for_inactive_user(db_session):
    user = service.create_user(db_session, name="A", email="deps-optional2@example.com", password="password123")
    token = create_access_token(user_id=user.id, role=user.role)
    user.is_active = False
    db_session.commit()

    assert get_current_user_optional(access_token=token, db=db_session) is None
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/auth/test_deps.py -v`
Expected: FAIL with `ImportError: cannot import name 'get_current_user_optional'`.

- [ ] **Step 3: Add the dependency**

Modify `backend/app/deps.py` — add this function after `get_current_user` (before or after `require_admin`, either position is fine):

```python
def get_current_user_optional(
    access_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> User | None:
    if access_token is None:
        return None

    payload = decode_access_token(access_token)
    if payload is None:
        return None

    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        return None

    return user
```

- [ ] **Step 4: Run the dependency tests and verify they pass**

Run: `cd backend && pytest tests/domains/auth/test_deps.py -v`
Expected: PASS (10 tests — 6 existing plus 4 new).

- [ ] **Step 5: Write the failing router test**

Create `backend/tests/domains/quiz_attempts/test_router.py`:

```python
def test_create_attempt_allows_anonymous_submission(client):
    response = client.post("/quiz-attempts", json={"season": "summer"})
    assert response.status_code == 201
    body = response.json()
    assert body["season"] == "summer"
    assert body["userId"] is None


def test_create_attempt_attributes_to_the_logged_in_user(client, db_session):
    from app.domains.auth.models import User

    client.post(
        "/auth/register",
        json={"name": "Test", "email": "quiz-attempt-router@example.com", "password": "password123"},
    )
    client.post("/auth/login", json={"email": "quiz-attempt-router@example.com", "password": "password123"})
    user = db_session.query(User).filter(User.email == "quiz-attempt-router@example.com").one()

    response = client.post("/quiz-attempts", json={"season": "winter"})
    assert response.status_code == 201
    assert response.json()["userId"] == user.id


def test_create_attempt_treats_an_invalid_access_token_as_anonymous(client):
    client.cookies.set("access_token", "not-a-valid-jwt")
    response = client.post("/quiz-attempts", json={"season": "spring"})
    assert response.status_code == 201
    assert response.json()["userId"] is None


def test_create_attempt_rejects_an_invalid_season(client):
    response = client.post("/quiz-attempts", json={"season": "not-a-season"})
    assert response.status_code == 422
```

- [ ] **Step 6: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/quiz_attempts/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.quiz_attempts.router'`.

- [ ] **Step 7: Write the router**

Create `backend/app/domains/quiz_attempts/router.py`:

```python
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user_optional
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
```

- [ ] **Step 8: Wire the router into the app**

Modify `backend/app/main.py` — add the import next to the other domain router imports:

```python
from app.domains.quiz_attempts.router import router as quiz_attempts_router
```

and add the include next to the other `app.include_router(...)` calls:

```python
app.include_router(quiz_attempts_router)
```

- [ ] **Step 9: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/quiz_attempts/test_router.py -v`
Expected: PASS (4 tests).

- [ ] **Step 10: Run the full backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests pass.

- [ ] **Step 11: Commit**

```bash
cd backend
git add app/deps.py tests/domains/auth/test_deps.py app/domains/quiz_attempts/router.py app/main.py tests/domains/quiz_attempts/test_router.py
git commit -m "feat: add quiz_attempts router and optional-auth dependency"
```

---

## Task 7: Frontend `contact` cutover

**Files:**
- Delete: `frontend/app/api/contact/route.ts`, `frontend/app/api/contact/route.test.ts`
- Delete: `frontend/app/api/contact/[id]/route.ts`, `frontend/app/api/contact/[id]/route.test.ts`
- Delete: `frontend/app/api/contact/validate.ts`, `frontend/app/api/contact/validate.test.ts`
- Modify: `frontend/components/home/ContactSection.tsx`
- Modify: `frontend/components/home/ContactSection.test.tsx`
- Modify: `frontend/components/admin/ContactMessageList.tsx`
- Modify: `frontend/components/admin/ContactMessageList.test.tsx`
- Modify: `frontend/lib/contact.ts` (trim to a legacy shim)
- Delete: `frontend/lib/contact.test.ts`
- Modify: `frontend/lib/stats.test.ts` (its `createContactMessage`/`initSchema` imports from `./contact` keep working unchanged — verify, don't edit, in Step 8)

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/contact` endpoints (Task 3).

- [ ] **Step 1: Delete the old contact API routes**

```bash
cd frontend
rm app/api/contact/route.ts app/api/contact/route.test.ts
rm app/api/contact/validate.ts app/api/contact/validate.test.ts
rm "app/api/contact/[id]/route.ts" "app/api/contact/[id]/route.test.ts"
```

- [ ] **Step 2: Update ContactSection to POST via apiClient**

Modify `frontend/components/home/ContactSection.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the `fetch` call inside `handleSubmit`:

```typescript
    const response = await apiFetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
```

- [ ] **Step 3: Update the ContactSection test's fetch assertion**

Modify `frontend/components/home/ContactSection.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith(
      '/contact',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          name: 'Linh Đan',
          email: 'linhdan@gmail.com',
          phone: '',
          subject: 'other',
          message: 'Xin chào',
        }),
      })
    )
```

- [ ] **Step 4: Run the ContactSection tests**

Run: `cd frontend && npx vitest run components/home/ContactSection.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Update ContactMessageList to use apiClient**

Modify `frontend/components/admin/ContactMessageList.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the three `fetch` calls:

```typescript
  useEffect(() => {
    apiFetch('/contact')
      .then((response) => response.json())
      .then(setMessages)
  }, [])

  async function handleToggleRead(message: ContactMessage) {
    const response = await apiFetch(`/contact/${message.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: !message.isRead }),
    })
    const updated = await response.json()
    setMessages((current) => current?.map((item) => (item.id === message.id ? updated : item)) ?? null)
  }

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/contact/${id}`, { method: 'DELETE' })
    setMessages((current) => current?.filter((item) => item.id !== id) ?? null)
  }
```

- [ ] **Step 6: Update the ContactMessageList test's fetch assertions**

Modify `frontend/components/admin/ContactMessageList.test.tsx`:

```typescript
    expect(fetch).toHaveBeenCalledWith('/contact', { credentials: 'include' })
```

```typescript
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/contact/1',
        expect.objectContaining({ method: 'PATCH', credentials: 'include', body: JSON.stringify({ isRead: true }) })
      )
    )
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/contact/1', { method: 'DELETE', credentials: 'include' })
```

- [ ] **Step 7: Run the ContactMessageList tests**

Run: `cd frontend && npx vitest run components/admin/ContactMessageList.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 8: Confirm `lib/stats.test.ts` still passes untouched**

`lib/stats.test.ts` imports `initSchema as initContactSchema, createContactMessage` from `./contact` — these two exports must survive the trim in Step 9. Run it now, before trimming, to have a known-good baseline:

Run: `cd frontend && npx vitest run lib/stats.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 9: Trim `lib/contact.ts` to a legacy shim**

Modify `frontend/lib/contact.ts` — replace the entire file with:

```typescript
import type Database from 'better-sqlite3'

// Legacy SQLite shim, kept only for admin/stats (lib/stats.ts), which still
// counts rows in `contact_messages` directly against the shared SQLite
// database and has not been migrated to FastAPI yet (planned for Phase 6).
// Contact's real data now lives in Postgres via the FastAPI backend; this
// table is intentionally never written to in production, so admin/stats
// reports 0 contact messages until that migration happens, rather than
// silently showing stale data. `createContactMessage` is kept only because
// lib/stats.test.ts calls it to build fixture rows for its count assertions.

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

type ContactMessageRow = {
  id: number
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  is_read: number
  created_at: string
}

function rowToContactMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject as ContactSubject,
    message: row.message,
    isRead: row.is_read === 1,
    createdAt: row.created_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `)
}

function getContactMessageById(db: Database.Database, id: number): ContactMessage | null {
  const row = db.prepare('SELECT * FROM contact_messages WHERE id = ?').get(id) as
    | ContactMessageRow
    | undefined
  return row ? rowToContactMessage(row) : null
}

export function createContactMessage(db: Database.Database, input: ContactMessageInput): ContactMessage {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO contact_messages (name, email, phone, subject, message, is_read, created_at)
       VALUES (@name, @email, @phone, @subject, @message, 0, @createdAt)`
    )
    .run({ ...input, createdAt: now })
  const created = getContactMessageById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created contact message')
  }
  return created
}
```

Note: `getContactMessages`, `setContactMessageRead`, `deleteContactMessage`, `seedIfEmpty`, and `CONTACT_SUBJECTS` are dropped — nothing imports them once `app/api/contact/*` is gone (confirmed by grep before this step).

- [ ] **Step 10: Delete the SQLite CRUD test file for `lib/contact.ts`**

```bash
cd frontend
git rm lib/contact.test.ts
```

- [ ] **Step 11: Remove the dead `seedContactIfEmpty` wiring from `lib/getDb.ts`**

Modify `frontend/lib/getDb.ts` — change the import line:

```typescript
import { initSchema as initContactSchema } from './contact'
```

and remove the `seedContactIfEmpty(db)` call inside `getDb()` (the `initContactSchema(db)` call stays — it keeps `/admin/stats` from crashing).

- [ ] **Step 12: Run `lib/stats.test.ts` again to confirm the shim didn't break it**

Run: `cd frontend && npx vitest run lib/stats.test.ts`
Expected: PASS (4 tests) — same result as Step 8.

- [ ] **Step 13: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass.

- [ ] **Step 14: Commit**

```bash
cd frontend
git add components/home/ContactSection.tsx components/home/ContactSection.test.tsx components/admin/ContactMessageList.tsx components/admin/ContactMessageList.test.tsx lib/contact.ts lib/getDb.ts
git rm app/api/contact/route.ts app/api/contact/route.test.ts app/api/contact/validate.ts app/api/contact/validate.test.ts
git rm "app/api/contact/[id]/route.ts" "app/api/contact/[id]/route.test.ts"
git commit -m "feat: cut contact over to FastAPI"
```

---

## Task 8: Frontend `quiz-attempts` cutover

**Files:**
- Delete: `frontend/app/api/quiz-attempts/route.ts`, `frontend/app/api/quiz-attempts/route.test.ts`
- Modify: `frontend/components/personal-color/QuizFlow.tsx`
- Modify: `frontend/components/personal-color/QuizFlow.test.tsx`
- Modify: `frontend/components/auth/RegisterForm.tsx` (fix a now-stale comment)
- Modify: `frontend/lib/quizAttempts.ts` (trim to a legacy shim)
- Delete: `frontend/lib/quizAttempts.test.ts`
- Modify: `frontend/lib/getDb.ts` (remove the now-dead `seedQuizAttemptsIfEmpty` wiring)

**Interfaces:**
- Consumes: `apiFetch` (Phase 1), the FastAPI `/quiz-attempts` endpoint (Task 6).

- [ ] **Step 1: Check for a quiz-attempts validate file, then delete the old route**

```bash
cd frontend
ls app/api/quiz-attempts/validate.ts 2>/dev/null && echo "exists — delete it too" || echo "does not exist"
rm app/api/quiz-attempts/route.ts app/api/quiz-attempts/route.test.ts
```

- [ ] **Step 2: Update QuizFlow to POST via apiClient**

Modify `frontend/components/personal-color/QuizFlow.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the `fetch` call inside `handleAdvance`:

```typescript
      void apiFetch('/quiz-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season }),
      }).catch(() => {})
```

- [ ] **Step 3: Update the QuizFlow test's fetch assertion**

Modify `frontend/components/personal-color/QuizFlow.test.tsx`:

```typescript
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/quiz-attempts',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
    )
```

- [ ] **Step 4: Run the QuizFlow tests**

Run: `cd frontend && npx vitest run components/personal-color/QuizFlow.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Fix the stale legacy-mirroring comment in RegisterForm**

Modify `frontend/components/auth/RegisterForm.tsx` — `quiz-attempts` no longer reads the legacy SQLite `users` table (it resolves the current user from the new JWT `access_token` cookie instead), so update the comment above the mirroring `fetch('/api/auth/register', ...)` call:

```typescript
    // Mirror the new user into the legacy SQLite users table (unmodified
    // /api/auth/register route) so forum — which still queries that table
    // directly — can resolve this user after registration.
```

- [ ] **Step 6: Confirm `lib/stats.test.ts` still passes before trimming**

`lib/stats.test.ts` imports `initSchema as initQuizAttemptsSchema, createQuizAttempt` from `./quizAttempts` — these two exports must survive the trim in Step 7.

Run: `cd frontend && npx vitest run lib/stats.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Trim `lib/quizAttempts.ts` to a legacy shim**

Modify `frontend/lib/quizAttempts.ts` — replace the entire file with:

```typescript
import type Database from 'better-sqlite3'
import type { Season } from './db'

// Legacy SQLite shim, kept only for admin/stats (lib/stats.ts), which still
// counts rows in `quiz_attempts` directly against the shared SQLite
// database and has not been migrated to FastAPI yet (planned for Phase 6).
// Quiz-attempts' real data now lives in Postgres via the FastAPI backend;
// this table is intentionally never written to in production, so
// admin/stats reports 0 quiz attempts until that migration happens, rather
// than silently showing stale data. `createQuizAttempt` is kept only
// because lib/stats.test.ts calls it to build fixture rows for its count
// assertions.

type QuizAttemptRow = {
  id: number
  season: string
  user_id: number | null
  created_at: string
}

export function initSchema(db: Database.Database): void {
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL
    );
  `)
}

export function createQuizAttempt(
  db: Database.Database,
  season: Season,
  userId: number | null
): { id: number; season: Season; userId: number | null; createdAt: string } {
  const now = new Date().toISOString()
  const result = db
    .prepare('INSERT INTO quiz_attempts (season, user_id, created_at) VALUES (?, ?, ?)')
    .run(season, userId, now)
  const row = db
    .prepare('SELECT * FROM quiz_attempts WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as QuizAttemptRow
  return { id: row.id, season: row.season as Season, userId: row.user_id, createdAt: row.created_at }
}
```

Note: `QuizAttempt` the exported type, `getQuizAttemptsCount`, `getNewQuizAttemptsCount`, and `seedIfEmpty` are dropped — nothing imports them once `app/api/quiz-attempts/route.ts` is gone (confirmed by grep before this step); `createQuizAttempt`'s return type is now inlined since nothing outside this file needs the shared `QuizAttempt` name.

- [ ] **Step 8: Delete the SQLite CRUD test file for `lib/quizAttempts.ts`**

```bash
cd frontend
git rm lib/quizAttempts.test.ts
```

- [ ] **Step 9: Remove the dead `seedQuizAttemptsIfEmpty` wiring from `lib/getDb.ts`**

Modify `frontend/lib/getDb.ts` — change the import line:

```typescript
import { initSchema as initQuizAttemptsSchema } from './quizAttempts'
```

and remove the `seedQuizAttemptsIfEmpty(db)` call inside `getDb()` (the `initQuizAttemptsSchema(db)` call stays).

- [ ] **Step 10: Run `lib/stats.test.ts` again to confirm the shim didn't break it**

Run: `cd frontend && npx vitest run lib/stats.test.ts`
Expected: PASS (4 tests) — same result as Step 6.

- [ ] **Step 11: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass.

- [ ] **Step 12: Manually verify in the browser**

With PostgreSQL running, the backend running (`cd backend && uvicorn app.main:app --reload`) and the frontend running (`cd frontend && npm run dev`), with `frontend/.env.local` containing `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`:
- Submit the homepage contact form (`/` → scroll to the contact section) — confirm the success message appears, and `GET /contact` (via a logged-in admin curl or the admin page) shows the new message.
- Visit `/admin/contact` as `admin@twistfit.vn` / `admin1234` — the message appears; toggle it read/unread, then delete it.
- Complete the quiz at `/personal-color/quiz` while logged out — confirm no errors, and (via `psql` or a temporary log) that a `quiz_attempts` row was created with `user_id NULL`.
- Log in, complete the quiz again — confirm the new row has the logged-in user's id.

- [ ] **Step 13: Commit**

```bash
cd frontend
git add components/personal-color/QuizFlow.tsx components/personal-color/QuizFlow.test.tsx components/auth/RegisterForm.tsx lib/quizAttempts.ts lib/getDb.ts
git rm app/api/quiz-attempts/route.ts app/api/quiz-attempts/route.test.ts
git commit -m "feat: cut quiz-attempts over to FastAPI"
```
