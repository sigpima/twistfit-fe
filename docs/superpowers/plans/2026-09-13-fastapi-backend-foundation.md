# FastAPI Backend Foundation + Auth + FAQ Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a separately-deployed FastAPI + PostgreSQL backend, fully migrate authentication and the FAQ domain to it, and cut the frontend over to call it directly — while keeping the 10 still-Next.js-hosted domains working unchanged.

**Architecture:** FastAPI service (`backend/`, its own git repo) organized as one self-contained folder per domain (`models.py`/`schemas.py`/`service.py`/`router.py`), backed by PostgreSQL via SQLAlchemy + Alembic. The Next.js frontend (`frontend/`, its own git repo) calls it directly from the browser via a small `apiClient` wrapper, with `credentials: 'include'` and automatic one-shot refresh-and-retry on 401. A legacy-compatibility bridge (an old-format signed cookie, plus a mirrored user row in the old SQLite database) keeps every domain this phase does not touch working exactly as before.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL, PyJWT, passlib[bcrypt], pytest + httpx `TestClient`. Frontend: Next.js 16 App Router, Vitest (unchanged).

**Spec:** `docs/superpowers/specs/2026-09-13-fastapi-backend-foundation-design.md` (this file lives in the frontend repo's `docs/`, even though it specs the backend — read it for full rationale, especially the "Legacy session cookie bridge" and "Legacy user record mirroring" sections, which this plan implements literally).

## Global Constraints

- Backend is PostgreSQL-backed (not SQLite), via SQLAlchemy + Alembic.
- Access token: JWT, 15-minute TTL, cookie `access_token`.
- Refresh token: opaque random string, 7-day TTL, rotated on every use, only its SHA-256 hash stored in Postgres (`refresh_tokens` table), cookie `refresh_token`.
- Cookie `Domain` attribute and `Secure` flag are both configurable via settings (empty/`false` for local dev over `http://localhost`, `.twistfit.vn`/`true` in production) — never hardcoded.
- CORS allows `https://twistfit.vn` and `http://localhost:3000`, `allow_credentials=True`.
- No SQLite→Postgres data migration. Fresh Postgres schema, reseeded with the two demo accounts (`user@twistfit.vn` / `user1234`, `admin@twistfit.vn` / `admin1234`).
- **Legacy bridge (do not skip):** FastAPI's `/auth/login` also sets, and `/auth/logout` also clears, the legacy `twistfit_session` HMAC-SHA256 cookie using the same algorithm and secret (`AUTH_COOKIE_SECRET`) as the existing `frontend/lib/auth/session.ts`. `frontend/lib/auth/session.ts`, `frontend/lib/auth/users.ts`, and `frontend/app/api/auth/register/*` are **not deleted** — 10 other domains still depend on them. Only `frontend/app/api/auth/login/*` and `frontend/app/api/auth/logout/*` are deleted.
- Every backend domain test runs against a real Postgres test database (via fixtures in `tests/conftest.py`), never mocks or SQLite.
- FastAPI validation errors use the framework's default 422 response; no custom error envelope.
- New Pydantic response/request models use camelCase JSON keys (matching existing frontend TypeScript types) via a shared `CamelModel` base.

---

## Task 1: Backend bootstrap — PostgreSQL, project skeleton, health check

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/main.py`
- Create: `backend/pytest.ini`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_main.py`
- Modify: `backend/requirements.txt` (append new dependencies)
- Delete: `backend/main.py` (replaced by `backend/app/main.py`)

**Interfaces:**
- Produces: `app.core.config.settings` (a `Settings` instance) with fields `database_url: str`, `jwt_secret: str`, `auth_cookie_secret: str`, `cors_origins: str`, `cookie_domain: str | None`, `cookie_secure: bool`, and property `cors_origin_list: list[str]`. Produces: `app.main.app` (the `FastAPI` instance), importable as `from app.main import app`.

- [ ] **Step 1: Install PostgreSQL and create the dev and test databases**

```bash
sudo apt update
sudo apt install -y postgresql
sudo systemctl enable --now postgresql
sudo -u postgres psql -c "CREATE ROLE twistfit WITH LOGIN PASSWORD 'twistfit' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE twistfit_dev OWNER twistfit;"
sudo -u postgres psql -c "CREATE DATABASE twistfit_test OWNER twistfit;"
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\conninfo'` prints a successful connection.

- [ ] **Step 2: Set up the Python virtual environment**

```bash
cd backend
rm -rf venv __pycache__
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
```

- [ ] **Step 3: Add new dependencies to `requirements.txt`**

Append to the existing `backend/requirements.txt` (keep the existing lines):

```
SQLAlchemy==2.0.36
alembic==1.13.2
psycopg[binary]==3.2.3
pydantic-settings==2.6.1
PyJWT==2.9.0
passlib[bcrypt]==1.7.4
httpx==0.27.2
pytest==8.3.3
```

Run: `pip install -r requirements.txt`
Expected: installs cleanly with no dependency conflicts.

- [ ] **Step 4: Write the failing health-check test**

Create `backend/tests/__init__.py` (empty file) and `backend/tests/test_main.py`:

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 5: Add pytest config so `app` imports resolve**

Create `backend/pytest.ini`:

```ini
[pytest]
pythonpath = .
```

- [ ] **Step 6: Run the test and verify it fails**

Run: `cd backend && pytest tests/test_main.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app'`.

- [ ] **Step 7: Create the app package, settings, and FastAPI app**

Create `backend/app/__init__.py` (empty file).

Create `backend/app/core/__init__.py` (empty file).

Create `backend/app/core/config.py`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://twistfit:twistfit@localhost:5432/twistfit_dev"
    jwt_secret: str = "dev-only-insecure-jwt-secret"
    auth_cookie_secret: str = "dev-only-insecure-secret"
    cors_origins: str = "http://localhost:3000"
    cookie_domain: str | None = None
    cookie_secure: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
```

Note: `auth_cookie_secret` defaults to the exact same literal (`'dev-only-insecure-secret'`) that `frontend/lib/auth/session.ts` falls back to when `AUTH_COOKIE_SECRET` is unset, so the legacy cookie bridge works out of the box in local dev without any `.env` file on either side. `cookie_secure` defaults to `False` for local dev over plain HTTP; production `.env` sets it to `true`.

Delete `backend/main.py` (the old `app = FastAPI()` skeleton).

Create `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(title="TwistFit API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 8: Run the test and verify it passes**

Run: `cd backend && pytest tests/test_main.py -v`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
cd backend
git add app pytest.ini tests requirements.txt
git rm main.py
git commit -m "feat: bootstrap FastAPI app with settings and health check"
```

---

## Task 2: Database session module

**Files:**
- Create: `backend/app/db/__init__.py`
- Create: `backend/app/db/session.py`
- Create: `backend/tests/test_db_session.py`

**Interfaces:**
- Consumes: `app.core.config.settings.database_url` (Task 1).
- Produces: `app.db.session.Base` (SQLAlchemy `DeclarativeBase` subclass, used by every domain's `models.py`), `app.db.session.SessionLocal` (session factory), `app.db.session.get_db` (a generator FastAPI dependency yielding a `Session`).

- [ ] **Step 1: Write the failing connectivity test**

Create `backend/tests/test_db_session.py`:

```python
from sqlalchemy import text

from app.db.session import SessionLocal


def test_can_connect_and_query():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT 1")).scalar_one()
        assert result == 1
    finally:
        db.close()
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/test_db_session.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.db'`.

- [ ] **Step 3: Create the session module**

Create `backend/app/db/__init__.py` (empty file).

Create `backend/app/db/session.py`:

```python
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd backend && pytest tests/test_db_session.py -v`
Expected: PASS (requires the `twistfit_dev` database from Task 1 to be running and reachable).

- [ ] **Step 5: Commit**

```bash
cd backend
git add app/db tests/test_db_session.py
git commit -m "feat: add SQLAlchemy session and get_db dependency"
```

---

## Task 3: Security utilities — password hashing, JWT, legacy cookie signing

**Files:**
- Create: `backend/app/core/security.py`
- Create: `backend/tests/domains/__init__.py`
- Create: `backend/tests/domains/auth/__init__.py`
- Create: `backend/tests/domains/auth/test_security.py`

**Interfaces:**
- Consumes: `app.core.config.settings` (Task 1).
- Produces: `hash_password(password: str) -> str`, `verify_password(password: str, password_hash: str) -> bool`, `create_access_token(user_id: int, role: str) -> str`, `decode_access_token(token: str) -> dict | None`, `generate_refresh_token() -> str`, `hash_refresh_token(token: str) -> str`, `create_legacy_session_cookie_value(email: str, role: str) -> str`, and constants `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `LEGACY_SESSION_TTL_SECONDS`, `LEGACY_SESSION_COOKIE_NAME`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/__init__.py` (empty) and `backend/tests/domains/auth/__init__.py` (empty).

Create `backend/tests/domains/auth/test_security.py`:

```python
import base64
import hashlib
import hmac

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_legacy_session_cookie_value,
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


def test_legacy_session_cookie_value_matches_node_hmac_scheme():
    value = create_legacy_session_cookie_value("user@twistfit.vn", "user")
    encoded, signature = value.split(".")

    expected_signature = hmac.new(
        settings.auth_cookie_secret.encode("utf-8"), encoded.encode("utf-8"), hashlib.sha256
    ).digest()
    expected_signature_b64 = base64.urlsafe_b64encode(expected_signature).rstrip(b"=").decode("ascii")
    assert signature == expected_signature_b64

    padded = encoded + "=" * (-len(encoded) % 4)
    payload = base64.urlsafe_b64decode(padded).decode("utf-8")
    assert '"email":"user@twistfit.vn"' in payload
    assert '"role":"user"' in payload
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/auth/test_security.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.core.security'`.

- [ ] **Step 3: Implement security.py**

Create `backend/app/core/security.py`:

```python
import hashlib
import hmac
import json
import secrets
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode

import jwt
from passlib.context import CryptContext

from app.core.config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_TTL_SECONDS = 15 * 60
REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60
LEGACY_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60
LEGACY_SESSION_COOKIE_NAME = "twistfit_session"


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


def _b64url_encode(data: bytes) -> str:
    return urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def create_legacy_session_cookie_value(email: str, role: str) -> str:
    """Mirrors frontend/lib/auth/session.ts's HMAC-SHA256 cookie scheme byte-for-byte
    so the 10 not-yet-migrated Next.js domains keep accepting sessions issued here."""
    payload = {"email": email, "role": role, "exp": int(time.time() * 1000) + LEGACY_SESSION_TTL_SECONDS * 1000}
    encoded = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(settings.auth_cookie_secret.encode("utf-8"), encoded.encode("utf-8"), hashlib.sha256).digest()
    return f"{encoded}.{_b64url_encode(signature)}"
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/auth/test_security.py -v`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd backend
git add app/core/security.py tests/domains
git commit -m "feat: add password hashing, JWT, and legacy cookie signing helpers"
```

---

## Task 4: Auth models, Alembic setup, and test infrastructure

**Files:**
- Create: `backend/app/domains/__init__.py`
- Create: `backend/app/domains/auth/__init__.py`
- Create: `backend/app/domains/auth/models.py`
- Create: `backend/alembic.ini` (generated by `alembic init`, then edited)
- Create: `backend/alembic/env.py` (generated, then edited)
- Create: `backend/alembic/versions/<generated>_create_users_and_refresh_tokens_tables.py` (generated by autogenerate)
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/domains/auth/test_models.py`

**Interfaces:**
- Consumes: `app.db.session.Base`, `app.db.session.get_db`, `app.main.app` (Tasks 1-2).
- Produces: `app.domains.auth.models.User` (columns: `id`, `name`, `email`, `password_hash`, `role`, `is_active`, `created_at`), `app.domains.auth.models.RefreshToken` (columns: `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`). Produces pytest fixtures `db_session` (a `Session` rolled back after each test) and `client` (a `TestClient` with `get_db` overridden to use `db_session`), available to every later test file automatically via `conftest.py`.

- [ ] **Step 1: Write the failing model test**

Create `backend/tests/domains/auth/test_models.py`:

```python
from datetime import datetime, timedelta, timezone

from app.domains.auth.models import RefreshToken, User


def test_can_insert_and_query_user(db_session):
    user = User(name="Test", email="test@example.com", password_hash="hashed", role="user")
    db_session.add(user)
    db_session.flush()

    fetched = db_session.query(User).filter_by(email="test@example.com").one()
    assert fetched.id == user.id
    assert fetched.is_active is True


def test_can_insert_refresh_token_linked_to_user(db_session):
    user = User(name="Test", email="test2@example.com", password_hash="hashed", role="user")
    db_session.add(user)
    db_session.flush()

    token = RefreshToken(
        user_id=user.id,
        token_hash="abc123",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db_session.add(token)
    db_session.flush()

    fetched = db_session.query(RefreshToken).filter_by(token_hash="abc123").one()
    assert fetched.user_id == user.id
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/auth/test_models.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains'` (and no `db_session` fixture yet either).

- [ ] **Step 3: Create the auth models**

Create `backend/app/domains/__init__.py` (empty) and `backend/app/domains/auth/__init__.py` (empty).

Create `backend/app/domains/auth/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="refresh_tokens")
```

- [ ] **Step 4: Initialize Alembic**

```bash
cd backend
alembic init alembic
```

- [ ] **Step 5: Wire Alembic to the app's settings and models**

Replace the generated `backend/alembic/env.py` with:

```python
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import settings
from app.db.session import Base
from app.domains.auth import models as auth_models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(url=settings.database_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

In `backend/alembic.ini`, delete or comment out the generated `sqlalchemy.url = ...` line (it's set programmatically in `env.py` from `settings.database_url` instead).

- [ ] **Step 6: Generate and apply the first migration**

```bash
cd backend
alembic revision --autogenerate -m "create users and refresh_tokens tables"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\dt'` lists `users`, `refresh_tokens`, and `alembic_version`.

- [ ] **Step 7: Write the test fixtures**

Create `backend/tests/conftest.py`:

```python
from collections.abc import Generator

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.session import get_db
from app.main import app

TEST_DATABASE_URL = settings.database_url.replace("twistfit_dev", "twistfit_test")

test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


@pytest.fixture(scope="session", autouse=True)
def _migrated_test_database() -> None:
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    command.upgrade(alembic_cfg, "head")


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
```

- [ ] **Step 8: Run the test and verify it passes**

Run: `cd backend && pytest tests/domains/auth/test_models.py -v`
Expected: PASS (2 tests). The `_migrated_test_database` fixture runs `alembic upgrade head` against `twistfit_test` automatically.

- [ ] **Step 9: Commit**

```bash
cd backend
git add app/domains alembic alembic.ini tests/conftest.py tests/domains/auth/test_models.py
git commit -m "feat: add auth models, Alembic migrations, and Postgres test fixtures"
```

---

## Task 5: Auth service

**Files:**
- Create: `backend/app/domains/auth/service.py`
- Create: `backend/tests/domains/auth/test_service.py`

**Interfaces:**
- Consumes: `app.domains.auth.models.User`, `RefreshToken` (Task 4); `hash_password`, `verify_password`, `create_access_token`, `generate_refresh_token`, `hash_refresh_token`, `REFRESH_TOKEN_TTL_SECONDS` (Task 3).
- Produces: `EmailAlreadyTakenError` (exception), `normalize_email(email: str) -> str`, `get_user_by_email(db, email: str) -> User | None`, `create_user(db, name, email, password, role="user") -> User`, `authenticate_user(db, email, password) -> User | None`, `issue_tokens(db, user) -> tuple[str, str]`, `rotate_refresh_token(db, refresh_token: str) -> tuple[str, str, User] | None`, `revoke_refresh_token(db, refresh_token: str) -> None`, `revoke_all_refresh_tokens_for_user(db, user_id: int) -> None`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/auth/test_service.py`:

```python
import pytest

from app.domains.auth import service


def test_create_user_hashes_password_and_defaults_role(db_session):
    user = service.create_user(db_session, name="Linh", email="Linh@Example.com ", password="password123")
    assert user.email == "linh@example.com"
    assert user.password_hash != "password123"
    assert user.role == "user"


def test_create_user_rejects_duplicate_email(db_session):
    service.create_user(db_session, name="A", email="dup@example.com", password="password123")
    with pytest.raises(service.EmailAlreadyTakenError):
        service.create_user(db_session, name="B", email="dup@example.com", password="password456")


def test_authenticate_user_accepts_correct_password(db_session):
    service.create_user(db_session, name="A", email="auth@example.com", password="password123")
    user = service.authenticate_user(db_session, "auth@example.com", "password123")
    assert user is not None
    assert user.email == "auth@example.com"


def test_authenticate_user_rejects_wrong_password(db_session):
    service.create_user(db_session, name="A", email="auth2@example.com", password="password123")
    assert service.authenticate_user(db_session, "auth2@example.com", "wrong") is None


def test_authenticate_user_rejects_inactive_user(db_session):
    user = service.create_user(db_session, name="A", email="inactive@example.com", password="password123")
    user.is_active = False
    db_session.commit()
    assert service.authenticate_user(db_session, "inactive@example.com", "password123") is None


def test_issue_and_rotate_refresh_token(db_session):
    user = service.create_user(db_session, name="A", email="rotate@example.com", password="password123")
    _access_token, refresh_token = service.issue_tokens(db_session, user)

    rotated = service.rotate_refresh_token(db_session, refresh_token)
    assert rotated is not None
    _new_access_token, new_refresh_token, rotated_user = rotated
    assert new_refresh_token != refresh_token
    assert rotated_user.id == user.id

    assert service.rotate_refresh_token(db_session, refresh_token) is None


def test_revoke_all_refresh_tokens_for_user_blocks_future_rotation(db_session):
    user = service.create_user(db_session, name="A", email="revoke@example.com", password="password123")
    _access_token, refresh_token = service.issue_tokens(db_session, user)

    service.revoke_all_refresh_tokens_for_user(db_session, user.id)

    assert service.rotate_refresh_token(db_session, refresh_token) is None
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/auth/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.auth.service'`.

- [ ] **Step 3: Implement the service**

Create `backend/app/domains/auth/service.py`:

```python
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    REFRESH_TOKEN_TTL_SECONDS,
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.domains.auth.models import RefreshToken, User


class EmailAlreadyTakenError(Exception):
    pass


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.execute(select(User).where(User.email == normalize_email(email))).scalar_one_or_none()


def create_user(db: Session, name: str, email: str, password: str, role: str = "user") -> User:
    if get_user_by_email(db, email) is not None:
        raise EmailAlreadyTakenError(email)

    user = User(name=name, email=normalize_email(email), password_hash=hash_password(password), role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def issue_tokens(db: Session, user: User) -> tuple[str, str]:
    access_token = create_access_token(user_id=user.id, role=user.role)
    refresh_token = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=REFRESH_TOKEN_TTL_SECONDS),
        )
    )
    db.commit()
    return access_token, refresh_token


def rotate_refresh_token(db: Session, refresh_token: str) -> tuple[str, str, User] | None:
    token_hash = hash_refresh_token(refresh_token)
    row = db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash)).scalar_one_or_none()
    if row is None or row.revoked_at is not None or row.expires_at < datetime.now(timezone.utc):
        return None

    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        return None

    row.revoked_at = datetime.now(timezone.utc)
    db.commit()
    access_token, new_refresh_token = issue_tokens(db, user)
    return access_token, new_refresh_token, user


def revoke_refresh_token(db: Session, refresh_token: str) -> None:
    token_hash = hash_refresh_token(refresh_token)
    row = db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash)).scalar_one_or_none()
    if row is not None and row.revoked_at is None:
        row.revoked_at = datetime.now(timezone.utc)
        db.commit()


def revoke_all_refresh_tokens_for_user(db: Session, user_id: int) -> None:
    rows = db.execute(
        select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
    ).scalars()
    now = datetime.now(timezone.utc)
    for row in rows:
        row.revoked_at = now
    db.commit()
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/auth/test_service.py -v`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
cd backend
git add app/domains/auth/service.py tests/domains/auth/test_service.py
git commit -m "feat: add auth service (create, authenticate, refresh token rotation)"
```

---

## Task 6: Auth dependencies (`get_current_user`, `require_admin`)

**Files:**
- Create: `backend/app/deps.py`
- Create: `backend/tests/domains/auth/test_deps.py`

**Interfaces:**
- Consumes: `decode_access_token` (Task 3); `app.domains.auth.models.User`, `app.domains.auth.service` (Tasks 4-5); `get_db` (Task 2).
- Produces: `get_current_user(access_token: str | None, db: Session) -> User` (raises `HTTPException(401)`), `require_admin(user: User) -> User` (raises `HTTPException(403)`). Both are plain FastAPI dependency callables, usable both via `Depends(...)` in routers and by calling them directly in tests.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/auth/test_deps.py`:

```python
import pytest
from fastapi import HTTPException

from app.core.security import create_access_token
from app.deps import get_current_user, require_admin
from app.domains.auth import service


def test_get_current_user_rejects_missing_cookie(db_session):
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(access_token=None, db=db_session)
    assert exc_info.value.status_code == 401


def test_get_current_user_rejects_invalid_token(db_session):
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(access_token="garbage", db=db_session)
    assert exc_info.value.status_code == 401


def test_get_current_user_returns_user_for_valid_token(db_session):
    user = service.create_user(db_session, name="A", email="deps@example.com", password="password123")
    token = create_access_token(user_id=user.id, role=user.role)

    result = get_current_user(access_token=token, db=db_session)
    assert result.id == user.id


def test_get_current_user_rejects_inactive_user(db_session):
    user = service.create_user(db_session, name="A", email="deps2@example.com", password="password123")
    token = create_access_token(user_id=user.id, role=user.role)
    user.is_active = False
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(access_token=token, db=db_session)
    assert exc_info.value.status_code == 401


def test_require_admin_rejects_non_admin(db_session):
    user = service.create_user(db_session, name="A", email="deps3@example.com", password="password123")
    with pytest.raises(HTTPException) as exc_info:
        require_admin(user=user)
    assert exc_info.value.status_code == 403


def test_require_admin_accepts_admin(db_session):
    user = service.create_user(
        db_session, name="A", email="deps4@example.com", password="password123", role="admin"
    )
    assert require_admin(user=user).id == user.id
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/auth/test_deps.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.deps'`.

- [ ] **Step 3: Implement deps.py**

Create `backend/app/deps.py`:

```python
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.domains.auth.models import User


def get_current_user(
    access_token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> User:
    if access_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(access_token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return user


def require_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/auth/test_deps.py -v`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd backend
git add app/deps.py tests/domains/auth/test_deps.py
git commit -m "feat: add get_current_user and require_admin dependencies"
```

---

## Task 7: Auth router — register, login, logout, refresh, me

**Files:**
- Create: `backend/app/domains/auth/schemas.py`
- Create: `backend/app/domains/auth/router.py`
- Modify: `backend/app/main.py` (mount the router)
- Create: `backend/tests/domains/auth/test_router.py`

**Interfaces:**
- Consumes: `service.*` (Task 5), `get_current_user` (Task 6), `LEGACY_SESSION_COOKIE_NAME`, `create_legacy_session_cookie_value`, TTL constants (Task 3).
- Produces: `app.domains.auth.schemas.CamelModel` (reused by the FAQ domain in Task 10), `RegisterRequest`, `LoginRequest`, `UserResponse`, `AccountResponse`. Produces: `app.domains.auth.router.router`, an `APIRouter` mounted at prefix `/auth` with routes `POST /register`, `POST /login`, `POST /logout`, `POST /refresh`, `GET /me`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/auth/test_router.py`:

```python
def test_register_creates_user(client):
    response = client.post(
        "/auth/register", json={"name": "Linh", "email": "reg@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "reg@example.com"
    assert body["role"] == "user"
    assert "id" in body


def test_register_rejects_duplicate_email(client):
    client.post("/auth/register", json={"name": "A", "email": "dup@example.com", "password": "password123"})
    response = client.post(
        "/auth/register", json={"name": "B", "email": "dup@example.com", "password": "password456"}
    )
    assert response.status_code == 409


def test_login_sets_cookies_and_returns_account(client):
    client.post(
        "/auth/register", json={"name": "Linh", "email": "login@example.com", "password": "password123"}
    )
    response = client.post("/auth/login", json={"email": "login@example.com", "password": "password123"})
    assert response.status_code == 200
    assert response.json() == {"name": "Linh", "email": "login@example.com", "role": "user"}
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies
    assert "twistfit_session" in response.cookies


def test_login_rejects_wrong_password(client):
    client.post(
        "/auth/register", json={"name": "Linh", "email": "wrongpw@example.com", "password": "password123"}
    )
    response = client.post("/auth/login", json={"email": "wrongpw@example.com", "password": "nope"})
    assert response.status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_returns_account_when_authenticated(client):
    client.post("/auth/register", json={"name": "Linh", "email": "me@example.com", "password": "password123"})
    client.post("/auth/login", json={"email": "me@example.com", "password": "password123"})
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


def test_refresh_rotates_tokens(client):
    client.post(
        "/auth/register", json={"name": "Linh", "email": "refresh@example.com", "password": "password123"}
    )
    client.post("/auth/login", json={"email": "refresh@example.com", "password": "password123"})
    old_refresh_cookie = client.cookies.get("refresh_token")

    response = client.post("/auth/refresh")
    assert response.status_code == 200
    assert client.cookies.get("refresh_token") != old_refresh_cookie


def test_refresh_rejects_missing_cookie(client):
    response = client.post("/auth/refresh")
    assert response.status_code == 401


def test_logout_clears_cookies(client):
    client.post(
        "/auth/register", json={"name": "Linh", "email": "logout@example.com", "password": "password123"}
    )
    client.post("/auth/login", json={"email": "logout@example.com", "password": "password123"})

    response = client.post("/auth/logout")
    assert response.status_code == 200
    response_after = client.get("/auth/me")
    assert response_after.status_code == 401
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/auth/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.auth.schemas'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/auth/schemas.py`:

```python
from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class RegisterRequest(CamelModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class UserResponse(CamelModel):
    id: int
    name: str
    email: str
    role: str


class AccountResponse(CamelModel):
    name: str
    email: str
    role: str
```

- [ ] **Step 4: Write the router**

Create `backend/app/domains/auth/router.py`:

```python
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    ACCESS_TOKEN_TTL_SECONDS,
    LEGACY_SESSION_COOKIE_NAME,
    LEGACY_SESSION_TTL_SECONDS,
    REFRESH_TOKEN_TTL_SECONDS,
    create_legacy_session_cookie_value,
)
from app.db.session import get_db
from app.deps import get_current_user
from app.domains.auth import service
from app.domains.auth.models import User
from app.domains.auth.schemas import AccountResponse, LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookies(response: Response, user: User, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        "access_token", access_token, httponly=True, secure=settings.cookie_secure, samesite="lax",
        domain=settings.cookie_domain, max_age=ACCESS_TOKEN_TTL_SECONDS, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh_token, httponly=True, secure=settings.cookie_secure, samesite="lax",
        domain=settings.cookie_domain, max_age=REFRESH_TOKEN_TTL_SECONDS, path="/",
    )
    response.set_cookie(
        LEGACY_SESSION_COOKIE_NAME, create_legacy_session_cookie_value(user.email, user.role),
        httponly=True, secure=settings.cookie_secure, samesite="lax",
        domain=settings.cookie_domain, max_age=LEGACY_SESSION_TTL_SECONDS, path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    for name in ("access_token", "refresh_token", LEGACY_SESSION_COOKIE_NAME):
        response.delete_cookie(name, domain=settings.cookie_domain, path="/")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> User:
    try:
        return service.create_user(db, name=body.name, email=body.email, password=body.password)
    except service.EmailAlreadyTakenError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="EMAIL_TAKEN")


@router.post("/login", response_model=AccountResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)) -> User:
    user = service.authenticate_user(db, body.email, body.password)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="INVALID_CREDENTIALS")

    access_token, refresh_token = service.issue_tokens(db, user)
    _set_auth_cookies(response, user, access_token, refresh_token)
    return user


@router.post("/logout")
def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    if refresh_token:
        service.revoke_refresh_token(db, refresh_token)
    _clear_auth_cookies(response)
    return {"ok": True}


@router.post("/refresh", response_model=AccountResponse)
def refresh(
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if refresh_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MISSING_REFRESH_TOKEN")

    rotated = service.rotate_refresh_token(db, refresh_token)
    if rotated is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="INVALID_REFRESH_TOKEN")

    new_access_token, new_refresh_token, user = rotated
    _set_auth_cookies(response, user, new_access_token, new_refresh_token)
    return user


@router.get("/me", response_model=AccountResponse)
def me(user: User = Depends(get_current_user)) -> User:
    return user
```

- [ ] **Step 5: Mount the router**

Modify `backend/app/main.py` — add the import and mount call:

```python
from app.domains.auth.router import router as auth_router
```

Add after the `CORSMiddleware` block:

```python
app.include_router(auth_router)
```

- [ ] **Step 6: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/auth/test_router.py -v`
Expected: PASS (9 tests).

- [ ] **Step 7: Run the full backend test suite**

Run: `cd backend && pytest -v`
Expected: all tests across every prior task still PASS.

- [ ] **Step 8: Commit**

```bash
cd backend
git add app/domains/auth/schemas.py app/domains/auth/router.py app/main.py tests/domains/auth/test_router.py
git commit -m "feat: add auth router with legacy cookie bridge"
```

---

## Task 8: Demo user seeding

**Files:**
- Create: `backend/app/domains/auth/seed.py`
- Modify: `backend/app/main.py` (seed on startup via lifespan)
- Create: `backend/tests/domains/auth/test_seed.py`

**Interfaces:**
- Consumes: `service.get_user_by_email`, `service.create_user` (Task 5); `SessionLocal` (Task 2).
- Produces: `seed_demo_users(db: Session) -> None`, idempotent.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/auth/test_seed.py`:

```python
from app.domains.auth import service
from app.domains.auth.models import User
from app.domains.auth.seed import seed_demo_users


def test_seed_demo_users_creates_both_accounts(db_session):
    seed_demo_users(db_session)
    user = service.get_user_by_email(db_session, "user@twistfit.vn")
    admin = service.get_user_by_email(db_session, "admin@twistfit.vn")
    assert user is not None and user.role == "user"
    assert admin is not None and admin.role == "admin"


def test_seed_demo_users_is_idempotent(db_session):
    seed_demo_users(db_session)
    seed_demo_users(db_session)
    count = db_session.query(User).filter(User.email == "admin@twistfit.vn").count()
    assert count == 1
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/auth/test_seed.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.auth.seed'`.

- [ ] **Step 3: Implement the seed module**

Create `backend/app/domains/auth/seed.py`:

```python
from sqlalchemy.orm import Session

from app.domains.auth import service

DEMO_USERS = [
    {"name": "Người dùng Test", "email": "user@twistfit.vn", "password": "user1234", "role": "user"},
    {"name": "Quản trị viên Test", "email": "admin@twistfit.vn", "password": "admin1234", "role": "admin"},
]


def seed_demo_users(db: Session) -> None:
    for demo in DEMO_USERS:
        if service.get_user_by_email(db, demo["email"]) is None:
            service.create_user(
                db, name=demo["name"], email=demo["email"], password=demo["password"], role=demo["role"]
            )
```

- [ ] **Step 4: Wire seeding into app startup**

Modify `backend/app/main.py`. Add imports:

```python
from contextlib import asynccontextmanager

from app.db.session import SessionLocal
from app.domains.auth.seed import seed_demo_users
```

Replace `app = FastAPI(title="TwistFit API")` with:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        seed_demo_users(db)
    finally:
        db.close()
    yield


app = FastAPI(title="TwistFit API", lifespan=lifespan)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/auth/test_seed.py -v`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/auth/seed.py app/main.py tests/domains/auth/test_seed.py
git commit -m "feat: seed demo user accounts on startup"
```

---

## Task 9: FAQ models, migration, and seed data

**Files:**
- Create: `backend/app/domains/faq/__init__.py`
- Create: `backend/app/domains/faq/models.py`
- Create: `backend/app/domains/faq/seed.py`
- Modify: `backend/alembic/env.py` (register the faq models for autogenerate)
- Modify: `backend/app/main.py` (seed FAQ on startup)
- Create: `backend/alembic/versions/<generated>_create_faq_items_table.py` (generated by autogenerate)
- Create: `backend/tests/domains/faq/__init__.py`
- Create: `backend/tests/domains/faq/test_seed.py`

**Interfaces:**
- Consumes: `app.db.session.Base` (Task 2).
- Produces: `app.domains.faq.models.FaqItem` (columns: `id`, `categories` (`ARRAY(String)`), `question`, `answer_markdown`, `highlight_icon`, `highlight_text`, `created_at`, `updated_at`), `seed_demo_faq_items(db: Session) -> None`.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/domains/faq/__init__.py` (empty).

Create `backend/tests/domains/faq/test_seed.py`:

```python
from app.domains.faq.models import FaqItem
from app.domains.faq.seed import seed_demo_faq_items


def test_seed_demo_faq_items_creates_six_items(db_session):
    seed_demo_faq_items(db_session)
    assert db_session.query(FaqItem).count() == 6


def test_seed_demo_faq_items_is_idempotent(db_session):
    seed_demo_faq_items(db_session)
    seed_demo_faq_items(db_session)
    assert db_session.query(FaqItem).count() == 6
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd backend && pytest tests/domains/faq/test_seed.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.faq'`.

- [ ] **Step 3: Create the FAQ model**

Create `backend/app/domains/faq/__init__.py` (empty).

Create `backend/app/domains/faq/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import ARRAY, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class FaqItem(Base):
    __tablename__ = "faq_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    categories: Mapped[list[str]] = mapped_column(ARRAY(String(50)), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    highlight_icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    highlight_text: Mapped[str | None] = mapped_column(Text, nullable=True)
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

Modify `backend/alembic/env.py` — add this line next to the existing auth models import:

```python
from app.domains.faq import models as faq_models  # noqa: F401
```

- [ ] **Step 5: Generate and apply the migration**

```bash
cd backend
alembic revision --autogenerate -m "create faq_items table"
alembic upgrade head
```

Verify: `PGPASSWORD=twistfit psql -h localhost -U twistfit -d twistfit_dev -c '\d faq_items'` shows the expected columns.

- [ ] **Step 6: Write the seed data**

Create `backend/app/domains/faq/seed.py`:

```python
from sqlalchemy.orm import Session

from app.domains.faq.models import FaqItem

DEMO_FAQ_ITEMS = [
    {
        "categories": ["personal-color"],
        "question": "Personal Color Test trên TwistFit hoạt động như thế nào qua camera?",
        "answer_markdown": (
            "Thuật toán độc quyền của TwistFit tích hợp mô hình thị giác máy tính chuyên sâu để phân tích "
            "phổ màu tự nhiên của khuôn mặt bạn theo thời gian thực.\n\n"
            "- **Định vị sắc tố:** Tách nền và nhận diện độ sáng, độ bão hòa trên da, mắt và viền môi.\n"
            "- **Đối soát Undertone:** Kiểm tra mức độ phản ứng quang phổ giữa Warm (ấm) và Cool (lạnh).\n"
            "- **Phân nhóm 16 sắc độ:** Phân loại chi tiết theo hệ 4 mùa kinh điển."
        ),
        "highlight_icon": "palette",
        "highlight_text": "Quy trình 3 bước cốt lõi.",
    },
    {
        "categories": ["personal-color"],
        "question": "Tôi cần chuẩn bị điều kiện ánh sáng và góc chụp thế nào để kết quả chính xác nhất?",
        "answer_markdown": (
            "Độ chính xác của bài kiểm tra màu phụ thuộc đáng kể vào nguồn sáng xung quanh. "
            "Chúng tôi khuyến nghị:\n\n"
            "- **Ánh sáng tự nhiên:** Chụp cạnh cửa sổ ban ngày, tránh đèn huỳnh quang vàng/trắng gắt.\n"
            "- **Mặt mộc hoàn toàn:** Tẩy trang sạch sẽ, không dùng kem chống nắng nâng tông hay kính áp tròng màu.\n"
            "- **Góc mặt chính diện:** Giữ camera ngang tầm mắt, vén tóc mái để lộ rõ trán và tai."
        ),
        "highlight_icon": "wb_sunny",
        "highlight_text": "Ánh sáng tự nhiên, mặt mộc, góc chính diện.",
    },
    {
        "categories": ["fitting-room"],
        "question": "Tính năng Thử Đồ Ảo (AI Virtual Fitting) có giữ đúng tỷ lệ vóc dáng của tôi không?",
        "answer_markdown": (
            "Hoàn toàn chính xác! Hệ thống Virtual Fitting của TwistFit sử dụng mạng nơ-ron "
            "**DensePose kết hợp 3D Neural Mesh** để tái cấu trúc hình thể người dùng từ ảnh toàn thân mà "
            "không làm biến dạng tỷ lệ chân thực.\n\n"
            "Vải của từng bộ trang phục được gán thông số vật lý riêng biệt (độ rũ của lụa, độ cứng của denim, "
            "độ bóng của da nhân tạo), giúp phản chiếu độ ôm sát và chuyển động theo đúng số đo eo, ngực và "
            "chiều dài tay chân của bạn."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["personal-color", "account"],
        "question": "Nếu dùng máy tính (Laptop/PC) thì tôi làm bài test Personal Color như thế nào?",
        "answer_markdown": (
            "Để đảm bảo chất lượng cảm biến camera tốt nhất (do webcam laptop thường có độ phân giải và cân "
            "bằng trắng thấp), TwistFit áp dụng công nghệ **Đồng Bộ Liên Màn Hình (Cross-device Sync)**: khi "
            "bắt đầu làm bài test trên màn hình lớn, một mã QR duy nhất sẽ xuất hiện. Bạn chỉ cần bật camera "
            "điện thoại quét mã để đo sắc tố, kết quả sẽ đồng bộ hiển thị ngay lập tức lên màn hình máy tính."
        ),
        "highlight_icon": "qr_code_scanner",
        "highlight_text": "Quét mã QR liền mạch.",
    },
    {
        "categories": ["account"],
        "question": "Báo cáo Personal Color sau khi test có được lưu lại không và tải về ở đâu?",
        "answer_markdown": (
            "Tất cả các lượt phân tích màu sắc và cấu trúc hình thể đều được lưu vĩnh viễn trong hồ sơ của bạn:\n\n"
            "- Truy cập menu góc phải: chọn **\"Kết quả đánh giá\"** để xem lại mọi bảng màu (Best Colors & Worst Colors).\n"
            "- Bạn có thể bấm nút **\"Xuất Báo Cáo PDF\"** để nhận cuốn cẩm nang phối đồ cá nhân hóa chuẩn tạp chí thời trang."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["account", "stylist"],
        "question": "Dữ liệu hình ảnh khuôn mặt của tôi có được bảo mật không?",
        "answer_markdown": (
            "TwistFit đặt quyền riêng tư và an toàn dữ liệu của bạn lên ưu tiên hàng đầu. Ảnh chân dung chụp "
            "qua camera chỉ được trích xuất ma trận giá trị màu (RGB/Lab) ngay trên phiên làm việc và tự động "
            "hủy sau khi tạo báo cáo. Chúng tôi không bao giờ bán, chia sẻ hoặc dùng dữ liệu khuôn mặt cho bên thứ ba."
        ),
        "highlight_icon": "verified_user",
        "highlight_text": "Chính sách không lưu trữ hình ảnh gốc thô (Raw Images).",
    },
]


def seed_demo_faq_items(db: Session) -> None:
    if db.query(FaqItem).count() > 0:
        return
    for item in DEMO_FAQ_ITEMS:
        db.add(FaqItem(**item))
    db.commit()
```

- [ ] **Step 7: Wire FAQ seeding into app startup**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.faq.seed import seed_demo_faq_items
```

In the `lifespan` function, call it alongside the user seeding:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    db = SessionLocal()
    try:
        seed_demo_users(db)
        seed_demo_faq_items(db)
    finally:
        db.close()
    yield
```

- [ ] **Step 8: Run the test and verify it passes**

Run: `cd backend && pytest tests/domains/faq/test_seed.py -v`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
cd backend
git add app/domains/faq alembic/env.py alembic/versions app/main.py tests/domains/faq
git commit -m "feat: add FAQ model, migration, and seed data"
```

---

## Task 10: FAQ schemas and service

**Files:**
- Create: `backend/app/domains/faq/schemas.py`
- Create: `backend/app/domains/faq/service.py`
- Create: `backend/tests/domains/faq/test_service.py`

**Interfaces:**
- Consumes: `app.domains.auth.schemas.CamelModel` (Task 7); `app.domains.faq.models.FaqItem` (Task 9).
- Produces: `FAQ_CATEGORIES: list[str]`, `FAQ_HIGHLIGHT_ICONS: list[str]`, `FaqItemInput` (Pydantic model with validation), `FaqItemResponse`; `list_faq_items(db) -> list[FaqItem]`, `get_faq_item(db, item_id) -> FaqItem | None`, `create_faq_item(db, data: FaqItemInput) -> FaqItem`, `update_faq_item(db, item_id, data: FaqItemInput) -> FaqItem | None`, `delete_faq_item(db, item_id) -> bool`.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/faq/test_service.py`:

```python
import pytest
from pydantic import ValidationError

from app.domains.faq import service
from app.domains.faq.schemas import FaqItemInput

VALID_INPUT = {
    "categories": ["account"],
    "question": "Câu hỏi mẫu?",
    "answerMarkdown": "Trả lời mẫu.",
    "highlightIcon": "info",
    "highlightText": "Ghi chú.",
}


def test_create_faq_item(db_session):
    item = service.create_faq_item(db_session, FaqItemInput(**VALID_INPUT))
    assert item.id is not None
    assert item.question == "Câu hỏi mẫu?"
    assert item.categories == ["account"]


def test_list_faq_items_orders_by_id(db_session):
    first = service.create_faq_item(db_session, FaqItemInput(**VALID_INPUT))
    second = service.create_faq_item(db_session, FaqItemInput(**{**VALID_INPUT, "question": "Câu hỏi 2?"}))
    items = service.list_faq_items(db_session)
    assert [item.id for item in items] == [first.id, second.id]


def test_get_faq_item_returns_none_when_missing(db_session):
    assert service.get_faq_item(db_session, 99999) is None


def test_update_faq_item(db_session):
    item = service.create_faq_item(db_session, FaqItemInput(**VALID_INPUT))
    updated = service.update_faq_item(
        db_session, item.id, FaqItemInput(**{**VALID_INPUT, "question": "Câu hỏi đã sửa?"})
    )
    assert updated is not None
    assert updated.question == "Câu hỏi đã sửa?"


def test_update_faq_item_returns_none_when_missing(db_session):
    assert service.update_faq_item(db_session, 99999, FaqItemInput(**VALID_INPUT)) is None


def test_delete_faq_item(db_session):
    item = service.create_faq_item(db_session, FaqItemInput(**VALID_INPUT))
    assert service.delete_faq_item(db_session, item.id) is True
    assert service.get_faq_item(db_session, item.id) is None


def test_delete_faq_item_returns_false_when_missing(db_session):
    assert service.delete_faq_item(db_session, 99999) is False


def test_faq_item_input_rejects_blank_question():
    with pytest.raises(ValidationError):
        FaqItemInput(**{**VALID_INPUT, "question": "   "})


def test_faq_item_input_rejects_empty_categories():
    with pytest.raises(ValidationError):
        FaqItemInput(**{**VALID_INPUT, "categories": []})


def test_faq_item_input_rejects_invalid_highlight_icon():
    with pytest.raises(ValidationError):
        FaqItemInput(**{**VALID_INPUT, "highlightIcon": "not-a-real-icon"})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/faq/test_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.faq.schemas'`.

- [ ] **Step 3: Write the schemas**

Create `backend/app/domains/faq/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

FAQ_CATEGORIES = ["personal-color", "fitting-room", "account", "stylist"]
FAQ_HIGHLIGHT_ICONS = [
    "palette",
    "wb_sunny",
    "face_retouching_off",
    "center_focus_strong",
    "qr_code_scanner",
    "verified_user",
    "info",
    "lightbulb",
]


class FaqItemInput(CamelModel):
    categories: list[str]
    question: str
    answer_markdown: str
    highlight_icon: str | None = None
    highlight_text: str | None = None

    @field_validator("question")
    @classmethod
    def question_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Câu hỏi không được để trống")
        return value.strip()

    @field_validator("answer_markdown")
    @classmethod
    def answer_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Câu trả lời không được để trống")
        return value.strip()

    @field_validator("categories")
    @classmethod
    def categories_valid_and_non_empty(cls, value: list[str]) -> list[str]:
        filtered = [category for category in value if category in FAQ_CATEGORIES]
        if not filtered:
            raise ValueError("Chọn ít nhất 1 chuyên mục")
        return filtered

    @field_validator("highlight_icon")
    @classmethod
    def highlight_icon_valid(cls, value: str | None) -> str | None:
        if value is not None and value not in FAQ_HIGHLIGHT_ICONS:
            raise ValueError("Icon không hợp lệ")
        return value

    @field_validator("highlight_text")
    @classmethod
    def normalize_highlight_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class FaqItemResponse(CamelModel):
    id: int
    categories: list[str]
    question: str
    answer_markdown: str
    highlight_icon: str | None
    highlight_text: str | None
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 4: Write the service**

Create `backend/app/domains/faq/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.faq.models import FaqItem
from app.domains.faq.schemas import FaqItemInput


def list_faq_items(db: Session) -> list[FaqItem]:
    return db.query(FaqItem).order_by(FaqItem.id.asc()).all()


def get_faq_item(db: Session, item_id: int) -> FaqItem | None:
    return db.get(FaqItem, item_id)


def create_faq_item(db: Session, data: FaqItemInput) -> FaqItem:
    item = FaqItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_faq_item(db: Session, item_id: int, data: FaqItemInput) -> FaqItem | None:
    item = get_faq_item(db, item_id)
    if item is None:
        return None
    for field, value in data.model_dump().items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_faq_item(db: Session, item_id: int) -> bool:
    item = get_faq_item(db, item_id)
    if item is None:
        return False
    db.delete(item)
    db.commit()
    return True
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/faq/test_service.py -v`
Expected: PASS (10 tests).

- [ ] **Step 6: Commit**

```bash
cd backend
git add app/domains/faq/schemas.py app/domains/faq/service.py tests/domains/faq/test_service.py
git commit -m "feat: add FAQ schemas with validation and service"
```

---

## Task 11: FAQ router

**Files:**
- Create: `backend/app/domains/faq/router.py`
- Modify: `backend/app/main.py` (mount the router)
- Create: `backend/tests/domains/faq/test_router.py`

**Interfaces:**
- Consumes: `service.*` (Task 10), `require_admin` (Task 6).
- Produces: `app.domains.faq.router.router`, an `APIRouter` mounted at prefix `/faq` with routes `GET /`, `GET /{item_id}`, `POST /` (admin), `PUT /{item_id}` (admin), `DELETE /{item_id}` (admin).

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/faq/test_router.py`:

```python
def _register_and_login(client, email: str) -> None:
    client.post("/auth/register", json={"name": "Test", "email": email, "password": "password123"})
    client.post("/auth/login", json={"email": email, "password": "password123"})


def test_list_faq_items_is_public(client):
    response = client.get("/faq")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_faq_item_returns_404_when_missing(client):
    response = client.get("/faq/99999")
    assert response.status_code == 404


def test_create_faq_item_requires_authentication(client):
    response = client.post(
        "/faq",
        json={"categories": ["account"], "question": "Q?", "answerMarkdown": "A.", "highlightIcon": None, "highlightText": None},
    )
    assert response.status_code == 401


def test_create_faq_item_requires_admin_role(client, db_session):
    _register_and_login(client, "faq-user@example.com")
    response = client.post(
        "/faq",
        json={"categories": ["account"], "question": "Q?", "answerMarkdown": "A.", "highlightIcon": None, "highlightText": None},
    )
    assert response.status_code == 403


def test_admin_can_create_get_update_and_delete_faq_item(client, db_session):
    from app.domains.auth.models import User

    client.post("/auth/register", json={"name": "Admin", "email": "faq-admin@example.com", "password": "password123"})
    db_session.query(User).filter(User.email == "faq-admin@example.com").update({"role": "admin"})
    db_session.commit()
    client.post("/auth/login", json={"email": "faq-admin@example.com", "password": "password123"})

    create_response = client.post(
        "/faq",
        json={
            "categories": ["account"],
            "question": "Câu hỏi mới?",
            "answerMarkdown": "Trả lời mới.",
            "highlightIcon": "info",
            "highlightText": None,
        },
    )
    assert create_response.status_code == 201
    item_id = create_response.json()["id"]

    get_response = client.get(f"/faq/{item_id}")
    assert get_response.status_code == 200
    assert get_response.json()["question"] == "Câu hỏi mới?"

    update_response = client.put(
        f"/faq/{item_id}",
        json={
            "categories": ["account"],
            "question": "Câu hỏi đã sửa?",
            "answerMarkdown": "Trả lời mới.",
            "highlightIcon": "info",
            "highlightText": None,
        },
    )
    assert update_response.status_code == 200
    assert update_response.json()["question"] == "Câu hỏi đã sửa?"

    delete_response = client.delete(f"/faq/{item_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/faq/{item_id}").status_code == 404


def test_create_faq_item_rejects_invalid_body(client, db_session):
    from app.domains.auth.models import User

    client.post("/auth/register", json={"name": "Admin", "email": "faq-admin2@example.com", "password": "password123"})
    db_session.query(User).filter(User.email == "faq-admin2@example.com").update({"role": "admin"})
    db_session.commit()
    client.post("/auth/login", json={"email": "faq-admin2@example.com", "password": "password123"})

    response = client.post(
        "/faq",
        json={"categories": [], "question": "", "answerMarkdown": "", "highlightIcon": None, "highlightText": None},
    )
    assert response.status_code == 422
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd backend && pytest tests/domains/faq/test_router.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.domains.faq.router'`.

- [ ] **Step 3: Write the router**

Create `backend/app/domains/faq/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import require_admin
from app.domains.faq import service
from app.domains.faq.schemas import FaqItemInput, FaqItemResponse

router = APIRouter(prefix="/faq", tags=["faq"])


@router.get("", response_model=list[FaqItemResponse])
def list_items(db: Session = Depends(get_db)):
    return service.list_faq_items(db)


@router.get("/{item_id}", response_model=FaqItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = service.get_faq_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu hỏi")
    return item


@router.post("", response_model=FaqItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(body: FaqItemInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    return service.create_faq_item(db, body)


@router.put("/{item_id}", response_model=FaqItemResponse)
def update_item(item_id: int, body: FaqItemInput, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    updated = service.update_faq_item(db, item_id, body)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu hỏi")
    return updated


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    deleted = service.delete_faq_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu hỏi")
```

- [ ] **Step 4: Mount the router**

Modify `backend/app/main.py` — add the import:

```python
from app.domains.faq.router import router as faq_router
```

Add after `app.include_router(auth_router)`:

```python
app.include_router(faq_router)
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd backend && pytest tests/domains/faq/test_router.py -v`
Expected: PASS (7 tests).

- [ ] **Step 6: Run the entire backend test suite**

Run: `cd backend && pytest -v`
Expected: every test across all 11 backend tasks PASSES.

- [ ] **Step 7: Commit**

```bash
cd backend
git add app/domains/faq/router.py app/main.py tests/domains/faq/test_router.py
git commit -m "feat: add FAQ router with public reads and admin-gated writes"
```

---

## Task 12: Deployment artifacts and pattern documentation

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/docker-compose.yml`
- Create: `backend/.env.example`
- Create: `backend/README.md`

**Interfaces:**
- Consumes: environment variable names already read by `app.core.config.Settings` (Task 1): `DATABASE_URL`, `JWT_SECRET`, `AUTH_COOKIE_SECRET`, `CORS_ORIGINS`, `COOKIE_DOMAIN`, `COOKIE_SECURE`.

- [ ] **Step 1: Write the Dockerfile**

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Write docker-compose.yml**

Create `backend/docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: twistfit
      POSTGRES_PASSWORD: twistfit
      POSTGRES_DB: twistfit_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000
    env_file:
      - .env
    depends_on:
      - db
    ports:
      - "8000:8000"

volumes:
  postgres_data:
```

- [ ] **Step 3: Write .env.example**

Create `backend/.env.example`:

```
# Must match frontend/.env's AUTH_COOKIE_SECRET exactly — both sides sign/verify
# the same legacy twistfit_session cookie during the multi-phase migration.
DATABASE_URL=postgresql+psycopg://twistfit:twistfit@db:5432/twistfit_dev
JWT_SECRET=change-me-in-production
AUTH_COOKIE_SECRET=change-me-in-production
CORS_ORIGINS=https://twistfit.vn,http://localhost:3000
COOKIE_DOMAIN=.twistfit.vn
COOKIE_SECURE=true
```

- [ ] **Step 4: Write the pattern documentation**

Create `backend/README.md`:

```markdown
# TwistFit Backend (FastAPI)

## Local setup

1. Install PostgreSQL and create `twistfit_dev` / `twistfit_test` databases (see
   `docs/superpowers/plans/2026-09-13-fastapi-backend-foundation.md`, Task 1,
   in the frontend repo for exact commands).
2. `python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and adjust values for local dev (in particular
   set `COOKIE_SECURE=false` and leave `COOKIE_DOMAIN` unset for `localhost`).
4. `alembic upgrade head`
5. `uvicorn app.main:app --reload`

## Adding a new domain

Each domain under `app/domains/<name>/` is self-contained:

- `models.py` — SQLAlchemy models, subclassing `app.db.session.Base`.
- `schemas.py` — Pydantic request/response schemas. Extend
  `app.domains.auth.schemas.CamelModel` so JSON keys are camelCase, matching
  the frontend's existing TypeScript types.
- `service.py` — business logic, taking a `Session` as an explicit parameter.
- `router.py` — FastAPI routes, mounted in `app/main.py` via
  `app.include_router(...)`.

Tests mirror the same shape under `tests/domains/<name>/`, using the
`db_session` and `client` fixtures from `tests/conftest.py` (no mocks, no
SQLite — always the real Postgres test database).

To add tables for a new domain: add
`from app.domains.<name> import models as <name>_models  # noqa: F401` to
`alembic/env.py`, then run `alembic revision --autogenerate -m "..."` and
`alembic upgrade head`.

Protect an authenticated route with `Depends(app.deps.get_current_user)`;
protect an admin-only route with `Depends(app.deps.require_admin)`.

## Legacy bridge — remove only once forum, quiz-attempts, and every other
## still-Next.js domain has its own migration phase

`/auth/login` and `/auth/logout` also manage a legacy `twistfit_session`
cookie (see `app/core/security.py::create_legacy_session_cookie_value`) so
the 10 domains not yet migrated off Next.js/SQLite keep working. Do not
remove this, or `AUTH_COOKIE_SECRET`, until those domains are migrated.
```

- [ ] **Step 5: Review checklist (no automated test — Docker is not installed in this environment)**

Manually verify:
- `docker-compose.yml` and `Dockerfile` are valid YAML/Dockerfile syntax (no tabs, correct indentation, no stray characters).
- Every environment variable referenced in `docker-compose.yml` (`env_file: .env`) is documented in `.env.example`.
- `backend/README.md` renders correctly (check heading levels and code fences).

- [ ] **Step 6: Commit**

```bash
cd backend
git add Dockerfile docker-compose.yml .env.example README.md
git commit -m "docs: add deployment artifacts and per-domain pattern guide"
```

---

## Task 13: Frontend `apiClient` helper

**Files:**
- Create: `frontend/lib/apiClient.ts`
- Create: `frontend/lib/apiClient.test.ts`
- Create: `frontend/.env.example`

**Interfaces:**
- Produces: `apiFetch(path: string, init?: RequestInit): Promise<Response>` — prefixes `path` with `process.env.NEXT_PUBLIC_API_BASE_URL`, always sets `credentials: 'include'`, and on a `401` response (except for `/auth/login`, `/auth/register`, `/auth/refresh` themselves) makes one `POST /auth/refresh` attempt and retries the original request once before giving up.

- [ ] **Step 1: Write the failing tests**

Create `frontend/lib/apiClient.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './apiClient'

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.twistfit.vn')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('calls the API base URL with credentials included', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    await apiFetch('/faq')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.twistfit.vn/faq',
      expect.objectContaining({ credentials: 'include' })
    )
  })

  it('retries once via refresh when a request gets a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const response = await apiFetch('/auth/me')

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.twistfit.vn/auth/refresh')
    expect(response.ok).toBe(true)
  })

  it('does not retry when the refresh itself fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 401 })
    vi.stubGlobal('fetch', fetchMock)

    const response = await apiFetch('/auth/me')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(response.status).toBe(401)
  })

  it('does not attempt a refresh retry for /auth/login itself', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await apiFetch('/auth/login', { method: 'POST' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not loop when the failing request is /auth/refresh itself', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))
    await apiFetch('/auth/refresh', { method: 'POST' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd frontend && npx vitest run lib/apiClient.test.ts`
Expected: FAIL — `Cannot find module './apiClient'`.

- [ ] **Step 3: Implement apiClient.ts**

Create `frontend/lib/apiClient.ts`:

```typescript
const SKIP_REFRESH_RETRY_PATHS = new Set(['/auth/login', '/auth/register', '/auth/refresh'])

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
}

async function rawFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${apiBaseUrl()}${path}`, { ...init, credentials: 'include' })
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await rawFetch(path, init)
  if (response.status !== 401 || SKIP_REFRESH_RETRY_PATHS.has(path)) {
    return response
  }

  const refreshResponse = await rawFetch('/auth/refresh', { method: 'POST' })
  if (!refreshResponse.ok) {
    return response
  }

  return rawFetch(path, init)
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `cd frontend && npx vitest run lib/apiClient.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Add the frontend env example**

Create `frontend/.env.example`:

```
NEXT_PUBLIC_API_BASE_URL=https://api.twistfit.vn

# Must match backend/.env's AUTH_COOKIE_SECRET exactly — frontend/lib/auth/session.ts
# verifies the legacy twistfit_session cookie that the backend now issues.
AUTH_COOKIE_SECRET=change-me-in-production
```

- [ ] **Step 6: Commit**

```bash
cd frontend
git add lib/apiClient.ts lib/apiClient.test.ts .env.example
git commit -m "feat: add apiClient helper for calling the FastAPI backend"
```

---

## Task 14: Frontend auth cutover

**Files:**
- Modify: `frontend/components/auth/AuthProvider.tsx`
- Modify: `frontend/components/auth/AuthProvider.test.tsx`
- Modify: `frontend/components/auth/RegisterForm.tsx`
- Delete: `frontend/app/api/auth/login/route.ts`, `frontend/app/api/auth/login/route.test.ts`
- Delete: `frontend/app/api/auth/logout/route.ts`, `frontend/app/api/auth/logout/route.test.ts`

**Interfaces:**
- Consumes: `apiFetch` (Task 13).
- Unchanged (kept exactly as-is per the legacy user record mirroring bridge): `frontend/app/api/auth/register/route.ts`, `frontend/app/api/auth/register/validate.ts`, `frontend/lib/auth/users.ts`, `frontend/lib/auth/session.ts`.

- [ ] **Step 1: Update AuthProvider to call the FastAPI backend**

Modify `frontend/components/auth/AuthProvider.tsx` (full file, replacing the current contents at [components/auth/AuthProvider.tsx](frontend/components/auth/AuthProvider.tsx)):

```typescript
'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { Role } from '@/lib/auth/users'

const STORAGE_KEY = 'twistfit.auth'

export type AuthUser = {
  name: string
  email: string
  role: Role
}

type AuthContextValue = {
  user: AuthUser | null
  // False only until the initial localStorage read completes. A protected
  // page must wait for this before redirecting on `user === null`, or it
  // will bounce an already-logged-in visitor during that first render.
  isHydrated: boolean
  login: (email: string, password: string) => Promise<AuthUser | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // One-time hydration from localStorage after mount, not a React->React
    // sync: reading window here during render would break SSR/hydration, so
    // this must stay in an effect despite the lint rule's general advice.
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(stored) as AuthUser)
    }
    setIsHydrated(true)
  }, [])

  async function login(email: string, password: string): Promise<AuthUser | null> {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) return null
    const account = (await response.json()) as AuthUser
    setUser(account)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
    return account
  }

  function logout() {
    setUser(null)
    window.localStorage.removeItem(STORAGE_KEY)
    void apiFetch('/auth/logout', { method: 'POST' }).catch(() => {})
  }

  return <AuthContext.Provider value={{ user, isHydrated, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 2: Run the AuthProvider tests**

Run: `cd frontend && npx vitest run components/auth/AuthProvider.test.tsx`
Expected: PASS unchanged — the existing tests stub `fetch` generically (based on parsed body, ignoring the URL and any `credentials` field), so they keep passing with no edits needed.

- [ ] **Step 3: Update RegisterForm to register against FastAPI and mirror into the legacy SQLite table**

Modify `frontend/components/auth/RegisterForm.tsx` — replace the `handleSubmit` function (currently at [components/auth/RegisterForm.tsx:18-51](frontend/components/auth/RegisterForm.tsx#L18-L51)) with:

```typescript
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const name = (form.elements.namedItem('name') as HTMLInputElement).value
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value

    if (password !== confirmPassword) {
      setConfirmError(true)
      setFormError(null)
      ;(form.elements.namedItem('confirmPassword') as HTMLInputElement).focus()
      return
    }
    setConfirmError(false)

    const response = await apiFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setFormError(data.error === 'EMAIL_TAKEN' ? t('errors.emailTaken') : t('errors.generic'))
      return
    }

    // Mirror the new user into the legacy SQLite users table (unmodified
    // /api/auth/register route) so forum and quiz-attempts — which still
    // query that table directly — can resolve this user after registration.
    void fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    }).catch(() => {})

    setFormError(null)
    const account = await login(email, password)
    if (account) {
      router.push(account.role === 'admin' ? '/admin' : '/')
    }
  }
```

Add the import at the top of the file: `import { apiFetch } from '@/lib/apiClient'`.

- [ ] **Step 4: Update the RegisterForm test for the extra mirror call**

Modify `frontend/components/auth/RegisterForm.test.tsx` — the success test (currently at [components/auth/RegisterForm.test.tsx:70-88](frontend/components/auth/RegisterForm.test.tsx#L70-L88)) needs its `fetch` stub to answer three calls (FastAPI register, the legacy mirror `/api/auth/register`, then login) instead of two. Replace it with:

```typescript
  it('registers, logs in, and redirects to the homepage on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/auth/register') {
          return {
            ok: true,
            status: 201,
            json: async () => ({ id: 1, name: 'Linh Đan', email: 'linhdan@gmail.com', role: 'user' }),
          }
        }
        return { ok: true, json: async () => ({ name: 'Linh Đan', email: 'linhdan@gmail.com', role: 'user' }) }
      })
    )
    renderRegisterForm()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: 'ĐĂNG KÝ' }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/'))
  })
```

This is unchanged from the existing test: the stub already matches on `url === '/api/auth/register'` for the mirror call and falls through to the generic success response for both the (now-`apiFetch`-driven) `/auth/register` call and the login call, since `apiFetch` prefixes with an empty base URL in tests (`NEXT_PUBLIC_API_BASE_URL` is unset), and the mock ignores the `credentials` field entirely.

- [ ] **Step 5: Run the RegisterForm tests**

Run: `cd frontend && npx vitest run components/auth/RegisterForm.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Delete the dead login and logout routes**

```bash
cd frontend
rm app/api/auth/login/route.ts app/api/auth/login/route.test.ts
rm app/api/auth/logout/route.ts app/api/auth/logout/route.test.ts
```

- [ ] **Step 7: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass (no test referenced the deleted routes directly — they were exercised only through `AuthProvider`, which no longer calls them).

- [ ] **Step 8: Commit**

```bash
cd frontend
git add components/auth/AuthProvider.tsx components/auth/RegisterForm.tsx components/auth/RegisterForm.test.tsx
git rm app/api/auth/login/route.ts app/api/auth/login/route.test.ts
git rm app/api/auth/logout/route.ts app/api/auth/logout/route.test.ts
git commit -m "feat: cut auth over to FastAPI, mirror registrations into legacy SQLite"
```

---

## Task 15: Frontend FAQ cutover

**Files:**
- Modify: `frontend/lib/faq.ts` (trim to types/constants only)
- Delete: `frontend/lib/faq.test.ts`
- Modify: `frontend/app/faq/page.tsx`
- Modify: `frontend/app/faq/page.test.tsx`
- Modify: `frontend/components/admin/FaqList.tsx`
- Modify: `frontend/components/admin/FaqList.test.tsx`
- Modify: `frontend/components/admin/FaqForm.tsx`
- Modify: `frontend/components/admin/FaqForm.test.tsx`
- Modify: `frontend/app/admin/faq/[id]/edit/page.tsx`
- Modify: `frontend/app/admin/faq/[id]/edit/page.test.tsx`
- Delete: `frontend/app/api/faq/route.ts`, `frontend/app/api/faq/route.test.ts`
- Delete: `frontend/app/api/faq/validate.ts`, `frontend/app/api/faq/validate.test.ts`
- Delete: `frontend/app/api/faq/[id]/route.ts`, `frontend/app/api/faq/[id]/route.test.ts`

**Interfaces:**
- Consumes: `apiFetch` (Task 13), the FastAPI `/faq` endpoints (Task 11).
- Note: FastAPI's validation errors are the framework's default 422 shape (a list under `detail`), not the old `{errors: {field: message}}` shape. `FaqForm` therefore shows one generic form-level error on any failed submit instead of per-field messages — this is a deliberate simplification matching the spec's "no custom error envelope" decision, not an oversight.

- [ ] **Step 1: Trim `lib/faq.ts` to types and constants**

Modify `frontend/lib/faq.ts` — replace the entire file with:

```typescript
export type FaqCategory = 'personal-color' | 'fitting-room' | 'account' | 'stylist'
export const FAQ_CATEGORIES: FaqCategory[] = ['personal-color', 'fitting-room', 'account', 'stylist']

export type FaqHighlightIcon =
  | 'palette'
  | 'wb_sunny'
  | 'face_retouching_off'
  | 'center_focus_strong'
  | 'qr_code_scanner'
  | 'verified_user'
  | 'info'
  | 'lightbulb'

export const FAQ_HIGHLIGHT_ICONS: FaqHighlightIcon[] = [
  'palette',
  'wb_sunny',
  'face_retouching_off',
  'center_focus_strong',
  'qr_code_scanner',
  'verified_user',
  'info',
  'lightbulb',
]

export type FaqItem = {
  id: number
  categories: FaqCategory[]
  question: string
  answerMarkdown: string
  highlightIcon: FaqHighlightIcon | null
  highlightText: string | null
  createdAt: string
  updatedAt: string
}

export type FaqItemInput = {
  categories: FaqCategory[]
  question: string
  answerMarkdown: string
  highlightIcon: FaqHighlightIcon | null
  highlightText: string | null
}
```

Delete `frontend/lib/faq.test.ts` (it only tested the now-removed SQLite functions).

- [ ] **Step 2: Update the public FAQ page to fetch from FastAPI**

Modify `frontend/app/faq/page.tsx` — replace the full file:

```typescript
import FaqSection from '@/components/faq/FaqSection'
import FaqSupportBanner from '@/components/faq/FaqSupportBanner'
import { apiFetch } from '@/lib/apiClient'
import type { FaqItem } from '@/lib/faq'

export default async function FaqPage() {
  const response = await apiFetch('/faq', { cache: 'no-store' })
  const items = response.ok ? ((await response.json()) as FaqItem[]) : []

  return (
    <main className="w-full bg-surface">
      <FaqSection items={items} />
      <FaqSupportBanner />
    </main>
  )
}
```

- [ ] **Step 3: Update the FAQ page test**

Modify `frontend/app/faq/page.test.tsx` — replace the full file:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import type { FaqItem } from '@/lib/faq'
import FaqPage from './page'

const ITEMS: FaqItem[] = [
  {
    id: 1,
    categories: ['personal-color'],
    question: 'Câu hỏi seed test?',
    answerMarkdown: 'Trả lời seed test.',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('FaqPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the FAQ heading and the seeded question', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ITEMS }))
    const page = await FaqPage()
    renderWithIntl(page)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi seed test?')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run the FAQ page test**

Run: `cd frontend && npx vitest run app/faq/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Update FaqList to use apiClient**

Modify `frontend/components/admin/FaqList.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the two `fetch` calls (currently at [components/admin/FaqList.tsx:13](frontend/components/admin/FaqList.tsx#L13) and [components/admin/FaqList.tsx:20](frontend/components/admin/FaqList.tsx#L20)):

```typescript
  useEffect(() => {
    apiFetch('/faq')
      .then((response) => response.json())
      .then(setItems)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/faq/${id}`, { method: 'DELETE' })
    setItems((current) => current?.filter((item) => item.id !== id) ?? null)
  }
```

- [ ] **Step 6: Update the FaqList delete test's fetch assertion**

Modify `frontend/components/admin/FaqList.test.tsx` — the delete test's assertion (currently at [components/admin/FaqList.test.tsx:45](frontend/components/admin/FaqList.test.tsx#L45)):

```typescript
    expect(fetch).toHaveBeenCalledWith('/faq/1', { method: 'DELETE', credentials: 'include' })
```

- [ ] **Step 7: Run the FaqList tests**

Run: `cd frontend && npx vitest run components/admin/FaqList.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 8: Update FaqForm to use apiClient and show a generic error**

Modify `frontend/components/admin/FaqForm.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the submit logic (currently at [components/admin/FaqForm.tsx:53-70](frontend/components/admin/FaqForm.tsx#L53-L70)):

```typescript
    const response = await apiFetch(isEditing ? `/faq/${initialItem!.id}` : '/faq', {
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

    router.push('/admin/faq')
```

- [ ] **Step 9: Update the FaqForm tests**

Modify `frontend/components/admin/FaqForm.test.tsx` — update the two `toHaveBeenCalledWith` assertions (currently at [components/admin/FaqForm.test.tsx:39](frontend/components/admin/FaqForm.test.tsx#L39) and [components/admin/FaqForm.test.tsx:50](frontend/components/admin/FaqForm.test.tsx#L50)):

```typescript
    expect(fetch).toHaveBeenCalledWith('/faq', expect.objectContaining({ method: 'POST', credentials: 'include' }))
```

```typescript
    expect(fetch).toHaveBeenCalledWith('/faq/5', expect.objectContaining({ method: 'PUT', credentials: 'include' }))
```

Replace the third test (currently `'shows field errors returned by the API instead of redirecting'`, at [components/admin/FaqForm.test.tsx:53-67](frontend/components/admin/FaqForm.test.tsx#L53-L67)) — FastAPI's validation errors are no longer parsed into per-field messages, so this now asserts a generic error instead:

```typescript
  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<FaqForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo câu hỏi' }))

    await waitFor(() => expect(screen.getByText('Đã xảy ra lỗi, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
```

This assumes `t('genericError')` renders as `"Đã xảy ra lỗi, vui lòng thử lại."` — before running, check the actual string in `frontend/messages/vi.json` under `Admin.FaqForm.genericError` and use that exact value instead if it differs.

- [ ] **Step 10: Run the FaqForm tests**

Run: `cd frontend && npx vitest run components/admin/FaqForm.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 11: Update the edit page to use apiClient**

Modify `frontend/app/admin/faq/[id]/edit/page.tsx` — add the import `import { apiFetch } from '@/lib/apiClient'` and replace the fetch call (currently at [app/admin/faq/[id]/edit/page.tsx:13](frontend/app/admin/faq/%5Bid%5D/edit/page.tsx#L13)):

```typescript
      apiFetch(`/faq/${id}`)
        .then((response) => response.json())
        .then(setItem)
```

- [ ] **Step 12: Update the edit page test's fetch assertion**

Modify `frontend/app/admin/faq/[id]/edit/page.test.tsx` — the assertion (currently at [app/admin/faq/[id]/edit/page.test.tsx:44](frontend/app/admin/faq/%5Bid%5D/edit/page.test.tsx#L44)):

```typescript
    expect(fetch).toHaveBeenCalledWith('/faq/7', { credentials: 'include' })
```

- [ ] **Step 13: Run the edit page test**

Run: `cd frontend && npx vitest run app/admin/faq/\[id\]/edit/page.test.tsx`
Expected: PASS.

- [ ] **Step 14: Delete the old FAQ API routes**

```bash
cd frontend
rm app/api/faq/route.ts app/api/faq/route.test.ts
rm app/api/faq/validate.ts app/api/faq/validate.test.ts
rm app/api/faq/\[id\]/route.ts app/api/faq/\[id\]/route.test.ts
```

- [ ] **Step 15: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all tests pass.

- [ ] **Step 16: Manually verify in the browser**

With PostgreSQL running, the backend running (`cd backend && uvicorn app.main:app --reload`) and the frontend running (`cd frontend && npm run dev`), with `frontend/.env.local` containing `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`:
- Visit `/faq` — the 6 seeded questions render.
- Register a new account at `/register`, confirm redirect to `/`.
- Log out, log back in at `/login` with `admin@twistfit.vn` / `admin1234`, confirm redirect to `/admin`.
- Visit `/admin/faq`, create a new question, edit it, delete it — confirm each round-trips correctly.
- Visit `/forum` and create a post as the newly-registered user from the first bullet — confirm it succeeds (this exercises the legacy user record mirror from Task 14).

- [ ] **Step 17: Commit**

```bash
cd frontend
git add lib/faq.ts app/faq/page.tsx app/faq/page.test.tsx components/admin/FaqList.tsx components/admin/FaqList.test.tsx components/admin/FaqForm.tsx components/admin/FaqForm.test.tsx app/admin/faq
git rm lib/faq.test.ts
git rm app/api/faq/route.ts app/api/faq/route.test.ts
git rm app/api/faq/validate.ts app/api/faq/validate.test.ts
git rm "app/api/faq/[id]/route.ts" "app/api/faq/[id]/route.test.ts"
git commit -m "feat: cut FAQ over to FastAPI, both public reads and admin CRUD"
```
