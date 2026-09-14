# Virtual Try-On (Feature 2) — Design Spec

Date: 2026-09-15

## Context

This is the second of three planned features for TwistFit. It has two
phases: (1) users build a personal wardrobe by uploading clothing
photos, and (2) users generate a "try-on" image of a catalog model
wearing a wardrobe item, picked to match an occasion, a style, and the
user's personal color result from Feature 1 (the quiz).

This is a non-commercial school project (confirmed by the user), which
changes what's viable compared to a commercial product:

- **Try-on generation**: self-hosted **CatVTON** (2D diffusion virtual
  try-on model), rented on-demand on Vast.ai. CatVTON is licensed CC
  BY-NC-SA 4.0 (non-commercial only) — acceptable here because the
  project is confirmed non-commercial, but this code/model must not be
  carried into any future commercial version without replacing it
  with a commercially-licensed alternative (e.g. the FASHN API).
- **Garment metadata tagging**: Gemini 2.0 Flash (VLM), prompted with
  a predefined, fixed set of category/style/occasion classes, run once
  per wardrobe item at upload time (not per try-on), so its cost is
  bounded by catalog size, not by user traffic.
- **Storage**: Azure Blob Storage for images, the existing Azure
  Database for PostgreSQL for metadata — both already fit the
  project's Azure App Service deployment.

## Integration with the existing codebase

The backend (`backend/app`) is a domain-driven FastAPI app (see
`2026-09-13-fastapi-backend-foundation-design.md` and the `catalog`/
`content` migration specs) with SQLAlchemy 2.0 models, Alembic
migrations, and a `CamelModel` Pydantic base per domain. This feature
adds two **new** domains rather than reusing look-alike existing ones:

- **`app/domains/wardrobe`** — a user's personal uploaded garment
  photos. This is unrelated to the existing `capsule_wardrobe` domain,
  which is editorial/curated outfit content (image + title +
  description + priced items) for marketing pages, not user-uploaded
  garments. Do not extend `capsule_wardrobe` for this feature.
- **`app/domains/tryon`** — try-on job records and the orchestration
  logic (garment selection + call to the CatVTON service).

Two existing domains are reused as-is:

- **`model_catalog`** — the "model" side of a try-on is a **selection
  from this existing catalog** (`CatalogModel.id`), not a user-uploaded
  body photo. Each catalog model already carries an `image` path and a
  `personal_color` string (e.g. "Autumn Soft"), which existed for
  informational display and is now also useful context for a try-on.
- **`quiz_attempts`** — the user's personal color result is stored as
  `season: str`, one of `spring` / `summer` / `autumn` / `winter`. This
  is coarser than the 12-way palette (season × Warm/Cool/Light/Deep/
  Bright/Soft) from the Feature 1 camera-frame prototype
  (`frontend/lib/palettes.ts`). The garment-matching algorithm below is
  designed against this actual 4-season granularity, not the 12-way
  one — see "Garment selection" for how.

## Architecture overview

```
Frontend (Next.js)
   │
   ▼
Main Backend — FastAPI on Azure App Service
   │              │                    │
   ▼              ▼                    ▼
Azure Blob      Azure Database      Gemini 2.0 Flash API
Storage         for PostgreSQL      (tagging at wardrobe upload time)
(images)        (metadata + jobs)
   │
   ▼ (at try-on time)
CatVTON Service — separate FastAPI app, on a rented Vast.ai GPU
(stateless: image in, image out — no Blob/Postgres access)
```

The CatVTON service never holds Blob Storage or Postgres credentials.
It is a pure `(person_image, garment_image) -> result_image` HTTP
function, callable only with a shared API key. This means the rented
Vast.ai machine — temporary, less trusted than Azure — never has a way
to reach user data even if compromised.

## Data model (new tables)

`app/domains/wardrobe/models.py`:

- **`wardrobe_items`**: `id`, `user_id` (FK `users.id`), `blob_url`,
  `category`, `style_tags` (JSONB array of str), `occasion_tags`
  (JSONB array of str), `dominant_colors` (JSONB array of hex str),
  `created_at`, `updated_at`.

`app/domains/tryon/models.py`:

- **`tryon_jobs`**: `id`, `user_id` (FK `users.id`), `wardrobe_item_id`
  (FK `wardrobe_items.id`, nullable until selection completes),
  `catalog_model_id` (FK `catalog_models.id`), `occasion`, `style`,
  `status` (`pending` / `processing` / `done` / `failed`),
  `result_blob_url` (nullable until done), `error_message` (nullable),
  `created_at`, `updated_at`.

The job table doubles as the async work queue (see below) — no
Redis/Celery needed, consistent with the project's existing
Postgres-only infrastructure.

## Wardrobe upload flow

1. Frontend requests a short-lived upload URL: `POST
   /wardrobe/upload-url` → backend generates a Blob **SAS token**
   (write-only, expires in minutes) for a path under the `wardrobe`
   container.
2. Frontend uploads the image **directly to Azure Blob Storage** using
   that SAS token — the image bytes never pass through the App
   Service backend.
3. Frontend confirms completion: `POST /wardrobe/items` with the blob
   path. The backend then:
   - Calls **Gemini 2.0 Flash** with the image and a prompt that lists
     the fixed candidate classes for category/style/occasion, and
     parses the returned JSON.
   - Runs **k-means color quantization** (classical image processing,
     not AI) on the image to extract 1-2 dominant hex colors.
   - Returns the suggested tags to the frontend as a **draft**, not
     yet persisted.
4. The user reviews/edits the suggested tags in the UI, then confirms:
   `PUT /wardrobe/items/{id}` persists the final row. This review step
   exists because zero-shot VLM tagging is not perfectly reliable and
   there is no human review anywhere else in the pipeline.

## Try-on flow (async job)

1. `POST /tryon` with `catalog_model_id`, `occasion`, `style`. The
   backend creates a `tryon_jobs` row with `status=pending` and
   returns its `id` immediately (no waiting).
2. A FastAPI `BackgroundTasks` job then:
   - Sets `status=processing`.
   - **Selects a garment** (see next section) and writes
     `wardrobe_item_id`.
   - Downloads the selected garment's image from Blob Storage and the
     catalog model's image from wherever `CatalogModel.image` actually
     resolves (today a relative path into the frontend's static
     assets, e.g. `/outfit/models/carmen-card.jpg` — the implementer
     needs to confirm the deployed absolute URL for this, since the
     backend fetches it cross-origin, not from Blob Storage). Sends
     both to the **CatVTON service** over HTTP.
   - Uploads the returned result image to the `results` Blob
     container.
   - Sets `status=done` and `result_blob_url`.
   - On any failure (CatVTON unreachable, timeout, bad input), sets
     `status=failed` and `error_message` instead.
3. Frontend polls `GET /tryon/{id}` every 2-3 seconds until `status`
   is `done` or `failed`, then renders the result or the error.

## Garment selection

Given `occasion`, `style`, and the user's `quiz_attempts.season`
(spring/summer/autumn/winter — no sub-variant), selection is a
deterministic ranking, not an AI call:

1. Filter `wardrobe_items` where `occasion_tags` contains `occasion`
   AND `style_tags` contains `style`.
2. Among the filtered set, rank by color distance between each item's
   `dominant_colors` and a **reference swatch set for the user's
   season**: the union of hex colors across that season's 3 sub-palette
   variants in `frontend/lib/palettes.ts` (e.g. for `autumn`, combine
   `autumn-warm` + `autumn-deep` + `autumn-soft`). Take the item with
   the smallest minimum color distance to any color in that set.
3. Because the backend (Python) cannot import the frontend's
   TypeScript palette data, this reference swatch data must be
   **duplicated** as a Python constant (e.g.
   `app/domains/wardrobe/season_palettes.py`), mirrored from
   `frontend/lib/palettes.ts` at implementation time. This duplication
   is intentional, not an oversight — the two runtimes don't share a
   module system — but should be called out with a comment in both
   files pointing at each other, so a future palette edit isn't made
   in only one place.

## CatVTON service on Vast.ai

**Setup:**
1. Rent an NVIDIA GPU instance (RDNA/AMD not viable — CatVTON needs
   CUDA), ≥8GB VRAM (RTX 3060/4060/3090 all sufficient), using a
   Vast.ai template with PyTorch + CUDA preinstalled. Configure a port
   mapping (e.g. container port 8000) to get a public IP:port.
2. Clone `https://github.com/Zheng-Chong/CatVTON`, install its
   dependencies (checkpoints auto-download from HuggingFace on first
   run).
3. Wrap inference in a small FastAPI app (not the bundled Gradio demo)
   exposing:
   ```
   POST /generate
     headers: X-API-Key: <shared secret>
     body: multipart { person_image, garment_image }
     -> response: result image bytes
   ```
4. Require the `X-API-Key` header to match a secret set as an env var
   on the instance — without this, anyone who discovers the public
   IP:port could run (and bill) generations on the rented GPU.

**Connecting the main backend:** because the Vast.ai IP is only known
once the instance is running (and changes if a new instance is
created), store `CATVTON_SERVICE_URL` and `CATVTON_API_KEY` as Azure
App Service environment variables, updated manually each time a fresh
instance is started before a dev/demo session.

**Lifecycle:** start the instance before use, `stop` it afterward
(halts GPU billing; small storage billing continues), `delete` it
entirely once that phase of work is done (per the earlier Vast.ai
billing discussion — stop ≠ zero cost, delete does).

## Out of scope

- The third planned feature (not designed yet).
- Any change to `capsule_wardrobe` or `model_catalog` beyond reading
  from `model_catalog`.
- Migrating the personal color result to the full 12-way palette
  granularity — the design above works with the existing 4-season
  `quiz_attempts.season` field as-is.
- A commercial-license replacement for CatVTON (deferred until/unless
  the project moves toward commercialization).
- Automatic Vast.ai instance lifecycle management (starting/stopping
  it is a manual step for this project's scale).
