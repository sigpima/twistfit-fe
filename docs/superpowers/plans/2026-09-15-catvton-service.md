# CatVTON Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone FastAPI service that wraps the CatVTON virtual try-on model behind an authenticated HTTP endpoint, deployable on a rented Vast.ai GPU instance.

**Architecture:** A new top-level sub-project `catvton-service/` (sibling to `frontend/` and `backend/`), independent of both — it never touches Blob Storage or Postgres, only `(person_image, garment_image, cloth_type) -> result_image` over HTTP, protected by a shared API key header. The FastAPI app layer (auth, request/response contract) is fully unit-testable without a GPU; the real CatVTON pipeline is wired behind an injectable dependency so those same tests never load the actual model, and is verified manually on the rented GPU instance.

**Tech Stack:** Python 3, FastAPI, Pillow, PyTorch + CUDA, diffusers, the `Zheng-Chong/CatVTON` GitHub repo (vendored, not a pip package).

**Spec:** `frontend/docs/superpowers/specs/2026-09-15-virtual-tryon-design.md` (see "CatVTON service on Vast.ai" section)

## Global Constraints

- CatVTON is CC BY-NC-SA 4.0 (non-commercial only) — acceptable because the whole project is confirmed non-commercial. Do not remove this constraint from the README without re-checking the license situation.
- The service must require an NVIDIA GPU with CUDA (AMD/ROCm is not viable — see spec). Vast.ai instance must be an NVIDIA template.
- `/generate` must reject requests without a valid `X-API-Key` header — the instance's public IP:port is reachable by anyone.
- The service must never receive or use Azure Blob Storage or Postgres credentials — it only ever sees image bytes passed directly in the request.

---

## Task 1: Scaffold the FastAPI service and health check

**Files:**
- Create: `catvton-service/requirements.txt`
- Create: `catvton-service/app/__init__.py`
- Create: `catvton-service/app/main.py`
- Test: `catvton-service/tests/test_health.py`
- Create: `catvton-service/tests/__init__.py`
- Create: `catvton-service/pytest.ini`

**Interfaces:**
- Produces: FastAPI `app` object in `catvton-service/app/main.py`, exposing `GET /health` — consumed by every later task's tests via `TestClient(app)`.

- [ ] **Step 1: Create the project scaffold**

Create `catvton-service/requirements.txt`:

```
fastapi==0.141.1
uvicorn[standard]==0.35.0
python-multipart==0.0.20
pillow==11.0.0
httpx==0.27.2
pytest==8.3.3
```

Create `catvton-service/pytest.ini`:

```ini
[pytest]
pythonpath = .
```

Create `catvton-service/app/__init__.py` (empty file) and `catvton-service/tests/__init__.py` (empty file).

- [ ] **Step 2: Write the failing test**

Create `catvton-service/tests/test_health.py`:

```python
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd catvton-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
pytest tests/test_health.py -v
```

Expected: FAIL — `app.main` module doesn't exist yet.

- [ ] **Step 4: Implement the minimal app**

Create `catvton-service/app/main.py`:

```python
from fastapi import FastAPI

app = FastAPI(title="CatVTON Service")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/test_health.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git init  # this is a new top-level sub-project with no repo yet
git add requirements.txt pytest.ini app/ tests/
git commit -m "chore: scaffold catvton-service FastAPI app with health check"
```

---

## Task 2: API key authentication dependency

**Files:**
- Create: `catvton-service/app/auth.py`
- Test: `catvton-service/tests/test_auth.py`
- Modify: `catvton-service/app/main.py`

**Interfaces:**
- Consumes: nothing new.
- Produces: `require_api_key(x_api_key: str = Header(...))` FastAPI dependency in `app/auth.py`, raising `HTTPException(401)` on a missing/wrong key — consumed by Task 3's `/generate` route.

- [ ] **Step 1: Write the failing test**

Create `catvton-service/tests/test_auth.py`:

```python
import os

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.auth import require_api_key

os.environ["CATVTON_API_KEY"] = "test-secret-key"

probe_app = FastAPI()


@probe_app.get("/protected", dependencies=[Depends(require_api_key)])
def protected_route():
    return {"ok": True}


client = TestClient(probe_app)


def test_rejects_request_with_no_api_key():
    response = client.get("/protected")
    assert response.status_code == 401


def test_rejects_request_with_wrong_api_key():
    response = client.get("/protected", headers={"X-API-Key": "wrong-key"})
    assert response.status_code == 401


def test_accepts_request_with_correct_api_key():
    response = client.get("/protected", headers={"X-API-Key": "test-secret-key"})
    assert response.status_code == 200
    assert response.json() == {"ok": True}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_auth.py -v
```

Expected: FAIL — `app.auth` module doesn't exist yet.

- [ ] **Step 3: Implement the dependency**

Create `catvton-service/app/auth.py`:

```python
import os

from fastapi import Header, HTTPException, status


def require_api_key(x_api_key: str = Header(default="")) -> None:
    expected = os.environ.get("CATVTON_API_KEY", "")
    if not expected or x_api_key != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing API key")
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_auth.py -v
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/auth.py tests/test_auth.py
git commit -m "feat: add API key authentication dependency"
```

---

## Task 3: `/generate` endpoint contract (with an injectable, stubbed generator)

**Files:**
- Create: `catvton-service/app/generator.py`
- Modify: `catvton-service/app/main.py`
- Test: `catvton-service/tests/test_generate.py`

**Interfaces:**
- Consumes: `require_api_key` from `app/auth.py` (Task 2).
- Produces: `GenerateFn = Callable[[bytes, bytes, str], bytes]` type alias and `app.state.generate_fn` attribute in `app/generator.py` — the real CatVTON wrapper (Task 4) replaces this at startup in production; tests override it directly on `app.state`.

- [ ] **Step 1: Write the failing test**

Create `catvton-service/tests/test_generate.py`:

```python
import io
import os

from fastapi.testclient import TestClient
from PIL import Image

os.environ["CATVTON_API_KEY"] = "test-secret-key"

from app.main import app  # noqa: E402

client = TestClient(app)


def _fake_image_bytes(color: tuple[int, int, int]) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (16, 16), color).save(buffer, format="PNG")
    return buffer.getvalue()


def _stub_generate_fn(person_bytes: bytes, garment_bytes: bytes, cloth_type: str) -> bytes:
    return _fake_image_bytes((1, 2, 3))


def setup_module():
    app.state.generate_fn = _stub_generate_fn


def test_generate_requires_api_key():
    response = client.post(
        "/generate",
        files={
            "person_image": ("person.png", _fake_image_bytes((255, 0, 0)), "image/png"),
            "garment_image": ("garment.png", _fake_image_bytes((0, 255, 0)), "image/png"),
        },
        data={"cloth_type": "upper"},
    )
    assert response.status_code == 401


def test_generate_returns_image_bytes_from_the_injected_generator():
    response = client.post(
        "/generate",
        headers={"X-API-Key": "test-secret-key"},
        files={
            "person_image": ("person.png", _fake_image_bytes((255, 0, 0)), "image/png"),
            "garment_image": ("garment.png", _fake_image_bytes((0, 255, 0)), "image/png"),
        },
        data={"cloth_type": "upper"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content == _fake_image_bytes((1, 2, 3))


def test_generate_rejects_an_invalid_cloth_type():
    response = client.post(
        "/generate",
        headers={"X-API-Key": "test-secret-key"},
        files={
            "person_image": ("person.png", _fake_image_bytes((255, 0, 0)), "image/png"),
            "garment_image": ("garment.png", _fake_image_bytes((0, 255, 0)), "image/png"),
        },
        data={"cloth_type": "not-a-real-type"},
    )
    assert response.status_code == 422
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_generate.py -v
```

Expected: FAIL — `/generate` route doesn't exist yet (404).

- [ ] **Step 3: Implement the generator type and endpoint**

Create `catvton-service/app/generator.py`:

```python
from typing import Callable

GenerateFn = Callable[[bytes, bytes, str], bytes]

CLOTH_TYPES = ("upper", "lower", "overall")


def default_generate_fn(person_bytes: bytes, garment_bytes: bytes, cloth_type: str) -> bytes:
    raise NotImplementedError("Real CatVTON pipeline not wired in — see app/pipeline.py")
```

Modify `catvton-service/app/main.py`:

```python
from fastapi import Depends, FastAPI, HTTPException, Response, UploadFile, status
from fastapi import File, Form

from app.auth import require_api_key
from app.generator import CLOTH_TYPES, default_generate_fn

app = FastAPI(title="CatVTON Service")
app.state.generate_fn = default_generate_fn


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate", dependencies=[Depends(require_api_key)])
async def generate(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    cloth_type: str = Form(...),
) -> Response:
    if cloth_type not in CLOTH_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"cloth_type must be one of {CLOTH_TYPES}",
        )
    person_bytes = await person_image.read()
    garment_bytes = await garment_image.read()
    result_bytes = app.state.generate_fn(person_bytes, garment_bytes, cloth_type)
    return Response(content=result_bytes, media_type="image/png")
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_generate.py -v
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add app/generator.py app/main.py tests/test_generate.py
git commit -m "feat: add /generate endpoint with injectable generator"
```

---

## Task 4: Real CatVTON pipeline wrapper

**Files:**
- Create: `catvton-service/vendor/README.md`
- Create: `catvton-service/app/pipeline.py`
- Modify: `catvton-service/requirements.txt`
- Modify: `catvton-service/app/main.py`

**Interfaces:**
- Consumes: `GenerateFn` type from `app/generator.py` (Task 3).
- Produces: `load_pipeline() -> PipelineBundle` and `generate_with_pipeline(bundle: PipelineBundle, person_bytes: bytes, garment_bytes: bytes, cloth_type: str) -> bytes` in `app/pipeline.py` — used only by `app/main.py`'s real (non-test) startup path.

This task cannot be unit-tested without a CUDA GPU, the vendored CatVTON repo, and several GB of downloaded checkpoints — none of which are available in a plain dev/CI environment. Verification is manual, on the actual rented Vast.ai GPU instance (Task 5).

- [ ] **Step 1: Vendor the CatVTON repo**

```bash
cd catvton-service
git clone https://github.com/Zheng-Chong/CatVTON vendor/CatVTON
```

Create `catvton-service/vendor/README.md`:

```markdown
# vendor/CatVTON

Cloned from https://github.com/Zheng-Chong/CatVTON (CC BY-NC-SA 4.0,
non-commercial use only — see the root README's Global Constraints).
Not modified. `app/pipeline.py` imports `model.pipeline.CatVTONPipeline`
and `model.cloth_masker.AutoMasker` from here — this directory must stay
on `sys.path` (handled by `app/pipeline.py`).

If `runwayml/stable-diffusion-inpainting` (the default base checkpoint)
is no longer available on Hugging Face when you set this up, check
https://github.com/Zheng-Chong/CatVTON for the currently recommended
base model and update `BASE_MODEL_PATH` in `app/pipeline.py`.
```

- [ ] **Step 2: Add CatVTON's own dependencies**

Append to `catvton-service/requirements.txt`:

```
torch==2.4.0
diffusers==0.30.0
transformers==4.44.0
accelerate==0.33.0
huggingface_hub==0.24.5
```

(These match the floors CatVTON's own `requirements.txt`, in
`vendor/CatVTON/requirements.txt`, specifies — check that file at setup
time and adjust versions here if it has since changed.)

- [ ] **Step 3: Implement the pipeline wrapper**

Create `catvton-service/app/pipeline.py`:

```python
import io
import os
import sys
from dataclasses import dataclass

from diffusers.image_processor import VaeImageProcessor
from huggingface_hub import snapshot_download
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "vendor", "CatVTON"))

from model.cloth_masker import AutoMasker  # noqa: E402
from model.pipeline import CatVTONPipeline  # noqa: E402
from utils import init_weight_dtype, resize_and_crop, resize_and_padding  # noqa: E402

BASE_MODEL_PATH = "runwayml/stable-diffusion-inpainting"
RESUME_REPO_ID = "zhengchong/CatVTON"
WIDTH = 768
HEIGHT = 1024


@dataclass
class PipelineBundle:
    pipeline: CatVTONPipeline
    automasker: AutoMasker
    mask_processor: VaeImageProcessor


def load_pipeline() -> PipelineBundle:
    repo_path = snapshot_download(repo_id=RESUME_REPO_ID)

    pipeline = CatVTONPipeline(
        base_ckpt=BASE_MODEL_PATH,
        attn_ckpt=repo_path,
        attn_ckpt_version="mix",
        weight_dtype=init_weight_dtype("bf16"),
        use_tf32=True,
        device="cuda",
    )

    mask_processor = VaeImageProcessor(
        vae_scale_factor=8, do_normalize=False, do_binarize=True, do_convert_grayscale=True
    )

    automasker = AutoMasker(
        densepose_ckpt=os.path.join(repo_path, "DensePose"),
        schp_ckpt=os.path.join(repo_path, "SCHP"),
        device="cuda",
    )

    return PipelineBundle(pipeline=pipeline, automasker=automasker, mask_processor=mask_processor)


def generate_with_pipeline(
    bundle: PipelineBundle, person_bytes: bytes, garment_bytes: bytes, cloth_type: str
) -> bytes:
    person_image = Image.open(io.BytesIO(person_bytes)).convert("RGB")
    garment_image = Image.open(io.BytesIO(garment_bytes)).convert("RGB")

    person_image = resize_and_crop(person_image, (WIDTH, HEIGHT))
    garment_image = resize_and_padding(garment_image, (WIDTH, HEIGHT))

    mask = bundle.automasker(person_image, cloth_type)["mask"]
    mask = bundle.mask_processor.blur(mask, blur_factor=9)

    result_image = bundle.pipeline(
        image=person_image,
        condition_image=garment_image,
        mask=mask,
        num_inference_steps=50,
        guidance_scale=2.5,
        generator=None,
    )[0]

    output = io.BytesIO()
    result_image.save(output, format="PNG")
    return output.getvalue()
```

- [ ] **Step 4: Wire the real pipeline into app startup**

Modify `catvton-service/app/main.py` to load the real pipeline on startup instead of leaving `default_generate_fn` (which just raises) in place, but only when not under test — use a lifespan and an environment flag so `pytest` (which imports `app.main` without CUDA available) never triggers it:

```python
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Form, HTTPException, Response, UploadFile, status

from app.auth import require_api_key
from app.generator import CLOTH_TYPES, default_generate_fn


@asynccontextmanager
async def lifespan(app: FastAPI):
    import os

    if os.environ.get("CATVTON_SKIP_MODEL_LOAD") != "1":
        from app.pipeline import generate_with_pipeline, load_pipeline

        bundle = load_pipeline()
        app.state.generate_fn = lambda p, g, c: generate_with_pipeline(bundle, p, g, c)
    yield


app = FastAPI(title="CatVTON Service", lifespan=lifespan)
app.state.generate_fn = default_generate_fn


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate", dependencies=[Depends(require_api_key)])
async def generate(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    cloth_type: str = Form(...),
) -> Response:
    if cloth_type not in CLOTH_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"cloth_type must be one of {CLOTH_TYPES}",
        )
    person_bytes = await person_image.read()
    garment_bytes = await garment_image.read()
    result_bytes = app.state.generate_fn(person_bytes, garment_bytes, cloth_type)
    return Response(content=result_bytes, media_type="image/png")
```

- [ ] **Step 5: Verify existing tests still pass with `CATVTON_SKIP_MODEL_LOAD=1`**

```bash
CATVTON_SKIP_MODEL_LOAD=1 pytest -v
```

Expected: all tests from Tasks 1-3 still PASS — the lifespan skips loading the real model, leaving `app.state.generate_fn` as whatever the test set it to (or the raising default).

- [ ] **Step 6: Commit**

```bash
git add vendor/README.md app/pipeline.py app/main.py requirements.txt
git commit -m "feat: add real CatVTON pipeline wrapper, wired via app lifespan"
```

Note: `vendor/CatVTON/` itself (the cloned repo) should not be committed as tracked files if you plan to `git clone` it fresh on the Vast.ai instance — add `vendor/CatVTON/` to a new `.gitignore` in that case, or vendor it as a git submodule instead if you'd rather pin an exact commit. Either is fine; pick whichever this project's other vendoring (if any) already does, otherwise default to `.gitignore` + a clone step in the deploy README (Task 5).

---

## Task 5: Vast.ai deployment guide and manual end-to-end verification

**Files:**
- Create: `catvton-service/README.md`
- Create: `catvton-service/.gitignore`

No new automated tests — this task documents and manually verifies the one part of the system that genuinely requires the rented GPU.

- [ ] **Step 1: Add `.gitignore`**

Create `catvton-service/.gitignore`:

```
venv/
__pycache__/
*.pyc
vendor/CatVTON/
.env
```

- [ ] **Step 2: Write the deployment README**

Create `catvton-service/README.md`:

```markdown
# CatVTON Service

Wraps CatVTON (CC BY-NC-SA 4.0 — non-commercial only) behind an
authenticated FastAPI endpoint. See
`frontend/docs/superpowers/specs/2026-09-15-virtual-tryon-design.md`
for the full design.

## Deploying on Vast.ai

1. Rent an NVIDIA GPU instance, ≥8GB VRAM (RTX 3060/4060/3090 all
   work), using a template with CUDA + PyTorch preinstalled. When
   creating the instance, map a container port (e.g. 8000) to a public
   port.
2. SSH into the instance:
   ```bash
   git clone <this-catvton-service-repo-url>
   cd catvton-service
   git clone https://github.com/Zheng-Chong/CatVTON vendor/CatVTON
   python3 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   export CATVTON_API_KEY="<choose a long random secret>"
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
   The first startup downloads the CatVTON checkpoints from Hugging
   Face (several GB) — this can take a while.
3. Note the instance's public IP and the port Vast.ai mapped to 8000 —
   this is `CATVTON_SERVICE_URL` for the main backend
   (`http://<public-ip>:<mapped-port>`), and `CATVTON_API_KEY` is the
   secret you exported above.

## Lifecycle

- `stop` the instance when not in use — this halts GPU billing (a
  small storage charge continues; see the Vast.ai billing notes in the
  design spec).
- `delete` the instance once done with that phase of work, to stop
  storage billing entirely.

## Local dev (no GPU)

Run with `CATVTON_SKIP_MODEL_LOAD=1 uvicorn app.main:app --reload` to
skip loading the real model — `/generate` will raise
`NotImplementedError` until something overrides `app.state.generate_fn`,
but `/health` and the auth/contract tests all work normally.
```

- [ ] **Step 3: Deploy and manually verify end-to-end**

Follow the README on an actual rented Vast.ai instance. Then, from your
own machine:

```bash
curl -X POST "http://<public-ip>:<mapped-port>/generate" \
  -H "X-API-Key: <your-secret>" \
  -F "person_image=@/path/to/a/real/person/photo.jpg" \
  -F "garment_image=@/path/to/a/real/garment/photo.jpg" \
  -F "cloth_type=upper" \
  -o result.png
```

Expected: `result.png` is a valid image showing the garment composited
onto the person. Also verify `curl` **without** `-H "X-API-Key: ..."`
gets a 401, confirming the deployed instance enforces auth (not just
the local test suite).

- [ ] **Step 4: Commit**

```bash
git add README.md .gitignore
git commit -m "docs: add Vast.ai deployment guide"
```
