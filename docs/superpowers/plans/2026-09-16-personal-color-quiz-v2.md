# Personal Color Quiz v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 5-question / 4-season Personal Color quiz with a 10-question, 3-axis (Hue/Value/Chroma) quiz whose scoring runs server-side and resolves to one of 12 sub-seasons, with a result page that renders real, season-specific content instead of today's hardcoded "Winter" mock.

**Architecture:** `QuizQuestion` gains an `axis` (hue/value/chroma) and optional `image_url`; `QuizOption.season` is replaced by `axis_value` (the axis-specific answer key). A new pure-function module `quiz_attempts/scoring.py` implements the 3-step algorithm (per-axis majority vote → parent season → sub-season). `quiz_attempts/service.py` resolves submitted `(questionId, optionId)` pairs to axis votes, calls the scorer, and persists the full result. The frontend posts raw answers instead of a pre-computed season, and a new static `lib/seasonProfiles.ts` supplies the real palette/description/recommendations content for all 12 sub-seasons, consumed by the rewritten result page.

**Tech Stack:** FastAPI + SQLAlchemy + Alembic + pytest (backend), Next.js App Router + TypeScript + Vitest + React Testing Library + next-intl (frontend), Playwright (one-time illustration asset capture).

**Spec:** `frontend/docs/superpowers/specs/2026-09-16-personal-color-quiz-v2-design.md`

## Global Constraints

- The 10 questions' exact Vietnamese text and per-option axis mapping are fixed — see the spec's "Content: The 10 New Questions" section; copy verbatim, do not paraphrase.
- Axis value vocabularies are fixed: hue = `warm|cool|neutral`, value = `dark|light|medium`, chroma = `bright|muted|neutral`.
- Scoring tie-breaks are fixed per the spec: axis-level ties fall to the middle value; Step-2 neutral fallback prefers `warm`/`muted` on an absolute tie; Step-3 ties fall to the `true-*` (hue-dominant) sub-season.
- The 12 sub-season keys are: `light-spring`, `true-spring`, `bright-spring`, `light-summer`, `true-summer`, `soft-summer`, `soft-autumn`, `true-autumn`, `deep-autumn`, `deep-winter`, `true-winter`, `bright-winter`.
- Quiz content stays admin-editable through the existing CRUD pattern (`require_admin`-gated `POST`/`PUT`/`DELETE`, public `GET`); season-profile content (palette/description/recommendations) is fixed reference data and lives in frontend code, not the DB.
- Existing `quiz_attempts` historical rows are not backfilled; new nullable columns on that table accommodate old rows lacking axis/sub-season data.
- Follow this session's established pattern for schema changes: since quiz content is being wholesale replaced, clear the `quiz_questions`/`quiz_options` tables before running the migration that tightens their columns, so `NOT NULL` additions don't fail against existing rows.

---

## Task 1: Scoring engine (`quiz_attempts/scoring.py`)

**Files:**
- Create: `backend/app/domains/quiz_attempts/scoring.py`
- Test: `backend/tests/domains/quiz_attempts/test_scoring.py`

**Interfaces:**
- Produces: `score_quiz(hue_votes: list[str], value_votes: list[str], chroma_votes: list[str]) -> dict` returning `{"hue_result": str, "value_result": str, "chroma_result": str, "parent_season": str, "sub_season": str}`. Consumed by Task 4 (`quiz_attempts/service.py`).

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/domains/quiz_attempts/test_scoring.py`:

```python
import pytest

from app.domains.quiz_attempts.scoring import score_quiz


def test_clear_hue_and_chroma_majority_picks_the_parent_season():
    result = score_quiz(
        hue_votes=["warm", "warm", "warm", "warm", "cool"],
        value_votes=["light", "light", "medium"],
        chroma_votes=["bright", "bright"],
    )
    assert result["hue_result"] == "warm"
    assert result["chroma_result"] == "bright"
    assert result["parent_season"] == "spring"


@pytest.mark.parametrize(
    "hue,chroma,expected_parent",
    [
        ("warm", "bright", "spring"),
        ("warm", "muted", "autumn"),
        ("cool", "bright", "winter"),
        ("cool", "muted", "summer"),
    ],
)
def test_all_four_hue_chroma_quadrants(hue, chroma, expected_parent):
    hue_votes = [hue] * 5
    chroma_votes = [chroma] * 2
    result = score_quiz(hue_votes, ["medium", "medium", "medium"], chroma_votes)
    assert result["parent_season"] == expected_parent


def test_hue_axis_tie_falls_back_to_neutral():
    # 2 warm / 2 cool / 1 neutral: no single max -> neutral
    result = score_quiz(
        hue_votes=["warm", "warm", "cool", "cool", "neutral"],
        value_votes=["medium", "medium", "medium"],
        chroma_votes=["neutral", "neutral"],
    )
    assert result["hue_result"] == "neutral"


def test_neutral_hue_result_falls_back_to_raw_warm_vs_cool_lean():
    # hue tie -> "neutral", but raw count leans warm 3 vs cool 1 (1 neutral vote)
    result = score_quiz(
        hue_votes=["warm", "warm", "cool", "cool", "neutral"],
        value_votes=["medium", "medium", "medium"],
        chroma_votes=["bright", "bright"],
    )
    # tie is 2-2-1 among warm/cool/neutral -> axis result is neutral (no single max)
    assert result["hue_result"] == "neutral"
    # but raw warm(2) == cool(2) here too, so this case is a full deadlock -> defaults to warm
    assert result["parent_season"] == "spring"


def test_neutral_hue_result_with_a_real_secondary_lean_picks_that_side():
    result = score_quiz(
        hue_votes=["warm", "warm", "warm", "cool", "neutral"],
        value_votes=["medium", "medium", "medium"],
        chroma_votes=["bright", "bright"],
    )
    # 3 warm / 1 cool / 1 neutral -> single max is warm (3), so hue_result is "warm" outright
    assert result["hue_result"] == "warm"
    assert result["parent_season"] == "spring"


def test_chroma_axis_full_tie_falls_back_to_muted_default():
    result = score_quiz(
        hue_votes=["cool", "cool", "cool", "cool", "cool"],
        value_votes=["medium", "medium", "medium"],
        chroma_votes=["bright", "muted"],
    )
    assert result["chroma_result"] == "neutral"
    assert result["parent_season"] == "summer"


def test_value_dominant_sub_season():
    # value is unanimous (3/3 = 1.0 share); chroma landed on neutral (share 0)
    result = score_quiz(
        hue_votes=["warm", "warm", "warm", "warm", "warm"],
        value_votes=["light", "light", "light"],
        chroma_votes=["bright", "neutral"],
    )
    assert result["parent_season"] == "spring"
    assert result["sub_season"] == "light-spring"


def test_chroma_dominant_sub_season():
    # chroma unanimous (2/2 = 1.0); value landed on medium (share 0)
    result = score_quiz(
        hue_votes=["warm", "warm", "warm", "warm", "warm"],
        value_votes=["medium", "medium", "light"],
        chroma_votes=["bright", "bright"],
    )
    assert result["parent_season"] == "spring"
    assert result["sub_season"] == "bright-spring"


def test_equal_shares_default_to_true_sub_season():
    # Both value and chroma land on their middle value -> both shares are 0 (a tie)
    # -> falls to the hue-dominant "true-*" slot. chroma_votes tie 1-1 -> "neutral"
    # axis result, and its side-fallback (muted_count >= bright_count, 1 >= 1) picks
    # "muted" for the parent-season quadrant -> cool + muted -> summer.
    result = score_quiz(
        hue_votes=["cool", "cool", "cool", "cool", "cool"],
        value_votes=["medium", "medium", "medium"],
        chroma_votes=["bright", "muted"],
    )
    assert result["parent_season"] == "summer"
    assert result["sub_season"] == "true-summer"


@pytest.mark.parametrize(
    "parent_hue,parent_chroma,value_votes,chroma_votes,expected_sub_season",
    [
        # Summer: value-dominant -> light-summer, chroma-dominant -> soft-summer
        ("cool", "muted", ["light", "light", "light"], ["muted", "neutral"], "light-summer"),
        ("cool", "muted", ["medium", "medium", "light"], ["muted", "muted"], "soft-summer"),
        # Autumn: value-dominant -> deep-autumn, chroma-dominant -> soft-autumn
        ("warm", "muted", ["dark", "dark", "dark"], ["muted", "neutral"], "deep-autumn"),
        ("warm", "muted", ["medium", "medium", "dark"], ["muted", "muted"], "soft-autumn"),
        # Winter: value-dominant -> deep-winter, chroma-dominant -> bright-winter
        ("cool", "bright", ["dark", "dark", "dark"], ["bright", "neutral"], "deep-winter"),
        ("cool", "bright", ["medium", "medium", "dark"], ["bright", "bright"], "bright-winter"),
    ],
)
def test_sub_season_dominance_across_all_parent_seasons(
    parent_hue, parent_chroma, value_votes, chroma_votes, expected_sub_season
):
    result = score_quiz(
        hue_votes=[parent_hue] * 5,
        value_votes=value_votes,
        chroma_votes=chroma_votes,
    )
    assert result["sub_season"] == expected_sub_season
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz_attempts/test_scoring.py -v
```

Expected: FAIL — `app.domains.quiz_attempts.scoring` doesn't exist yet.

- [ ] **Step 3: Write the implementation**

Create `backend/app/domains/quiz_attempts/scoring.py`:

```python
from collections import Counter

_PARENT_SEASON_BY_QUADRANT = {
    ("warm", "bright"): "spring",
    ("warm", "muted"): "autumn",
    ("cool", "bright"): "winter",
    ("cool", "muted"): "summer",
}

_SUB_SEASON_SLOTS_BY_PARENT = {
    "spring": {"value": "light-spring", "hue": "true-spring", "chroma": "bright-spring"},
    "summer": {"value": "light-summer", "hue": "true-summer", "chroma": "soft-summer"},
    "autumn": {"value": "deep-autumn", "hue": "true-autumn", "chroma": "soft-autumn"},
    "winter": {"value": "deep-winter", "hue": "true-winter", "chroma": "bright-winter"},
}


def _axis_result(votes: list[str], middle_value: str) -> str:
    counts = Counter(votes)
    max_count = max(counts.values())
    winners = [value for value, count in counts.items() if count == max_count]
    return winners[0] if len(winners) == 1 else middle_value


def _hue_side(hue_result: str, hue_votes: list[str]) -> str:
    if hue_result != "neutral":
        return hue_result
    warm_count = hue_votes.count("warm")
    cool_count = hue_votes.count("cool")
    return "warm" if warm_count >= cool_count else "cool"


def _chroma_side(chroma_result: str, chroma_votes: list[str]) -> str:
    if chroma_result != "neutral":
        return chroma_result
    bright_count = chroma_votes.count("bright")
    muted_count = chroma_votes.count("muted")
    return "muted" if muted_count >= bright_count else "bright"


def _dominant_slot(
    value_result: str, chroma_result: str, value_votes: list[str], chroma_votes: list[str]
) -> str:
    value_share = value_votes.count(value_result) / len(value_votes) if value_result in ("dark", "light") else 0.0
    chroma_share = (
        chroma_votes.count(chroma_result) / len(chroma_votes) if chroma_result in ("bright", "muted") else 0.0
    )
    if value_share > chroma_share:
        return "value"
    if chroma_share > value_share:
        return "chroma"
    return "hue"


def score_quiz(hue_votes: list[str], value_votes: list[str], chroma_votes: list[str]) -> dict:
    hue_result = _axis_result(hue_votes, "neutral")
    value_result = _axis_result(value_votes, "medium")
    chroma_result = _axis_result(chroma_votes, "neutral")

    hue_side = _hue_side(hue_result, hue_votes)
    chroma_side = _chroma_side(chroma_result, chroma_votes)
    parent_season = _PARENT_SEASON_BY_QUADRANT[(hue_side, chroma_side)]

    dominant_slot = _dominant_slot(value_result, chroma_result, value_votes, chroma_votes)
    sub_season = _SUB_SEASON_SLOTS_BY_PARENT[parent_season][dominant_slot]

    return {
        "hue_result": hue_result,
        "value_result": value_result,
        "chroma_result": chroma_result,
        "parent_season": parent_season,
        "sub_season": sub_season,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz_attempts/test_scoring.py -v
```

Expected: PASS (18 tests — the 2 parametrized tests expand to 4 and 6 cases respectively).

- [ ] **Step 5: Commit**

```bash
git add backend/app/domains/quiz_attempts/scoring.py backend/tests/domains/quiz_attempts/test_scoring.py
git commit -m "feat: add the 3-axis personal color scoring algorithm"
```

---

## Task 2: Wrist-vein illustration asset

**Files:**
- Create (committed): `frontend/public/personal-color/quiz/wrist-veins.jpg`

No app-code interface — produces the static asset that Task 3's seed data
references at `/personal-color/quiz/wrist-veins.jpg`.

- [ ] **Step 1: Write the designed illustration**

Create `/tmp/wrist-veins.html`:

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; font-family: system-ui, sans-serif; background:#faf9fb; display:flex; }
  .panel { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:24px; }
  .wrist { width:160px; height:220px; border-radius:80px 80px 24px 24px; background:#e8c39e; position:relative; box-shadow:inset 0 0 20px rgba(0,0,0,0.05); }
  .vein { position:absolute; width:10px; border-radius:6px; top:30px; height:150px; }
  .vein.v1 { left:55px; transform:rotate(-8deg); }
  .vein.v2 { left:85px; transform:rotate(4deg); height:130px; top:45px; }
  .warm .vein { background:linear-gradient(#8fae52,#5f7a34); }
  .cool .vein { background:linear-gradient(#6f8fd4,#4a5fb0); }
  .label { font-size:15px; font-weight:700; color:#041c37; }
</style></head>
<body>
  <div class="panel">
    <div class="wrist warm"><div class="vein v1"></div><div class="vein v2"></div></div>
    <div class="label">Ấm (Olive / Xanh lá)</div>
  </div>
  <div class="panel">
    <div class="wrist cool"><div class="vein v1"></div><div class="vein v2"></div></div>
    <div class="label">Lạnh (Xanh dương / Tím)</div>
  </div>
</body></html>
```

- [ ] **Step 2: Screenshot it**

```bash
UA="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
npx playwright screenshot -b chromium --viewport-size "600,400" --user-agent "$UA" "file:///tmp/wrist-veins.html" "/tmp/wrist-veins-raw.png"
```

View the screenshot — confirm two labeled wrist illustrations (olive-green
veins on the left labeled "Ấm", blue-purple veins on the right labeled
"Lạnh") render without broken CSS.

- [ ] **Step 3: Resize, compress, and place the final image**

```bash
python3 <<'EOF'
from PIL import Image

img = Image.open('/tmp/wrist-veins-raw.png').convert('RGB')
width, height = img.size
new_width = 600
new_height = round(height * (new_width / width))
img.resize((new_width, new_height), Image.LANCZOS).save(
    'frontend/public/personal-color/quiz/wrist-veins.jpg', quality=85
)
print(new_width, new_height)
EOF
```

(Create the `frontend/public/personal-color/quiz/` directory first if it
doesn't exist: `mkdir -p frontend/public/personal-color/quiz`.)

- [ ] **Step 4: Verify and commit**

```bash
ls -la frontend/public/personal-color/quiz/wrist-veins.jpg
git add frontend/public/personal-color/quiz/wrist-veins.jpg
git commit -m "feat: add the wrist-vein illustration for the personal color quiz"
```

---

## Task 3: Quiz domain — axis schema + 10-question seed

**Files:**
- Modify: `backend/app/domains/quiz/models.py`
- Modify: `backend/app/domains/quiz/schemas.py`
- Modify: `backend/app/domains/quiz/service.py`
- Modify: `backend/app/domains/quiz/seed.py`
- Create: `backend/alembic/versions/<generated>_add_axis_to_quiz_questions_and_options.py`
- Test: `backend/tests/domains/quiz/test_schemas.py` (new)
- Test: `backend/tests/domains/quiz/test_service.py` (rewrite)
- Test: `backend/tests/domains/quiz/test_router.py` (rewrite)
- Test: `backend/tests/domains/quiz/test_seed.py` (rewrite)

**Interfaces:**
- Produces: `QuizQuestion.axis: str`, `QuizQuestion.image_url: str | None`,
  `QuizOption.axis_value: str` (SQLAlchemy models) — consumed by Task 4
  (`quiz_attempts/service.py`, which reads these columns to build the vote
  lists for `score_quiz`).
- Produces: `AXES = ["hue", "value", "chroma"]`,
  `AXIS_VALUES = {"hue": [...], "value": [...], "chroma": [...]}` in
  `quiz/schemas.py`.

- [ ] **Step 1: Write the failing schema test**

Create `backend/tests/domains/quiz/test_schemas.py`:

```python
import pytest
from pydantic import ValidationError

from app.domains.quiz.schemas import QuizQuestionInput

HUE_QUESTION = {
    "questionText": "Câu hue test?",
    "axis": "hue",
    "sortOrder": 0,
    "options": [
        {"label": "A", "axisValue": "warm"},
        {"label": "B", "axisValue": "cool"},
        {"label": "C", "axisValue": "neutral"},
    ],
}


def test_accepts_option_axis_values_matching_the_question_axis():
    question = QuizQuestionInput(**HUE_QUESTION)
    assert question.axis == "hue"
    assert [option.axis_value for option in question.options] == ["warm", "cool", "neutral"]


def test_rejects_an_option_axis_value_not_valid_for_the_question_axis():
    with pytest.raises(ValidationError):
        QuizQuestionInput(
            **{**HUE_QUESTION, "options": [{"label": "A", "axisValue": "dark"}, {"label": "B", "axisValue": "cool"}]}
        )


def test_rejects_an_invalid_axis():
    with pytest.raises(ValidationError):
        QuizQuestionInput(**{**HUE_QUESTION, "axis": "not-a-real-axis"})


def test_image_url_is_optional_and_defaults_to_none():
    question = QuizQuestionInput(**HUE_QUESTION)
    assert question.image_url is None


def test_image_url_can_be_set():
    question = QuizQuestionInput(**{**HUE_QUESTION, "imageUrl": "/personal-color/quiz/wrist-veins.jpg"})
    assert question.image_url == "/personal-color/quiz/wrist-veins.jpg"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz/test_schemas.py -v
```

Expected: FAIL — `QuizQuestionInput` has no `axis`/`imageUrl` field yet, `QuizOptionInput` has no `axisValue`.

- [ ] **Step 3: Update the models**

Replace `backend/app/domains/quiz/models.py`:

```python
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    question_text: Mapped[str] = mapped_column(String(500), nullable=False)
    axis: Mapped[str] = mapped_column(String(20), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
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
    axis_value: Mapped[str] = mapped_column(String(20), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    question: Mapped["QuizQuestion"] = relationship(back_populates="options")
```

- [ ] **Step 4: Update the schemas**

Replace `backend/app/domains/quiz/schemas.py`:

```python
from pydantic import field_validator, model_validator

from app.domains.auth.schemas import CamelModel

AXES = ["hue", "value", "chroma"]
AXIS_VALUES = {
    "hue": ["warm", "cool", "neutral"],
    "value": ["dark", "light", "medium"],
    "chroma": ["bright", "muted", "neutral"],
}


class QuizOptionInput(CamelModel):
    label: str
    axis_value: str

    @field_validator("label")
    @classmethod
    def label_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Lựa chọn không được để trống")
        return value.strip()


class QuizQuestionInput(CamelModel):
    question_text: str
    axis: str
    image_url: str | None = None
    sort_order: int = 0
    options: list[QuizOptionInput]

    @field_validator("question_text")
    @classmethod
    def question_text_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Nội dung câu hỏi không được để trống")
        return value.strip()

    @field_validator("axis")
    @classmethod
    def axis_valid(cls, value: str) -> str:
        if value not in AXES:
            raise ValueError("Trục không hợp lệ")
        return value

    @field_validator("options")
    @classmethod
    def at_least_two_options(cls, value: list[QuizOptionInput]) -> list[QuizOptionInput]:
        if len(value) < 2:
            raise ValueError("Cần ít nhất 2 lựa chọn")
        return value

    @model_validator(mode="after")
    def options_match_axis(self) -> "QuizQuestionInput":
        valid_values = AXIS_VALUES[self.axis]
        for option in self.options:
            if option.axis_value not in valid_values:
                raise ValueError(f"Giá trị trục '{option.axis_value}' không hợp lệ cho trục '{self.axis}'")
        return self


class QuizOptionResponse(CamelModel):
    id: int
    label: str
    axis_value: str
    sort_order: int


class QuizQuestionResponse(CamelModel):
    id: int
    question_text: str
    axis: str
    image_url: str | None
    sort_order: int
    options: list[QuizOptionResponse]
```

- [ ] **Step 5: Run schema test to verify it passes**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz/test_schemas.py -v
```

Expected: PASS (5 tests).

- [ ] **Step 6: Update the service**

In `backend/app/domains/quiz/service.py`, replace every `season=option.season`
with `axis_value=option.axis_value`, and set `axis=data.axis, image_url=data.image_url`
when constructing `QuizQuestion`:

```python
from sqlalchemy.orm import Session

from app.domains.quiz.models import QuizOption, QuizQuestion
from app.domains.quiz.schemas import QuizQuestionInput


def list_quiz_questions(db: Session) -> list[QuizQuestion]:
    return db.query(QuizQuestion).order_by(QuizQuestion.sort_order.asc()).all()


def get_quiz_question(db: Session, question_id: int) -> QuizQuestion | None:
    return db.get(QuizQuestion, question_id)


def create_quiz_question(db: Session, data: QuizQuestionInput) -> QuizQuestion:
    question = QuizQuestion(
        question_text=data.question_text, axis=data.axis, image_url=data.image_url, sort_order=data.sort_order
    )
    db.add(question)
    db.flush()
    for index, option in enumerate(data.options):
        db.add(
            QuizOption(question_id=question.id, label=option.label, axis_value=option.axis_value, sort_order=index)
        )
    db.commit()
    db.refresh(question)
    return question


def update_quiz_question(db: Session, question_id: int, data: QuizQuestionInput) -> QuizQuestion | None:
    question = get_quiz_question(db, question_id)
    if question is None:
        return None

    question.question_text = data.question_text
    question.axis = data.axis
    question.image_url = data.image_url
    question.sort_order = data.sort_order
    db.query(QuizOption).filter(QuizOption.question_id == question_id).delete()
    db.flush()
    for index, option in enumerate(data.options):
        db.add(
            QuizOption(question_id=question.id, label=option.label, axis_value=option.axis_value, sort_order=index)
        )
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

- [ ] **Step 7: Rewrite the service and router tests**

Replace `backend/tests/domains/quiz/test_service.py`:

```python
import pytest
from pydantic import ValidationError

from app.domains.quiz import service
from app.domains.quiz.models import QuizOption
from app.domains.quiz.schemas import QuizQuestionInput

VALID_INPUT = {
    "questionText": "Câu hỏi test?",
    "axis": "hue",
    "sortOrder": 0,
    "options": [
        {"label": "A", "axisValue": "warm"},
        {"label": "B", "axisValue": "cool"},
    ],
}


def test_create_quiz_question_with_options(db_session):
    question = service.create_quiz_question(db_session, QuizQuestionInput(**VALID_INPUT))
    assert question.id is not None
    assert question.axis == "hue"
    assert len(question.options) == 2
    assert question.options[0].label == "A"
    assert question.options[0].axis_value == "warm"


def test_list_quiz_questions_orders_by_sort_order(db_session):
    first = service.create_quiz_question(db_session, QuizQuestionInput(**{**VALID_INPUT, "sortOrder": 1}))
    second = service.create_quiz_question(db_session, QuizQuestionInput(**{**VALID_INPUT, "sortOrder": 0}))
    questions = service.list_quiz_questions(db_session)
    assert [q.id for q in questions] == [second.id, first.id]


def test_get_quiz_question_returns_none_when_missing(db_session):
    assert service.get_quiz_question(db_session, 99999) is None


def test_create_quiz_question_stores_the_image_url(db_session):
    question = service.create_quiz_question(
        db_session, QuizQuestionInput(**{**VALID_INPUT, "imageUrl": "/personal-color/quiz/wrist-veins.jpg"})
    )
    assert question.image_url == "/personal-color/quiz/wrist-veins.jpg"


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
                    {"label": "C", "axisValue": "warm"},
                    {"label": "D", "axisValue": "cool"},
                    {"label": "E", "axisValue": "neutral"},
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
        QuizQuestionInput(**{**VALID_INPUT, "options": [{"label": "Only one", "axisValue": "warm"}]})
```

Replace `backend/tests/domains/quiz/test_router.py`:

```python
VALID_BODY = {
    "questionText": "Câu hỏi test?",
    "axis": "hue",
    "sortOrder": 0,
    "options": [
        {"label": "A", "axisValue": "warm"},
        {"label": "B", "axisValue": "cool"},
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
    client.post("/auth/register", json={"name": "T", "identifier": "quiz-user@example.com", "password": "password123"})
    client.post("/auth/login", json={"identifier": "quiz-user@example.com", "password": "password123"})
    response = client.post("/quiz-questions", json=VALID_BODY)
    assert response.status_code == 403


def test_admin_can_create_get_update_and_delete_quiz_question(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "identifier": "quiz-admin@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "quiz-admin@example.com")
    client.post("/auth/login", json={"identifier": "quiz-admin@example.com", "password": "password123"})

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
                {"label": "C", "axisValue": "warm"},
                {"label": "D", "axisValue": "cool"},
                {"label": "E", "axisValue": "neutral"},
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
        "/auth/register", json={"name": "Admin", "identifier": "quiz-admin2@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "quiz-admin2@example.com")
    client.post("/auth/login", json={"identifier": "quiz-admin2@example.com", "password": "password123"})

    response = client.post(
        "/quiz-questions", json={**VALID_BODY, "options": [{"label": "Only one", "axisValue": "warm"}]}
    )
    assert response.status_code == 422


def test_create_quiz_question_rejects_an_axis_value_not_valid_for_the_axis(client, db_session):
    client.post(
        "/auth/register", json={"name": "Admin", "identifier": "quiz-admin3@example.com", "password": "password123"}
    )
    _promote_to_admin(db_session, "quiz-admin3@example.com")
    client.post("/auth/login", json={"identifier": "quiz-admin3@example.com", "password": "password123"})

    response = client.post(
        "/quiz-questions",
        json={**VALID_BODY, "options": [{"label": "A", "axisValue": "dark"}, {"label": "B", "axisValue": "cool"}]},
    )
    assert response.status_code == 422
```

- [ ] **Step 8: Run the service and router tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz/test_service.py tests/domains/quiz/test_router.py -v
```

Expected: PASS (all tests).

- [ ] **Step 9: Write the 10-question seed data**

Replace `backend/app/domains/quiz/seed.py`:

```python
from sqlalchemy.orm import Session

from app.domains.quiz.models import QuizOption, QuizQuestion

DEMO_QUIZ_QUESTIONS = [
    {
        "sort_order": 0,
        "axis": "hue",
        "image_url": "/personal-color/quiz/wrist-veins.jpg",
        "question_text": "Hãy nhìn vào tĩnh mạch ở cổ tay dưới ánh sáng tự nhiên. Chúng nghiêng về màu gì?",
        "options": [
            {"label": "Xanh lá / Olive", "axis_value": "warm"},
            {"label": "Xanh dương / Tím", "axis_value": "cool"},
            {"label": "Lẫn lộn khó phân biệt", "axis_value": "neutral"},
        ],
    },
    {
        "sort_order": 1,
        "axis": "hue",
        "image_url": None,
        "question_text": "Đặt một tờ giấy bạc và giấy vàng (hoặc trang sức vàng/bạc) kề sát mặt. Loại nào làm da bạn sáng hơn?",
        "options": [
            {"label": "Vàng nguyên bản (Gold)", "axis_value": "warm"},
            {"label": "Bạc / Bạch kim (Silver)", "axis_value": "cool"},
            {"label": "Cả hai đều hài hòa", "axis_value": "neutral"},
        ],
    },
    {
        "sort_order": 2,
        "axis": "hue",
        "image_url": None,
        "question_text": "Khi tiếp xúc lâu với nắng gắt, da bạn phản ứng thế nào?",
        "options": [
            {"label": "Nhanh chóng rám nắng, sạm đen", "axis_value": "warm"},
            {"label": "Dễ ửng đỏ, cháy rát", "axis_value": "cool"},
            {"label": "Ửng đỏ nhẹ rồi mới chuyển rám", "axis_value": "neutral"},
        ],
    },
    {
        "sort_order": 3,
        "axis": "hue",
        "image_url": None,
        "question_text": "Cầm một tờ giấy trắng tinh kề cạnh mặt. So với tờ giấy, da bạn ánh lên màu gì?",
        "options": [
            {"label": "Ánh vàng / Cam (Yellowish/Golden)", "axis_value": "warm"},
            {"label": "Ánh hồng / Đỏ (Pinkish/Rosy)", "axis_value": "cool"},
            {"label": "Không rõ ràng (No strong leaning)", "axis_value": "neutral"},
        ],
    },
    {
        "sort_order": 4,
        "axis": "value",
        "image_url": None,
        "question_text": "Màu tóc tự nhiên của bạn là màu gì?",
        "options": [
            {"label": "Đen láy / Nâu cực đậm", "axis_value": "dark"},
            {"label": "Nâu sáng / Hạt dẻ", "axis_value": "light"},
            {"label": "Nâu trung bình", "axis_value": "medium"},
        ],
    },
    {
        "sort_order": 5,
        "axis": "value",
        "image_url": None,
        "question_text": "Màu tròng đen của mắt bạn nghiêng về phổ màu nào?",
        "options": [
            {"label": "Đen / Nâu rất đậm, sâu thẳm", "axis_value": "dark"},
            {"label": "Nâu sáng / Hổ phách, trong trẻo", "axis_value": "light"},
            {"label": "Nâu trung bình", "axis_value": "medium"},
        ],
    },
    {
        "sort_order": 6,
        "axis": "value",
        "image_url": None,
        "question_text": "Nhìn vào ảnh mặt mộc, sự chênh lệch (tương phản) giữa Tóc - Da - Mắt của bạn thế nào? (Chụp ảnh và chỉnh thành màu đen trắng sẽ dễ xác định hơn)",
        "options": [
            {"label": "Rất rõ (Tóc sẫm nổi bật trên nền da)", "axis_value": "dark"},
            {"label": "Thấp (Tóc, da, mắt gần màu nhau, hòa quyện)", "axis_value": "light"},
            {"label": "Trung bình", "axis_value": "medium"},
        ],
    },
    {
        "sort_order": 7,
        "axis": "chroma",
        "image_url": None,
        "question_text": "Khi mặc màu rực rỡ (Đỏ tươi, Xanh cobalt, Vàng chanh), khuôn mặt bạn trông thế nào?",
        "options": [
            {"label": "Bừng sáng, sắc nét và nổi bật hẳn lên", "axis_value": "bright"},
            {"label": "Bị màu áo lấn át, da nhợt nhạt/tối sầm", "axis_value": "muted"},
            {"label": "Bình thường", "axis_value": "neutral"},
        ],
    },
    {
        "sort_order": 8,
        "axis": "chroma",
        "image_url": None,
        "question_text": "Khi mặc màu trầm khói (Hồng đất, Rêu xám, Nâu be), bạn thấy thế nào?",
        "options": [
            {"label": "Nhợt nhạt, già đi và thiếu sức sống", "axis_value": "bright"},
            {"label": "Rất sang trọng, hài hòa và tôn da", "axis_value": "muted"},
            {"label": "Bình thường", "axis_value": "neutral"},
        ],
    },
    {
        "sort_order": 9,
        "axis": "hue",
        "image_url": None,
        "question_text": "Nhóm màu nào bạn mặc và được khen nhiều nhất?",
        "options": [
            {"label": "Ấm: Cam đào, Vàng ấm, Nâu đất, Rêu", "axis_value": "warm"},
            {"label": "Lạnh: Hồng pastel, Xanh baby, Đỏ cherry, Navy", "axis_value": "cool"},
            {"label": "Bình thường", "axis_value": "neutral"},
        ],
    },
]


def seed_demo_quiz_questions(db: Session) -> None:
    if db.query(QuizQuestion).count() > 0:
        return
    for question_data in DEMO_QUIZ_QUESTIONS:
        question = QuizQuestion(
            question_text=question_data["question_text"],
            axis=question_data["axis"],
            image_url=question_data["image_url"],
            sort_order=question_data["sort_order"],
        )
        db.add(question)
        db.flush()
        for index, option_data in enumerate(question_data["options"]):
            db.add(
                QuizOption(
                    question_id=question.id,
                    label=option_data["label"],
                    axis_value=option_data["axis_value"],
                    sort_order=index,
                )
            )
    db.commit()
```

- [ ] **Step 10: Rewrite the seed test**

Replace `backend/tests/domains/quiz/test_seed.py`:

```python
from app.domains.quiz.models import QuizOption, QuizQuestion
from app.domains.quiz.seed import seed_demo_quiz_questions


def test_seed_demo_quiz_questions_creates_ten_questions(db_session):
    seed_demo_quiz_questions(db_session)
    questions = db_session.query(QuizQuestion).order_by(QuizQuestion.sort_order.asc()).all()
    assert len(questions) == 10
    assert questions[0].axis == "hue"
    assert questions[0].image_url == "/personal-color/quiz/wrist-veins.jpg"
    assert questions[0].options[0].label == "Xanh lá / Olive"
    assert questions[0].options[0].axis_value == "warm"


def test_seed_demo_quiz_questions_has_the_right_axis_distribution(db_session):
    seed_demo_quiz_questions(db_session)
    questions = db_session.query(QuizQuestion).all()
    axis_counts = {"hue": 0, "value": 0, "chroma": 0}
    for question in questions:
        axis_counts[question.axis] += 1
    assert axis_counts == {"hue": 5, "value": 3, "chroma": 2}


def test_seed_demo_quiz_questions_every_option_matches_a_valid_axis_value(db_session):
    from app.domains.quiz.schemas import AXIS_VALUES

    seed_demo_quiz_questions(db_session)
    for question in db_session.query(QuizQuestion).all():
        for option in question.options:
            assert option.axis_value in AXIS_VALUES[question.axis]


def test_seed_demo_quiz_questions_is_idempotent(db_session):
    seed_demo_quiz_questions(db_session)
    seed_demo_quiz_questions(db_session)
    assert db_session.query(QuizQuestion).count() == 10
    assert db_session.query(QuizOption).count() == 30


def test_deleting_question_cascades_to_options(db_session):
    seed_demo_quiz_questions(db_session)
    question = db_session.query(QuizQuestion).first()
    question_id = question.id
    db_session.delete(question)
    db_session.commit()
    assert db_session.query(QuizOption).filter(QuizOption.question_id == question_id).count() == 0
```

(All 10 seeded questions have exactly 3 options each, so the total is `10 * 3 = 30`.)

- [ ] **Step 11: Run the seed test to verify it passes**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz/test_seed.py -v
```

Expected: PASS (5 tests).

- [ ] **Step 12: Clear existing quiz content, then generate and run the migration**

```bash
cd backend && source venv/bin/activate
python3 <<'EOF'
import app.main  # noqa
from app.db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()
db.execute(text("DELETE FROM quiz_options"))
db.execute(text("DELETE FROM quiz_questions"))
db.commit()
print("Cleared quiz_questions/quiz_options.")
db.close()
EOF

alembic revision --autogenerate -m "add axis to quiz questions and options"
```

Open the generated file under `backend/alembic/versions/` and confirm it
contains (adjust only if column order differs):

```python
def upgrade() -> None:
    op.add_column('quiz_questions', sa.Column('axis', sa.String(length=20), nullable=False))
    op.add_column('quiz_questions', sa.Column('image_url', sa.String(length=500), nullable=True))
    op.add_column('quiz_options', sa.Column('axis_value', sa.String(length=20), nullable=False))
    op.drop_column('quiz_options', 'season')


def downgrade() -> None:
    op.add_column('quiz_options', sa.Column('season', sa.VARCHAR(length=20), nullable=False))
    op.drop_column('quiz_options', 'axis_value')
    op.drop_column('quiz_questions', 'image_url')
    op.drop_column('quiz_questions', 'axis')
```

Then apply it:

```bash
alembic upgrade head
```

Expected: succeeds without error (both tables are empty at this point, so
the `NOT NULL` additions have nothing to violate).

- [ ] **Step 13: Run the full quiz test suite and commit**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz/ -v
```

Expected: PASS (all tests across `test_schemas.py`, `test_service.py`,
`test_router.py`, `test_seed.py`).

```bash
git add backend/app/domains/quiz/ backend/tests/domains/quiz/ backend/alembic/versions/
git commit -m "feat: add axis-based quiz schema and the 10-question personal color quiz"
```

---

## Task 4: Quiz attempts domain — score and persist the full result

**Files:**
- Modify: `backend/app/domains/quiz_attempts/models.py`
- Modify: `backend/app/domains/quiz_attempts/schemas.py`
- Modify: `backend/app/domains/quiz_attempts/service.py`
- Modify: `backend/app/domains/quiz_attempts/router.py`
- Create: `backend/alembic/versions/<generated>_add_scoring_fields_to_quiz_attempts.py`
- Test: `backend/tests/domains/quiz_attempts/test_models.py` (rewrite)
- Test: `backend/tests/domains/quiz_attempts/test_service.py` (rewrite)
- Test: `backend/tests/domains/quiz_attempts/test_router.py` (rewrite)

**Interfaces:**
- Consumes: `score_quiz` from Task 1 (`app.domains.quiz_attempts.scoring`);
  `QuizOption`/`QuizQuestion` models from Task 3 (`app.domains.quiz.models`).
- Produces: `service.create_quiz_attempt(db, answers: list[QuizAnswerInput], user_id: int | None) -> QuizAttempt`
  where `QuizAttempt` now has `sub_season`, `parent_season`, `hue_result`,
  `value_result`, `chroma_result` fields — this is the frontend-facing
  contract Task 7 (`QuizFlow.tsx`) and Task 8 (result page) depend on.

- [ ] **Step 1: Write the failing model test**

Replace `backend/tests/domains/quiz_attempts/test_models.py`:

```python
from app.core.security import hash_password
from app.domains.auth.models import User
from app.domains.quiz_attempts.models import QuizAttempt


def test_create_quiz_attempt_allows_a_null_user_id(db_session):
    attempt = QuizAttempt(
        sub_season="true-winter",
        parent_season="winter",
        hue_result="cool",
        value_result="medium",
        chroma_result="neutral",
        user_id=None,
    )
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

    attempt = QuizAttempt(
        sub_season="true-winter",
        parent_season="winter",
        hue_result="cool",
        value_result="medium",
        chroma_result="neutral",
        user_id=user.id,
    )
    db_session.add(attempt)
    db_session.commit()
    db_session.refresh(attempt)

    assert attempt.user_id == user.id
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz_attempts/test_models.py -v
```

Expected: FAIL — `QuizAttempt.__init__()` doesn't accept `sub_season` etc. yet
(it still only has `season`).

- [ ] **Step 3: Update the model**

Replace `backend/app/domains/quiz_attempts/models.py`:

```python
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    sub_season: Mapped[str] = mapped_column(String(30), nullable=False)
    parent_season: Mapped[str] = mapped_column(String(20), nullable=False)
    hue_result: Mapped[str] = mapped_column(String(20), nullable=False)
    value_result: Mapped[str] = mapped_column(String(20), nullable=False)
    chroma_result: Mapped[str] = mapped_column(String(20), nullable=False)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
```

- [ ] **Step 4: Run the model test to verify it passes**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz_attempts/test_models.py -v
```

Expected: PASS (2 tests).

- [ ] **Step 5: Write the failing service test**

Replace `backend/tests/domains/quiz_attempts/test_service.py`:

```python
import pytest

from app.domains.auth import service as auth_service
from app.domains.quiz import service as quiz_service
from app.domains.quiz.schemas import QuizQuestionInput
from app.domains.quiz_attempts import service
from app.domains.quiz_attempts.schemas import QuizAnswerInput


def _seed_one_question_per_axis(db_session):
    hue_question = quiz_service.create_quiz_question(
        db_session,
        QuizQuestionInput(
            question_text="Hue?",
            axis="hue",
            options=[{"label": "A", "axisValue": "warm"}, {"label": "B", "axisValue": "cool"}],
        ),
    )
    value_question = quiz_service.create_quiz_question(
        db_session,
        QuizQuestionInput(
            question_text="Value?",
            axis="value",
            options=[{"label": "A", "axisValue": "light"}, {"label": "B", "axisValue": "dark"}],
        ),
    )
    chroma_question = quiz_service.create_quiz_question(
        db_session,
        QuizQuestionInput(
            question_text="Chroma?",
            axis="chroma",
            options=[{"label": "A", "axisValue": "bright"}, {"label": "B", "axisValue": "muted"}],
        ),
    )
    return hue_question, value_question, chroma_question


def test_create_quiz_attempt_scores_and_persists_the_full_result(db_session):
    hue_question, value_question, chroma_question = _seed_one_question_per_axis(db_session)

    answers = [
        QuizAnswerInput(question_id=hue_question.id, option_id=hue_question.options[0].id),  # warm
        QuizAnswerInput(question_id=value_question.id, option_id=value_question.options[0].id),  # light
        QuizAnswerInput(question_id=chroma_question.id, option_id=chroma_question.options[0].id),  # bright
    ]

    attempt = service.create_quiz_attempt(db_session, answers, user_id=None)

    assert attempt.hue_result == "warm"
    assert attempt.value_result == "light"
    assert attempt.chroma_result == "bright"
    assert attempt.parent_season == "spring"
    assert attempt.sub_season == "light-spring"
    assert attempt.user_id is None


def test_create_quiz_attempt_attributes_to_a_user(db_session):
    hue_question, value_question, chroma_question = _seed_one_question_per_axis(db_session)
    user = auth_service.create_user(db_session, name="Test", email="quiz-attempt-svc@example.com", password="password123")

    answers = [
        QuizAnswerInput(question_id=hue_question.id, option_id=hue_question.options[1].id),  # cool
        QuizAnswerInput(question_id=value_question.id, option_id=value_question.options[1].id),  # dark
        QuizAnswerInput(question_id=chroma_question.id, option_id=chroma_question.options[1].id),  # muted
    ]

    attempt = service.create_quiz_attempt(db_session, answers, user_id=user.id)
    assert attempt.user_id == user.id
    assert attempt.parent_season == "summer"


def test_create_quiz_attempt_rejects_an_option_that_does_not_belong_to_its_question(db_session):
    hue_question, value_question, _chroma_question = _seed_one_question_per_axis(db_session)

    answers = [
        QuizAnswerInput(question_id=hue_question.id, option_id=value_question.options[0].id),
    ]

    with pytest.raises(service.InvalidAnswerError):
        service.create_quiz_attempt(db_session, answers, user_id=None)


def test_get_latest_attempt_returns_none_when_the_user_has_no_attempts(db_session):
    user = auth_service.create_user(db_session, name="Test", email="quiz-latest-1@example.com", password="password123")
    assert service.get_latest_attempt(db_session, user.id) is None


def test_get_latest_attempt_returns_the_most_recent_one(db_session):
    hue_question, value_question, chroma_question = _seed_one_question_per_axis(db_session)
    user = auth_service.create_user(db_session, name="Test", email="quiz-latest-2@example.com", password="password123")

    first_answers = [
        QuizAnswerInput(question_id=hue_question.id, option_id=hue_question.options[0].id),
        QuizAnswerInput(question_id=value_question.id, option_id=value_question.options[0].id),
        QuizAnswerInput(question_id=chroma_question.id, option_id=chroma_question.options[0].id),
    ]
    second_answers = [
        QuizAnswerInput(question_id=hue_question.id, option_id=hue_question.options[1].id),
        QuizAnswerInput(question_id=value_question.id, option_id=value_question.options[1].id),
        QuizAnswerInput(question_id=chroma_question.id, option_id=chroma_question.options[1].id),
    ]
    service.create_quiz_attempt(db_session, first_answers, user.id)
    latest = service.create_quiz_attempt(db_session, second_answers, user.id)

    result = service.get_latest_attempt(db_session, user.id)

    assert result is not None
    assert result.id == latest.id
    assert result.parent_season == "summer"


def test_get_latest_attempt_ignores_other_users_attempts(db_session):
    hue_question, value_question, chroma_question = _seed_one_question_per_axis(db_session)
    user = auth_service.create_user(db_session, name="Test", email="quiz-latest-3@example.com", password="password123")
    other_user = auth_service.create_user(db_session, name="Other", email="quiz-latest-4@example.com", password="password123")

    answers = [
        QuizAnswerInput(question_id=hue_question.id, option_id=hue_question.options[0].id),
        QuizAnswerInput(question_id=value_question.id, option_id=value_question.options[0].id),
        QuizAnswerInput(question_id=chroma_question.id, option_id=chroma_question.options[0].id),
    ]
    service.create_quiz_attempt(db_session, answers, other_user.id)

    assert service.get_latest_attempt(db_session, user.id) is None
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz_attempts/test_service.py -v
```

Expected: FAIL — `quiz_attempts.schemas` has no `QuizAnswerInput` yet, and
`service.create_quiz_attempt` still takes `(db, season, user_id)`.

- [ ] **Step 7: Update the schemas**

Replace `backend/app/domains/quiz_attempts/schemas.py`:

```python
from datetime import datetime

from pydantic import field_validator

from app.domains.auth.schemas import CamelModel

PARENT_SEASONS = ["spring", "summer", "autumn", "winter"]
SUB_SEASONS = [
    "light-spring", "true-spring", "bright-spring",
    "light-summer", "true-summer", "soft-summer",
    "soft-autumn", "true-autumn", "deep-autumn",
    "deep-winter", "true-winter", "bright-winter",
]


class QuizAnswerInput(CamelModel):
    question_id: int
    option_id: int


class QuizAttemptCreate(CamelModel):
    answers: list[QuizAnswerInput]

    @field_validator("answers")
    @classmethod
    def exactly_ten_answers(cls, value: list[QuizAnswerInput]) -> list[QuizAnswerInput]:
        if len(value) != 10:
            raise ValueError("Cần đúng 10 câu trả lời")
        return value


class QuizAttemptResponse(CamelModel):
    id: int
    sub_season: str
    parent_season: str
    hue_result: str
    value_result: str
    chroma_result: str
    user_id: int | None
    created_at: datetime
```

- [ ] **Step 8: Update the service**

Replace `backend/app/domains/quiz_attempts/service.py`:

```python
from sqlalchemy.orm import Session

from app.domains.quiz.models import QuizOption, QuizQuestion
from app.domains.quiz_attempts.models import QuizAttempt
from app.domains.quiz_attempts.schemas import QuizAnswerInput
from app.domains.quiz_attempts.scoring import score_quiz


class InvalidAnswerError(Exception):
    pass


def create_quiz_attempt(db: Session, answers: list[QuizAnswerInput], user_id: int | None) -> QuizAttempt:
    hue_votes: list[str] = []
    value_votes: list[str] = []
    chroma_votes: list[str] = []

    for answer in answers:
        option = db.get(QuizOption, answer.option_id)
        if option is None or option.question_id != answer.question_id:
            raise InvalidAnswerError(f"option {answer.option_id} does not belong to question {answer.question_id}")
        question = db.get(QuizQuestion, answer.question_id)
        if question.axis == "hue":
            hue_votes.append(option.axis_value)
        elif question.axis == "value":
            value_votes.append(option.axis_value)
        else:
            chroma_votes.append(option.axis_value)

    result = score_quiz(hue_votes, value_votes, chroma_votes)

    attempt = QuizAttempt(
        sub_season=result["sub_season"],
        parent_season=result["parent_season"],
        hue_result=result["hue_result"],
        value_result=result["value_result"],
        chroma_result=result["chroma_result"],
        user_id=user_id,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


def get_latest_attempt(db: Session, user_id: int) -> QuizAttempt | None:
    return (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.id.desc())
        .first()
    )
```

- [ ] **Step 9: Update the router**

Replace `backend/app/domains/quiz_attempts/router.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
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
    try:
        return service.create_quiz_attempt(db, body.answers, user.id if user else None)
    except service.InvalidAnswerError:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="INVALID_ANSWER")


@router.get("/me", response_model=QuizAttemptResponse | None)
def get_my_latest_attempt(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return service.get_latest_attempt(db, user.id)
```

- [ ] **Step 10: Run the service test to verify it passes**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz_attempts/test_service.py -v
```

Expected: PASS (6 tests).

- [ ] **Step 11: Rewrite the router test**

The `/quiz-attempts` endpoint requires exactly 10 answers, so the router-level
fixture must seed the real 5-hue/3-value/2-chroma shape (unlike Task 4 Step 5's
service-level tests, which call `service.create_quiz_attempt` directly with a
plain list and so aren't subject to the router's Pydantic length check).

Replace `backend/tests/domains/quiz_attempts/test_router.py`:

```python
def _seed_ten_questions(client, db_session):
    from app.domains.auth.models import User

    client.post("/auth/register", json={"name": "Admin", "identifier": "quiz-attempt-admin@example.com", "password": "password123"})
    db_session.query(User).filter(User.email == "quiz-attempt-admin@example.com").update({"role": "admin"})
    db_session.commit()
    client.post("/auth/login", json={"identifier": "quiz-attempt-admin@example.com", "password": "password123"})

    hue_options = [
        {"label": "Warm", "axisValue": "warm"},
        {"label": "Cool", "axisValue": "cool"},
        {"label": "Neutral", "axisValue": "neutral"},
    ]
    value_options = [
        {"label": "Dark", "axisValue": "dark"},
        {"label": "Light", "axisValue": "light"},
        {"label": "Medium", "axisValue": "medium"},
    ]
    chroma_options = [
        {"label": "Bright", "axisValue": "bright"},
        {"label": "Muted", "axisValue": "muted"},
        {"label": "Neutral", "axisValue": "neutral"},
    ]

    hue_questions = [
        client.post("/quiz-questions", json={"questionText": f"Hue {i}?", "axis": "hue", "options": hue_options}).json()
        for i in range(5)
    ]
    value_questions = [
        client.post("/quiz-questions", json={"questionText": f"Value {i}?", "axis": "value", "options": value_options}).json()
        for i in range(3)
    ]
    chroma_questions = [
        client.post("/quiz-questions", json={"questionText": f"Chroma {i}?", "axis": "chroma", "options": chroma_options}).json()
        for i in range(2)
    ]

    client.post("/auth/logout")
    return hue_questions, value_questions, chroma_questions


def _option_id_for(question, axis_value):
    return next(option["id"] for option in question["options"] if option["axisValue"] == axis_value)


def _light_spring_answers(hue_questions, value_questions, chroma_questions):
    # Mirrors Task 1's test_value_dominant_sub_season vote pattern exactly:
    # hue unanimous warm, value unanimous light, chroma split bright/neutral
    # (a tie -> "neutral" axis result, share 0) -> parentSeason=spring, subSeason=light-spring.
    answers = [{"questionId": q["id"], "optionId": _option_id_for(q, "warm")} for q in hue_questions]
    answers += [{"questionId": q["id"], "optionId": _option_id_for(q, "light")} for q in value_questions]
    answers += [
        {"questionId": chroma_questions[0]["id"], "optionId": _option_id_for(chroma_questions[0], "bright")},
        {"questionId": chroma_questions[1]["id"], "optionId": _option_id_for(chroma_questions[1], "neutral")},
    ]
    return answers


def test_create_attempt_allows_anonymous_submission(client, db_session):
    hue_questions, value_questions, chroma_questions = _seed_ten_questions(client, db_session)
    answers = _light_spring_answers(hue_questions, value_questions, chroma_questions)
    response = client.post("/quiz-attempts", json={"answers": answers})
    assert response.status_code == 201
    body = response.json()
    assert body["parentSeason"] == "spring"
    assert body["subSeason"] == "light-spring"
    assert body["userId"] is None


def test_create_attempt_attributes_to_the_logged_in_user(client, db_session):
    from app.domains.auth.models import User

    hue_questions, value_questions, chroma_questions = _seed_ten_questions(client, db_session)
    client.post("/auth/register", json={"name": "Test", "identifier": "quiz-attempt-router@example.com", "password": "password123"})
    client.post("/auth/login", json={"identifier": "quiz-attempt-router@example.com", "password": "password123"})
    user = db_session.query(User).filter(User.email == "quiz-attempt-router@example.com").one()

    answers = _light_spring_answers(hue_questions, value_questions, chroma_questions)
    response = client.post("/quiz-attempts", json={"answers": answers})
    assert response.status_code == 201
    assert response.json()["userId"] == user.id


def test_create_attempt_treats_an_invalid_access_token_as_anonymous(client, db_session):
    hue_questions, value_questions, chroma_questions = _seed_ten_questions(client, db_session)
    client.cookies.set("access_token", "not-a-valid-jwt")
    answers = _light_spring_answers(hue_questions, value_questions, chroma_questions)
    response = client.post("/quiz-attempts", json={"answers": answers})
    assert response.status_code == 201
    assert response.json()["userId"] is None


def test_create_attempt_rejects_fewer_than_ten_answers(client, db_session):
    hue_questions, value_questions, chroma_questions = _seed_ten_questions(client, db_session)
    answers = _light_spring_answers(hue_questions, value_questions, chroma_questions)
    response = client.post("/quiz-attempts", json={"answers": answers[:2]})
    assert response.status_code == 422


def test_create_attempt_rejects_an_option_id_that_does_not_match_its_question(client, db_session):
    hue_questions, value_questions, chroma_questions = _seed_ten_questions(client, db_session)
    answers = _light_spring_answers(hue_questions, value_questions, chroma_questions)
    answers[0]["optionId"] = _option_id_for(value_questions[0], "light")  # belongs to a value question, not this hue one
    response = client.post("/quiz-attempts", json={"answers": answers})
    assert response.status_code == 422


def test_get_me_requires_authentication(client):
    response = client.get("/quiz-attempts/me")
    assert response.status_code == 401


def test_get_me_returns_null_when_no_attempt_exists(client):
    client.post("/auth/register", json={"name": "Test", "identifier": "quiz-me-1@example.com", "password": "password123"})
    client.post("/auth/login", json={"identifier": "quiz-me-1@example.com", "password": "password123"})

    response = client.get("/quiz-attempts/me")

    assert response.status_code == 200
    assert response.json() is None


def test_get_me_returns_the_latest_attempt(client, db_session):
    hue_questions, value_questions, chroma_questions = _seed_ten_questions(client, db_session)
    client.post("/auth/register", json={"name": "Test", "identifier": "quiz-me-2@example.com", "password": "password123"})
    client.post("/auth/login", json={"identifier": "quiz-me-2@example.com", "password": "password123"})

    answers = _light_spring_answers(hue_questions, value_questions, chroma_questions)
    client.post("/quiz-attempts", json={"answers": answers})

    response = client.get("/quiz-attempts/me")

    assert response.status_code == 200
    assert response.json()["subSeason"] == "light-spring"
```

- [ ] **Step 12: Run the router test to verify it passes**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz_attempts/test_router.py -v
```

Expected: PASS (8 tests).

- [ ] **Step 13: Generate and run the migration**

```bash
cd backend && source venv/bin/activate
alembic revision --autogenerate -m "add scoring fields to quiz attempts"
```

Open the generated file and confirm it adds the 5 new columns and drops
`season`. Since old `quiz_attempts` rows (if any exist in the dev DB) would
violate `NOT NULL` on the new columns, make the new columns nullable at the
DB level even though the application always populates them for new rows —
edit the generated `upgrade()` to:

```python
def upgrade() -> None:
    op.add_column('quiz_attempts', sa.Column('sub_season', sa.String(length=30), nullable=True))
    op.add_column('quiz_attempts', sa.Column('parent_season', sa.String(length=20), nullable=True))
    op.add_column('quiz_attempts', sa.Column('hue_result', sa.String(length=20), nullable=True))
    op.add_column('quiz_attempts', sa.Column('value_result', sa.String(length=20), nullable=True))
    op.add_column('quiz_attempts', sa.Column('chroma_result', sa.String(length=20), nullable=True))
    op.drop_column('quiz_attempts', 'season')


def downgrade() -> None:
    op.add_column('quiz_attempts', sa.Column('season', sa.VARCHAR(length=20), nullable=False))
    op.drop_column('quiz_attempts', 'chroma_result')
    op.drop_column('quiz_attempts', 'value_result')
    op.drop_column('quiz_attempts', 'parent_season')
    op.drop_column('quiz_attempts', 'sub_season')
```

(The SQLAlchemy model still types these as `Mapped[str]`, non-nullable, for
the application's own writes — only the migration's column definition is
relaxed, to tolerate whatever historical rows exist. Since this is dev/test
data with no real users to preserve, if `alembic upgrade head` fails anyway
because of an existing `NOT NULL season` conflict on `downgrade`'s
re-add, that's fine — `downgrade` is not exercised in this plan.)

Apply it:

```bash
alembic upgrade head
```

- [ ] **Step 14: Run the full quiz_attempts test suite and commit**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/quiz_attempts/ -v
```

Expected: PASS (all tests).

```bash
git add backend/app/domains/quiz_attempts/ backend/tests/domains/quiz_attempts/ backend/alembic/versions/
git commit -m "feat: score personal color quiz attempts server-side across 3 axes"
```

- [ ] **Step 15: Run the full backend test suite**

```bash
cd backend && source venv/bin/activate && python3 -m pytest -q
```

Expected: all tests pass (no regressions in unrelated domains).

---

## Task 5: Frontend types + `seasonProfiles.ts` content

**Files:**
- Modify: `frontend/lib/db.ts`
- Create: `frontend/lib/seasonProfiles.ts`
- Test: `frontend/lib/seasonProfiles.test.ts`
- Delete: `frontend/lib/computeSeasonResult.ts`
- Delete: `frontend/lib/computeSeasonResult.test.ts`

**Interfaces:**
- Produces: `Axis`, `AxisValue`, `ParentSeason`, `SubSeason` types;
  `SUB_SEASONS: SubSeason[]`; `QuizOption{axisValue: AxisValue}`,
  `QuizQuestion{axis: Axis, imageUrl: string | null}` in `lib/db.ts`.
- Produces: `SeasonProfile` type and `SEASON_PROFILES: Record<SubSeason, SeasonProfile>`
  in `lib/seasonProfiles.ts` — consumed by Task 8 (result page components).

- [ ] **Step 1: Write the failing test**

Create `frontend/lib/seasonProfiles.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { SEASON_PROFILES } from './seasonProfiles'
import { SUB_SEASONS } from './db'

describe('seasonProfiles', () => {
  it('has a profile for every sub-season', () => {
    for (const subSeason of SUB_SEASONS) {
      expect(SEASON_PROFILES[subSeason]).toBeDefined()
    }
  })

  it('gives every profile a non-empty display name, description, and palette', () => {
    for (const subSeason of SUB_SEASONS) {
      const profile = SEASON_PROFILES[subSeason]
      expect(profile.displayName.length).toBeGreaterThan(0)
      expect(profile.description.length).toBeGreaterThan(0)
      expect(profile.paletteHex.length).toBeGreaterThanOrEqual(6)
      for (const hex of profile.paletteHex) {
        expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    }
  })

  it('gives every profile all three recommendation categories', () => {
    for (const subSeason of SUB_SEASONS) {
      const { recommendations } = SEASON_PROFILES[subSeason]
      expect(recommendations.outfit.length).toBeGreaterThan(0)
      expect(recommendations.lipstick.length).toBeGreaterThan(0)
      expect(recommendations.accessory.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd frontend && npm test -- lib/seasonProfiles.test.ts
```

Expected: FAIL — neither `lib/seasonProfiles.ts` nor `SUB_SEASONS` in `lib/db.ts` exist yet.

- [ ] **Step 3: Update `lib/db.ts`**

In `frontend/lib/db.ts`, replace the `Season`/`SEASONS`/`QuizOption`/`QuizQuestion`
block (lines 1–2 and 28–40) with:

```ts
export type Axis = 'hue' | 'value' | 'chroma'

export type AxisValue = 'warm' | 'cool' | 'neutral' | 'dark' | 'light' | 'medium' | 'bright' | 'muted'

export type ParentSeason = 'spring' | 'summer' | 'autumn' | 'winter'
export const PARENT_SEASONS: ParentSeason[] = ['spring', 'summer', 'autumn', 'winter']

export type SubSeason =
  | 'light-spring' | 'true-spring' | 'bright-spring'
  | 'light-summer' | 'true-summer' | 'soft-summer'
  | 'soft-autumn' | 'true-autumn' | 'deep-autumn'
  | 'deep-winter' | 'true-winter' | 'bright-winter'

export const SUB_SEASONS: SubSeason[] = [
  'light-spring', 'true-spring', 'bright-spring',
  'light-summer', 'true-summer', 'soft-summer',
  'soft-autumn', 'true-autumn', 'deep-autumn',
  'deep-winter', 'true-winter', 'bright-winter',
]
```

Leave `BlogCategory`/`BlogPost` untouched. Replace the old `QuizOption`/`QuizQuestion` types with:

```ts
export type QuizOption = {
  id: number
  label: string
  axisValue: AxisValue
  sortOrder: number
}

export type QuizQuestion = {
  id: number
  questionText: string
  axis: Axis
  imageUrl: string | null
  sortOrder: number
  options: QuizOption[]
}

export type QuizAttemptResult = {
  id: number
  subSeason: SubSeason
  parentSeason: ParentSeason
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
  userId: number | null
  createdAt: string
}
```

- [ ] **Step 4: Delete the old scoring placeholder**

```bash
rm frontend/lib/computeSeasonResult.ts frontend/lib/computeSeasonResult.test.ts
```

- [ ] **Step 5: Write `lib/seasonProfiles.ts`**

Create `frontend/lib/seasonProfiles.ts`:

```ts
import type { SubSeason } from './db'

export type SeasonProfile = {
  displayName: string
  paletteHex: string[]
  description: string
  recommendations: {
    outfit: string
    lipstick: string
    accessory: string
  }
}

export const SEASON_PROFILES: Record<SubSeason, SeasonProfile> = {
  'light-spring': {
    displayName: 'Xuân Sáng (Light Spring)',
    paletteHex: ['#FFD9B3', '#FFF2CC', '#C9E4CA', '#F7C6C7', '#FCE38A', '#9FD8CB'],
    description:
      'Da tươi sáng, tóc và mắt màu nhạt ấm áp. Hợp các gam màu ấm nhẹ nhàng, tươi sáng, tránh màu quá đậm hoặc quá trầm khiến gương mặt bị lấn át.',
    recommendations: {
      outfit: 'Áo blazer be, đầm pastel ấm, phụ kiện vàng nhạt',
      lipstick: 'Hồng đào, cam san hô nhạt',
      accessory: 'Vàng nhạt (light gold), ngọc trai kem',
    },
  },
  'true-spring': {
    displayName: 'Xuân Thuần (True Spring)',
    paletteHex: ['#FF7F50', '#FFC72C', '#4CBB17', '#40E0D0', '#FF6347', '#FFB07C'],
    description: 'Tông da ấm rõ rệt, sắc độ trung bình, hợp màu tươi sáng rực rỡ vừa phải.',
    recommendations: {
      outfit: 'Áo sơ mi cam đất, chân váy vàng mù tạt',
      lipstick: 'Cam san hô, đỏ gạch ấm',
      accessory: 'Vàng 18K, đồng',
    },
  },
  'bright-spring': {
    displayName: 'Xuân Rực Rỡ (Bright Spring)',
    paletteHex: ['#FF4F79', '#00CED1', '#FFEA00', '#FF3131', '#FF8C00', '#39FF88'],
    description: 'Ấm áp nhưng sắc nét, độ tương phản khá cao, hợp màu ấm cực kỳ tươi sáng.',
    recommendations: {
      outfit: 'Set đồ màu block tương phản, phụ kiện ánh kim sáng',
      lipstick: 'Đỏ cam rực, hồng neon ấm',
      accessory: 'Vàng sáng bóng, đá màu rực',
    },
  },
  'light-summer': {
    displayName: 'Hè Sáng (Light Summer)',
    paletteHex: ['#AEC6E8', '#D8BFD8', '#F4C2C2', '#B5C9A8', '#D8A7B1', '#C9D6EA'],
    description: 'Da sáng, tông lạnh nhẹ nhàng, hợp các gam pastel lạnh dịu.',
    recommendations: {
      outfit: 'Áo len pastel xanh phấn, đầm hoa nhí lạnh',
      lipstick: 'Hồng phấn lạnh, mận nhạt',
      accessory: 'Bạc, bạch kim nhạt',
    },
  },
  'true-summer': {
    displayName: 'Hè Thuần (True Summer)',
    paletteHex: ['#6C93B8', '#A76A82', '#C05C7E', '#8FA3B3', '#A6A2D0', '#B0789A'],
    description: 'Tông lạnh rõ rệt, sắc độ trung bình, hợp màu lạnh dịu vừa phải.',
    recommendations: {
      outfit: 'Áo blazer xanh navy dịu, khăn lụa hoa văn lạnh',
      lipstick: 'Mận hồng, hồng dâu dịu',
      accessory: 'Bạc, đá xanh dịu',
    },
  },
  'soft-summer': {
    displayName: 'Hè Dịu (Soft Summer)',
    paletteHex: ['#C8A2A2', '#A9BA9D', '#B49A8B', '#A6A9C7', '#B08CA6', '#C9BFB0'],
    description: 'Lạnh nhẹ nhưng độ bão hoà thấp, tương phản mờ nhạt, hợp tông trầm nhẹ nhàng.',
    recommendations: {
      outfit: 'Set đồ tông trầm nhẹ, chất liệu mờ (matte)',
      lipstick: 'Hồng đất, be hồng',
      accessory: 'Bạc mờ, đá màu trầm',
    },
  },
  'soft-autumn': {
    displayName: 'Thu Dịu (Soft Autumn)',
    paletteHex: ['#A98B6D', '#8A9A5B', '#C98A5D', '#C9A66B', '#C08769', '#A68A64'],
    description: 'Ấm nhẹ, độ bão hoà thấp, hợp tông đất nhẹ nhàng.',
    recommendations: {
      outfit: 'Áo len be, quần kaki, phụ kiện gỗ',
      lipstick: 'Cam đất nhạt, hồng be',
      accessory: 'Vàng đồng mờ, gỗ, đá mắt hổ',
    },
  },
  'true-autumn': {
    displayName: 'Thu Thuần (True Autumn)',
    paletteHex: ['#B7410E', '#6B8E23', '#E1AD01', '#8B5A2B', '#D2691E', '#B8860B'],
    description: 'Ấm rõ rệt, độ bão hoà trung bình đến đậm, hợp tông đất ấm rực.',
    recommendations: {
      outfit: 'Áo khoác da nâu, đầm màu bí ngô',
      lipstick: 'Cam gạch, nâu đỏ',
      accessory: 'Đồng, vàng cổ điển',
    },
  },
  'deep-autumn': {
    displayName: 'Thu Sâu (Deep Autumn)',
    paletteHex: ['#4A2C1D', '#3D3D1F', '#A0421D', '#1B4D3E', '#5C4033', '#7A3B12'],
    description: 'Ấm và sẫm màu, tương phản khá rõ, hợp tông đất đậm sâu.',
    recommendations: {
      outfit: 'Áo khoác dạ nâu đậm, set đồ tông trầm sâu',
      lipstick: 'Nâu đỏ đậm, đỏ mận',
      accessory: 'Vàng đồng đậm, đá màu tối',
    },
  },
  'deep-winter': {
    displayName: 'Đông Sâu (Deep Winter)',
    paletteHex: ['#000000', '#36454F', '#6A0033', '#046307', '#B22222', '#002147'],
    description: 'Lạnh và sẫm màu, tương phản cao, hợp tông đậm sắc lạnh.',
    recommendations: {
      outfit: 'Set đồ đen tuyền, áo khoác navy đậm',
      lipstick: 'Đỏ đậm, mận sẫm',
      accessory: 'Bạc, kim cương, đá đen',
    },
  },
  'true-winter': {
    displayName: 'Đông Thuần (True Winter)',
    paletteHex: ['#003399', '#FF0033', '#E0FFFF', '#FF00FF', '#FFFFFF', '#000000'],
    description: 'Lạnh rõ rệt, sắc nét, tương phản cao, hợp màu lạnh trong trẻo.',
    recommendations: {
      outfit: 'Áo trắng phối đen, đầm xanh hoàng gia',
      lipstick: 'Đỏ tươi, hồng fuchsia',
      accessory: 'Bạc sáng bóng, kim cương',
    },
  },
  'bright-winter': {
    displayName: 'Đông Rực Rỡ (Bright Winter)',
    paletteHex: ['#FF1493', '#00BFFF', '#FF0000', '#FFFFFF', '#000000', '#F0F8FF'],
    description: 'Lạnh nhưng cực kỳ tươi sáng/rực, tương phản rất cao.',
    recommendations: {
      outfit: 'Set đồ tương phản đen trắng, điểm nhấn màu neon lạnh',
      lipstick: 'Đỏ rực, hồng neon lạnh',
      accessory: 'Bạc, đá màu sáng rực',
    },
  },
}
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd frontend && npm test -- lib/seasonProfiles.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add frontend/lib/db.ts frontend/lib/seasonProfiles.ts frontend/lib/seasonProfiles.test.ts
git rm frontend/lib/computeSeasonResult.ts frontend/lib/computeSeasonResult.test.ts
git commit -m "feat: add 3-axis quiz types and the 12 sub-season content profiles"
```

---

## Task 6: `lib/quizResultStorage.ts` — store the full result

**Files:**
- Modify: `frontend/lib/quizResultStorage.ts`
- Test: `frontend/lib/quizResultStorage.test.ts` (create if it doesn't already exist — check first)

**Interfaces:**
- Consumes: `QuizAttemptResult` shape from Task 5 (`lib/db.ts`).
- Produces: `saveAnonymousQuizResult(result: AnonymousQuizResult): void`,
  `getAnonymousQuizResult(): AnonymousQuizResult | null` — consumed by
  Task 7 (`QuizFlow.tsx`) and Task 8 (result page).

- [ ] **Step 1: Check for an existing test file**

```bash
find frontend/lib -iname "quizResultStorage.test.ts"
```

If it exists, read it first and adapt the steps below to replace it instead
of creating new; if it doesn't exist, proceed with Step 2 as a new file.

- [ ] **Step 2: Write the failing test**

Create `frontend/lib/quizResultStorage.test.ts`:

```ts
import { describe, expect, it, beforeEach } from 'vitest'
import { saveAnonymousQuizResult, getAnonymousQuizResult } from './quizResultStorage'

describe('quizResultStorage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('returns null when nothing has been saved', () => {
    expect(getAnonymousQuizResult()).toBeNull()
  })

  it('saves and retrieves a full result', () => {
    saveAnonymousQuizResult({
      subSeason: 'true-winter',
      parentSeason: 'winter',
      hueResult: 'cool',
      valueResult: 'medium',
      chromaResult: 'neutral',
    })
    const result = getAnonymousQuizResult()
    expect(result?.subSeason).toBe('true-winter')
    expect(result?.parentSeason).toBe('winter')
    expect(result?.createdAt).toBeDefined()
  })

  it('returns null for malformed stored JSON', () => {
    window.sessionStorage.setItem('twistfit.quizResult', 'not-json')
    expect(getAnonymousQuizResult()).toBeNull()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd frontend && npm test -- lib/quizResultStorage.test.ts
```

Expected: FAIL — `saveAnonymousQuizResult` still takes a bare `Season` string, not an object.

- [ ] **Step 4: Update the implementation**

Replace `frontend/lib/quizResultStorage.ts`:

```ts
import type { AxisValue, ParentSeason, SubSeason } from './db'

const STORAGE_KEY = 'twistfit.quizResult'

export type AnonymousQuizResult = {
  subSeason: SubSeason
  parentSeason: ParentSeason
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
  createdAt?: string
}

export function saveAnonymousQuizResult(result: Omit<AnonymousQuizResult, 'createdAt'>): void {
  const stored: AnonymousQuizResult = { ...result, createdAt: new Date().toISOString() }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export function getAnonymousQuizResult(): AnonymousQuizResult | null {
  const stored = window.sessionStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as AnonymousQuizResult
  } catch {
    return null
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd frontend && npm test -- lib/quizResultStorage.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add frontend/lib/quizResultStorage.ts frontend/lib/quizResultStorage.test.ts
git commit -m "feat: store the full 3-axis quiz result for anonymous users"
```

---

## Task 7: `QuizFlow.tsx` — answer by option, submit raw answers

**Files:**
- Modify: `frontend/components/personal-color/QuizFlow.tsx`
- Modify: `frontend/components/personal-color/QuizFlow.test.tsx`
- Modify: `frontend/messages/vi.json` (`PersonalColor.Quiz`)

**Interfaces:**
- Consumes: `QuizQuestion` (Task 5), `saveAnonymousQuizResult` (Task 6),
  `POST /quiz-attempts` returning `QuizAttemptResult`-shaped JSON (Task 4).

- [ ] **Step 1: Update `messages/vi.json`**

In `Home`... no — in the top-level `PersonalColor.Quiz` object (currently at
line 560), no key changes are needed (`badgeLabel`, `questionCounter`,
`backButton`, `nextButton`, `viewResultButton` all stay). No edit required
for this file in this task — skip to Step 2. (Confirmed by reading the
current file: none of these keys reference season-specific content.)

- [ ] **Step 2: Rewrite the failing test**

Replace `frontend/components/personal-color/QuizFlow.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuizFlow from './QuizFlow'
import type { QuizQuestion } from '@/lib/db'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

function makeQuestion(id: number, axis: QuizQuestion['axis'], text: string, imageUrl: string | null = null): QuizQuestion {
  const axisValues =
    axis === 'hue' ? ['warm', 'cool', 'neutral'] : axis === 'value' ? ['dark', 'light', 'medium'] : ['bright', 'muted', 'neutral']
  return {
    id,
    questionText: text,
    axis,
    imageUrl,
    sortOrder: id,
    options: axisValues.map((axisValue, index) => ({
      id: id * 10 + index,
      label: `Lựa chọn ${id}.${index + 1}`,
      axisValue: axisValue as QuizQuestion['options'][number]['axisValue'],
      sortOrder: index,
    })),
  }
}

const QUESTIONS: QuizQuestion[] = [
  makeQuestion(1, 'hue', 'Câu hỏi 1?', '/personal-color/quiz/wrist-veins.jpg'),
  makeQuestion(2, 'hue', 'Câu hỏi 2?'),
  makeQuestion(3, 'value', 'Câu hỏi 3?'),
  makeQuestion(4, 'chroma', 'Câu hỏi 4?'),
]

function completeQuiz() {
  for (let step = 0; step < QUESTIONS.length; step++) {
    const optionButtons = screen.getAllByRole('button').filter((btn) => btn.dataset.quizOption === 'true')
    fireEvent.click(optionButtons[0])
    const isLast = step === QUESTIONS.length - 1
    const advanceButton = screen.getByRole('button', { name: isLast ? 'Xem kết quả' : 'Tiếp theo' })
    fireEvent.click(advanceButton)
  }
}

describe('QuizFlow', () => {
  beforeEach(() => {
    pushMock.mockClear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          subSeason: 'true-spring',
          parentSeason: 'spring',
          hueResult: 'warm',
          valueResult: 'medium',
          chromaResult: 'neutral',
        }),
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.sessionStorage.clear()
  })

  it('shows the illustrative image only for the question that has one', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    expect(screen.getByAltText('Câu hỏi 1?')).toHaveAttribute('src', '/personal-color/quiz/wrist-veins.jpg')
  })

  it('shows the first question with the Tiếp theo button disabled until an option is picked', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    expect(screen.getByText('Câu hỏi 1/4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeDisabled()
  })

  it('enables Tiếp theo once an option is selected and advances to the next question', () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    const optionButtons = screen.getAllByRole('button').filter((btn) => btn.dataset.quizOption === 'true')
    fireEvent.click(optionButtons[0])
    const nextButton = screen.getByRole('button', { name: 'Tiếp theo' })
    expect(nextButton).toBeEnabled()
    fireEvent.click(nextButton)
    expect(screen.getByText('Câu hỏi 2/4')).toBeInTheDocument()
  })

  it('shows "Xem kết quả" on the last question and navigates to the result page once scored', async () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/personal-color/result'))
  })

  it('POSTs all answers as {questionId, optionId} pairs', async () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/quiz-attempts',
        expect.objectContaining({ method: 'POST', credentials: 'include' })
      )
    )
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const sentBody = JSON.parse(init.body as string) as { answers: { questionId: number; optionId: number }[] }
    expect(sentBody.answers).toHaveLength(4)
    expect(sentBody.answers[0]).toEqual({ questionId: 1, optionId: 10 })
  })

  it('saves the full computed result to sessionStorage before navigating', async () => {
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()
    await waitFor(() => expect(pushMock).toHaveBeenCalled())
    const stored = JSON.parse(window.sessionStorage.getItem('twistfit.quizResult') ?? 'null')
    expect(stored?.subSeason).toBe('true-spring')
  })

  it('shows an error and does not navigate if scoring fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({}) }))
    renderWithIntl(<QuizFlow questions={QUESTIONS} />)
    completeQuiz()
    await waitFor(() => expect(screen.getByText(/không thể/i)).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd frontend && npm test -- components/personal-color/QuizFlow.test.tsx
```

Expected: FAIL — current `QuizFlow` tracks answers by `Season`, posts
`{season}`, and never shows question images.

- [ ] **Step 4: Rewrite the implementation**

Replace `frontend/components/personal-color/QuizFlow.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiClient'
import type { QuizQuestion } from '@/lib/db'
import { saveAnonymousQuizResult } from '@/lib/quizResultStorage'

type ScoredResult = {
  subSeason: string
  parentSeason: string
  hueResult: string
  valueResult: string
  chromaResult: string
}

export default function QuizFlow({ questions }: { questions: QuizQuestion[] }) {
  const t = useTranslations('PersonalColor.Quiz')
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitError, setSubmitError] = useState(false)

  const totalSteps = questions.length
  const question = questions[currentStep]
  const selectedOptionId = answers[question.id] ?? null
  const isLastStep = currentStep === totalSteps - 1

  function selectOption(optionId: number) {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
  }

  async function handleAdvance() {
    if (!isLastStep) {
      setCurrentStep((step) => step + 1)
      return
    }

    setSubmitError(false)
    const payload = {
      answers: questions.map((q) => ({ questionId: q.id, optionId: answers[q.id] })),
    }

    const response = await apiFetch('/quiz-attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      setSubmitError(true)
      return
    }

    const result = (await response.json()) as ScoredResult
    saveAnonymousQuizResult({
      subSeason: result.subSeason as never,
      parentSeason: result.parentSeason as never,
      hueResult: result.hueResult as never,
      valueResult: result.valueResult as never,
      chromaResult: result.chromaResult as never,
    })
    router.push('/personal-color/result')
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl bg-surface-container-lowest p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-label-sm text-on-surface-variant">
          <span>{t('badgeLabel')}</span>
          <span>{t('questionCounter', { current: currentStep + 1, total: totalSteps })}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      <h2 className="text-headline-sm font-bold text-on-surface">{question.questionText}</h2>
      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt={question.questionText}
          className="mt-4 w-full rounded-2xl object-cover"
        />
      )}
      <div className="mt-5 space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id
          return (
            <button
              key={option.id}
              type="button"
              data-quiz-option="true"
              onClick={() => selectOption(option.id)}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-body-md transition-colors ${
                isSelected
                  ? 'border-primary bg-primary-fixed text-on-surface'
                  : 'border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span>{option.label}</span>
              {isSelected && (
                <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
              )}
            </button>
          )
        })}
      </div>
      {submitError && (
        <p className="mt-4 text-center text-body-sm text-error">{t('submitError')}</p>
      )}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
          disabled={currentStep === 0}
          className="text-label-md font-semibold text-on-surface-variant disabled:opacity-0"
        >
          {t('backButton')}
        </button>
        <button
          type="button"
          onClick={handleAdvance}
          disabled={selectedOptionId === null}
          className="rounded-full bg-primary px-7 py-3 text-label-lg text-on-primary transition-all hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLastStep ? t('viewResultButton') : t('nextButton')}
        </button>
      </div>
    </div>
  )
}
```

Note: `saveAnonymousQuizResult`'s parameter casts (`as never`) exist only
because the response JSON is loosely typed as `ScoredResult` (plain
`string` fields) while `AnonymousQuizResult` wants the narrower literal
union types (`SubSeason`, `ParentSeason`, `AxisValue`) — this mirrors how
API responses are trusted-but-untyped elsewhere in this codebase (the
backend is the source of truth for valid values, already enforced by its
own Pydantic validators).

- [ ] **Step 5: Add the `submitError` translation key**

In `frontend/messages/vi.json`, inside `PersonalColor.Quiz` (around line 567,
right after `"viewResultButton": "Xem kết quả"`), add:

```json
    "Quiz": {
      "pageTitle": "Kiểm Tra Personal Color",
      "pageSubtitle": "Trả lời {count} câu hỏi ngắn để xác định nhóm màu mùa phù hợp với bạn.",
      "badgeLabel": "Personal Color Test",
      "questionCounter": "Câu hỏi {current}/{total}",
      "backButton": "Quay lại",
      "nextButton": "Tiếp theo",
      "viewResultButton": "Xem kết quả",
      "submitError": "Không thể tính kết quả, vui lòng thử lại."
    },
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
cd frontend && npm test -- components/personal-color/QuizFlow.test.tsx
```

Expected: PASS (7 tests).

- [ ] **Step 7: Commit**

```bash
git add frontend/components/personal-color/QuizFlow.tsx frontend/components/personal-color/QuizFlow.test.tsx frontend/messages/vi.json
git commit -m "feat: submit raw quiz answers and let the backend score them"
```

---

## Task 8: Result page — render the real computed sub-season

**Files:**
- Modify: `frontend/app/personal-color/result/page.tsx`
- Modify: `frontend/components/personal-color/ColorProfileCard.tsx`
- Modify: `frontend/components/personal-color/ColorProfileCard.test.tsx`
- Modify: `frontend/components/personal-color/ColorInsights.tsx`
- Modify: `frontend/components/personal-color/ColorInsights.test.tsx`
- Modify: `frontend/messages/vi.json` (`PersonalColor.Result.ProfileCard`, `PersonalColor.Result.Insights`)

**Interfaces:**
- Consumes: `SEASON_PROFILES` (Task 5), `AnonymousQuizResult`/`getAnonymousQuizResult` (Task 6), `GET /quiz-attempts/me` response shape from Task 4.
- Produces: `ColorProfileCard({ result })`, `ColorInsights({ result })` — both now take a `result: { subSeason: SubSeason; hueResult: AxisValue; valueResult: AxisValue; chromaResult: AxisValue }` prop instead of reading nothing.

- [ ] **Step 1: Update `messages/vi.json` — `ProfileCard`**

Replace the `ProfileCard` block (currently lines 595–650) — remove every
season-specific key (`seasonTitle`, `seasonTagline`, `description`,
`brightnessValue`, `toneValue`, `vividnessValue`, `idealPaletteHeading`,
`idealPaletteBadge`, the `swatches` map) since that content now comes from
`SEASON_PROFILES`; keep only the structural/static labels:

```json
      "ProfileCard": {
        "srHeading": "Tổng quan mùa sắc thái và bảng màu",
        "portraitAlt": "Chân dung phân tích sắc tố khuôn mặt",
        "paletteLabel": "Bảng màu phù hợp nhất",
        "overviewHeading": "Tổng quan sắc diện",
        "hueLabel": "Nhiệt độ màu",
        "valueLabel": "Sắc độ",
        "chromaLabel": "Độ bão hoà",
        "idealPaletteHeading": "Bảng màu lý tưởng của bạn",
        "idealPaletteBadge": "Personal Palette",
        "paletteNote": "Tông màu phù hợp sẽ giúp da bạn trông sáng hơn, che đi khuyết điểm và làm nổi bật đường nét khuôn mặt một cách tự nhiên nhất."
      },
```

- [ ] **Step 2: Update `messages/vi.json` — `Insights`**

Replace the `Insights` block (currently lines 651–670) — drop the fake
numeric `metrics` (replaced by the real axis breakdown already shown in
`ProfileCard`) and the hardcoded `recommendations` bodies (now sourced from
`SEASON_PROFILES`), keeping only structural labels and the 3 recommendation
titles (the profile supplies the body text):

```json
      "Insights": {
        "srHeading": "Chỉ số chi tiết và Gợi ý ứng dụng",
        "recommendationsHeading": "Gợi ý ứng dụng",
        "recommendations": {
          "outfit": { "title": "Màu trang phục" },
          "lipstick": { "title": "Màu son" },
          "accessory": { "title": "Màu phụ kiện" }
        },
        "ctaBannerTitle": "Kết quả Personal Color của bạn đã sẵn sàng!",
        "ctaBannerSubtitle": "Khám phá thế giới màu sắc giúp bạn tỏa sáng mỗi ngày ✨",
        "tryOutfitButton": "Thử Phối Đồ Ngay (AI Fitting)",
        "downloadPdfButton": "Tải Báo Cáo PDF"
      }
```

- [ ] **Step 3: Rewrite `ColorProfileCard.test.tsx`**

Replace `frontend/components/personal-color/ColorProfileCard.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorProfileCard from './ColorProfileCard'

const RESULT = { subSeason: 'true-winter' as const, hueResult: 'cool' as const, valueResult: 'medium' as const, chromaResult: 'neutral' as const }

describe('ColorProfileCard', () => {
  it('renders the real sub-season name and description', () => {
    renderWithIntl(<ColorProfileCard result={RESULT} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Đông Thuần (True Winter)' })).toBeInTheDocument()
    expect(screen.getByText(/Lạnh rõ rệt, sắc nét/)).toBeInTheDocument()
  })

  it('renders the real palette swatches', () => {
    renderWithIntl(<ColorProfileCard result={RESULT} />)
    const swatch = document.querySelector('[style*="background-color: rgb(0, 51, 153)"]')
    expect(swatch).not.toBeNull()
  })

  it('renders the three axis results', () => {
    renderWithIntl(<ColorProfileCard result={RESULT} />)
    expect(screen.getByText('Lạnh')).toBeInTheDocument()
    expect(screen.getByText('Trung bình')).toBeInTheDocument()
    expect(screen.getByText('Trung tính')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd frontend && npm test -- components/personal-color/ColorProfileCard.test.tsx
```

Expected: FAIL — `ColorProfileCard` doesn't accept a `result` prop yet.

- [ ] **Step 5: Rewrite `ColorProfileCard.tsx`**

Replace `frontend/components/personal-color/ColorProfileCard.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { SEASON_PROFILES } from '@/lib/seasonProfiles'
import type { AxisValue, SubSeason } from '@/lib/db'

const AXIS_VALUE_LABELS: Record<AxisValue, string> = {
  warm: 'Ấm',
  cool: 'Lạnh',
  neutral: 'Trung tính',
  dark: 'Sẫm',
  light: 'Sáng',
  medium: 'Trung bình',
  bright: 'Tươi sáng',
  muted: 'Trầm',
}

export type ProfileCardResult = {
  subSeason: SubSeason
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
}

export default function ColorProfileCard({ result }: { result: ProfileCardResult }) {
  const t = useTranslations('PersonalColor.Result.ProfileCard')
  const profile = SEASON_PROFILES[result.subSeason]

  return (
    <section aria-labelledby="primary-analysis-title" className="flex flex-col gap-6 lg:col-span-7">
      <h2 className="sr-only" id="primary-analysis-title">
        {t('srHeading')}
      </h2>
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-[#7b89ba]/15 bg-white p-5 shadow-[0_4px_20px_rgba(48,68,97,0.05)] md:flex-row md:items-stretch sm:p-6">
        <div className="relative w-full max-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[#7b89ba]/20 bg-[#eef4fa] shadow-inner md:w-5/12 md:max-w-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/personal-color/portrait-winter.jpg"
            alt={t('portraitAlt')}
            className="aspect-[4/5] h-full w-full object-cover object-center"
          />
        </div>
        <div className="flex w-full flex-col justify-between py-1 md:w-7/12">
          <div>
            <div className="mb-3 inline-block rounded-full border border-[#7b89ba]/20 bg-[#eef4fa] px-3 py-1 text-xs font-semibold text-[#7b89ba]">
              {t('paletteLabel')}
            </div>
            <div className="mb-3 flex items-center gap-3.5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a89dc] to-[#7b89ba] text-white shadow-md">
                <span className="material-symbols-outlined text-[24px]">ac_unit</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#304461]">{profile.displayName}</h3>
              </div>
            </div>
            <p className="mb-5 text-xs leading-relaxed text-[#304461]/80 sm:text-[13px]">{profile.description}</p>
          </div>
          <div className="border-t border-[#7b89ba]/15 pt-4">
            <h4 className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#304461] md:text-left">
              {t('overviewHeading')}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-2 text-center">
                <span className="text-[10px] text-[#304461]/70">{t('hueLabel')}</span>
                <span className="text-xs font-bold text-[#304461]">{AXIS_VALUE_LABELS[result.hueResult]}</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-2 text-center">
                <span className="text-[10px] text-[#304461]/70">{t('valueLabel')}</span>
                <span className="text-xs font-bold text-[#4a89dc]">{AXIS_VALUE_LABELS[result.valueResult]}</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-2 text-center">
                <span className="text-[10px] text-[#304461]/70">{t('chromaLabel')}</span>
                <span className="text-xs font-bold text-[#D84B85]">{AXIS_VALUE_LABELS[result.chromaResult]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#304461]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7b89ba]" />
            {t('idealPaletteHeading')}
          </h3>
          <span className="rounded-full bg-[#7b89ba]/10 px-2.5 py-1 text-[11px] font-medium text-[#7b89ba]">
            {t('idealPaletteBadge')}
          </span>
        </div>
        <div className="grid grid-cols-6 place-items-center gap-2 py-2 sm:gap-3">
          {profile.paletteHex.map((hex) => (
            <div
              key={hex}
              className="h-9 w-9 cursor-pointer rounded-full border border-black/10 transition-transform hover:scale-[1.18]"
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border-t border-[#7b89ba]/10 bg-[#eef4fa]/50 p-3 pt-4 sm:items-center">
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#fdc8e9]/50 text-[#7b89ba] sm:mt-0">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          </div>
          <p className="text-xs leading-relaxed text-[#304461]/80">{t('paletteNote')}</p>
        </div>
      </div>
    </section>
  )
}
```

Note: the portrait image stays the single generic `/personal-color/portrait-winter.jpg`
for all 12 sub-seasons — no real per-season portrait photography exists, and
the spec's out-of-scope section doesn't call for commissioning 12 photos.
The palette swatches and text are what actually vary by result.

- [ ] **Step 6: Run test to verify it passes**

```bash
cd frontend && npm test -- components/personal-color/ColorProfileCard.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 7: Rewrite `ColorInsights.test.tsx`**

Replace `frontend/components/personal-color/ColorInsights.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorInsights from './ColorInsights'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('ColorInsights', () => {
  it('renders the real recommendation text for the given sub-season', () => {
    renderWithIntl(<ColorInsights subSeason="true-winter" />)
    expect(screen.getByText('Đỏ tươi, hồng fuchsia')).toBeInTheDocument()
    expect(screen.getByText('Áo trắng phối đen, đầm xanh hoàng gia')).toBeInTheDocument()
  })

  it('renders the action buttons', () => {
    renderWithIntl(<ColorInsights subSeason="true-winter" />)
    expect(screen.getByRole('link', { name: /Thử Phối Đồ Ngay/ })).toHaveAttribute('href', '/outfit/step-1')
    expect(screen.getByRole('button', { name: /Tải Báo Cáo PDF/ })).toBeInTheDocument()
  })

  it('renders the camera AR button', () => {
    renderWithIntl(<ColorInsights subSeason="true-winter" />)
    expect(screen.getByText('Mở Camera AR')).toBeInTheDocument()
  })
})
```

- [ ] **Step 8: Run test to verify it fails**

```bash
cd frontend && npm test -- components/personal-color/ColorInsights.test.tsx
```

Expected: FAIL — `ColorInsights` doesn't accept a `subSeason` prop yet.

- [ ] **Step 9: Rewrite `ColorInsights.tsx`**

Replace `frontend/components/personal-color/ColorInsights.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import CameraArButton from './CameraArButton'
import { SEASON_PROFILES } from '@/lib/seasonProfiles'
import type { SubSeason } from '@/lib/db'

const RECOMMENDATION_ICONS: Record<'outfit' | 'lipstick' | 'accessory', string> = {
  outfit: 'checkroom',
  lipstick: 'favorite',
  accessory: 'diamond',
}

export default function ColorInsights({ subSeason }: { subSeason: SubSeason }) {
  const t = useTranslations('PersonalColor.Result.Insights')
  const profile = SEASON_PROFILES[subSeason]
  const recommendationKeys = ['outfit', 'lipstick', 'accessory'] as const

  return (
    <section aria-labelledby="metrics-and-guide-title" className="flex flex-col gap-6 lg:col-span-5">
      <h2 className="sr-only" id="metrics-and-guide-title">
        {t('srHeading')}
      </h2>
      <div className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]">
        <div className="mb-4 flex items-center gap-2.5 border-b border-[#7b89ba]/15 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fdc8e9]/40 text-[#304461]">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
          </div>
          <h3 className="text-base font-bold text-[#304461]">{t('recommendationsHeading')}</h3>
        </div>
        <div className="space-y-3.5">
          {recommendationKeys.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3.5 rounded-2xl border border-[#7b89ba]/10 bg-[#eef4fa]/50 p-2.5 transition-colors hover:bg-[#eef4fa]"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a89dc] to-[#7b89ba] text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">{RECOMMENDATION_ICONS[key]}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[#304461]">{t(`recommendations.${key}.title`)}</h4>
                <p className="mt-0.5 text-[11px] leading-snug text-[#304461]/80">{profile.recommendations[key]}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#7b89ba]/20 bg-gradient-to-r from-[#eef4fa] via-indigo-50/60 to-pink-50/60 p-3.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#7b89ba]/20 text-[#7b89ba]">
            <span className="material-symbols-outlined text-[16px]">favorite</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#304461]">{t('ctaBannerTitle')}</p>
            <p className="text-[11px] text-[#304461]/75">{t('ctaBannerSubtitle')}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/outfit/step-1"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#304461] px-5 py-3 text-center text-xs font-bold text-white shadow-md transition-all hover:bg-[#233247] hover:shadow-lg"
        >
          <span className="material-symbols-outlined text-[16px]">checkroom</span>
          <span>{t('tryOutfitButton')}</span>
        </Link>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl border border-[#7b89ba]/30 bg-white px-4 py-3 text-xs font-semibold text-[#304461] transition-all hover:border-[#7b89ba] hover:bg-[#eef4fa] sm:w-auto"
        >
          <span className="material-symbols-outlined text-[16px] text-rose-500">picture_as_pdf</span>
          <span>{t('downloadPdfButton')}</span>
        </button>
        <CameraArButton />
      </div>
    </section>
  )
}
```

- [ ] **Step 10: Run test to verify it passes**

```bash
cd frontend && npm test -- components/personal-color/ColorInsights.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 11: Wire the result page to fetch and pass the real result**

Replace `frontend/app/personal-color/result/page.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAuth } from '@/components/auth/AuthProvider'
import { getAnonymousQuizResult } from '@/lib/quizResultStorage'
import ColorProfileCard from '@/components/personal-color/ColorProfileCard'
import ColorInsights from '@/components/personal-color/ColorInsights'
import AnonymousResultBanner from '@/components/personal-color/AnonymousResultBanner'
import type { AxisValue, SubSeason } from '@/lib/db'

type LoadedResult = {
  subSeason: SubSeason
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
}

type ResultState = { status: 'loading' } | { status: 'empty' } | { status: 'found'; result: LoadedResult }

export default function ResultPage() {
  const t = useTranslations('PersonalColor.Result.Page')
  const { user, isHydrated } = useAuth()
  const [state, setState] = useState<ResultState>({ status: 'loading' })

  useEffect(() => {
    if (!isHydrated) return
    let cancelled = false

    async function loadResult() {
      if (user) {
        const response = await apiFetch('/quiz-attempts/me')
        if (cancelled) return
        if (response.ok) {
          const data = (await response.json()) as LoadedResult | null
          if (data) {
            setState({ status: 'found', result: data })
            return
          }
        }
      }
      if (!cancelled) {
        const anonymous = getAnonymousQuizResult()
        setState(anonymous ? { status: 'found', result: anonymous } : { status: 'empty' })
      }
    }

    loadResult()
    return () => {
      cancelled = true
    }
  }, [user, isHydrated])

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <nav className="mb-3 flex items-center gap-2 text-xs font-medium text-[#7b89ba]">
          <Link href="/" className="hover:underline">
            {t('breadcrumbHome')}
          </Link>
          <span className="material-symbols-outlined text-[10px] opacity-60">chevron_right</span>
          <Link href="/personal-color/quiz" className="hover:underline">
            {t('breadcrumbQuiz')}
          </Link>
          <span className="material-symbols-outlined text-[10px] opacity-60">chevron_right</span>
          <span className="font-semibold text-[#304461]">{t('breadcrumbCurrent')}</span>
        </nav>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5 sm:items-center">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#7b89ba]/15 text-lg text-[#7b89ba] shadow-sm">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#304461] sm:text-3xl">{t('heading')}</h1>
              <p className="mt-0.5 text-xs font-normal text-[#304461]/80 sm:text-sm">{t('subheading')}</p>
            </div>
          </div>
          <div className="self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-xs">
              <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
              <span>{t('accuracyBadge')}</span>
            </span>
          </div>
        </div>
      </div>
      {state.status === 'loading' && (
        <p className="text-center text-sm text-[#304461]/70">{t('loadingResult')}</p>
      )}
      {state.status === 'empty' && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#7b89ba]/15 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-bold text-[#304461]">{t('emptyStateTitle')}</h2>
          <p className="max-w-md text-sm text-[#304461]/75">{t('emptyStateBody')}</p>
          <Link
            href="/personal-color/quiz"
            className="mt-2 flex items-center gap-2 rounded-2xl bg-[#304461] px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#233247]"
          >
            {t('emptyStateCta')}
          </Link>
        </div>
      )}
      {state.status === 'found' && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {!user && <AnonymousResultBanner />}
          <ColorProfileCard result={state.result} />
          <ColorInsights subSeason={state.result.subSeason} />
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 12: Run the full personal-color test suite**

```bash
cd frontend && npm test -- components/personal-color lib/seasonProfiles.test.ts lib/quizResultStorage.test.ts app/personal-color
```

Expected: PASS (all tests — including any existing `app/personal-color/result/page.test.tsx`
if one exists; if it references the old hardcoded season text, update its
assertions the same way this task updated `ColorProfileCard.test.tsx`).

- [ ] **Step 13: Commit**

```bash
git add frontend/app/personal-color/result/page.tsx frontend/components/personal-color/ColorProfileCard.tsx frontend/components/personal-color/ColorProfileCard.test.tsx frontend/components/personal-color/ColorInsights.tsx frontend/components/personal-color/ColorInsights.test.tsx frontend/messages/vi.json
git commit -m "feat: render the real computed sub-season on the personal color result page"
```

---

## Task 9: Admin `QuizQuestionForm.tsx` — axis-aware editing

**Files:**
- Modify: `frontend/components/admin/QuizQuestionForm.tsx`
- Modify: `frontend/components/admin/QuizQuestionForm.test.tsx`

**Interfaces:**
- Consumes: `AXES`/`AXIS_VALUES`-equivalent constants (mirror the backend's
  `quiz/schemas.py` in a small local constant, matching how `lib/db.ts`
  already mirrors backend enums like `BLOG_CATEGORIES`), `Axis`, `AxisValue`
  from `lib/db.ts` (Task 5).

- [ ] **Step 1: Read the current test file first**

```bash
cat frontend/components/admin/QuizQuestionForm.test.tsx
```

Note its exact current assertions (field labels, season-select behavior)
before editing — adapt the rewrite in Step 3 to preserve every test that
isn't specifically about the old `season` field, renaming only what must
change.

- [ ] **Step 2: Update the failing test**

In `frontend/components/admin/QuizQuestionForm.test.tsx`, replace every
`season` reference with `axisValue`, and add:

```tsx
it('changing the axis resets each option to that axis\'s first valid value', () => {
  renderWithIntl(<QuizQuestionForm />)
  fireEvent.change(screen.getByLabelText('Trục'), { target: { value: 'value' } })
  const axisValueSelects = screen.getAllByLabelText(/Giá trị trục/)
  expect(axisValueSelects[0]).toHaveValue('dark')
})

it('renders the image URL field and includes it in the submitted body', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) }))
  renderWithIntl(<QuizQuestionForm />)
  fireEvent.change(screen.getByLabelText('Nội dung câu hỏi'), { target: { value: 'Câu hỏi test?' } })
  fireEvent.change(screen.getByLabelText('URL ảnh minh hoạ (không bắt buộc)'), {
    target: { value: '/personal-color/quiz/wrist-veins.jpg' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Lưu/ }))
  await waitFor(() => expect(fetch).toHaveBeenCalled())
  const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
  const body = JSON.parse(init.body as string)
  expect(body.imageUrl).toBe('/personal-color/quiz/wrist-veins.jpg')
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd frontend && npm test -- components/admin/QuizQuestionForm.test.tsx
```

Expected: FAIL — no "Trục" field, no "URL ảnh minh hoạ" field, options still
use `season`.

- [ ] **Step 4: Read the current implementation, then rewrite**

```bash
cat frontend/components/admin/QuizQuestionForm.tsx
```

Rewrite it (structure follows the existing file's conventions — dynamic
option list with add/remove, same submit/error handling pattern) with these
changes: add an `axis` `<select>` (Hue/Value/Chroma) above the options list;
add an `imageUrl` text input; change each option's `season` `<select>` to an
`axisValue` `<select>` whose choices come from a local
`AXIS_VALUES: Record<Axis, { value: AxisValue; label: string }[]>` map keyed
by the currently selected `axis`, e.g.:

```tsx
const AXIS_OPTIONS: { value: Axis; label: string }[] = [
  { value: 'hue', label: 'Nhiệt độ màu (Hue)' },
  { value: 'value', label: 'Sắc độ (Value)' },
  { value: 'chroma', label: 'Độ bão hoà (Chroma)' },
]

const AXIS_VALUE_OPTIONS: Record<Axis, { value: AxisValue; label: string }[]> = {
  hue: [
    { value: 'warm', label: 'Ấm (Warm)' },
    { value: 'cool', label: 'Lạnh (Cool)' },
    { value: 'neutral', label: 'Trung tính (Neutral)' },
  ],
  value: [
    { value: 'dark', label: 'Sẫm (Dark)' },
    { value: 'light', label: 'Sáng (Light)' },
    { value: 'medium', label: 'Trung bình (Medium)' },
  ],
  chroma: [
    { value: 'bright', label: 'Tươi sáng (Bright)' },
    { value: 'muted', label: 'Trầm (Muted)' },
    { value: 'neutral', label: 'Trung tính (Neutral)' },
  ],
}
```

When the `axis` `<select>` changes, reset every option's `axisValue` to
`AXIS_VALUE_OPTIONS[newAxis][0].value` (matching the test's expectation in
Step 2) since a previously-chosen value may not be valid for the new axis.
Add the `imageUrl` field as a plain optional text input alongside the
existing question-text textarea, submitted as `imageUrl: imageUrl.trim() || null`.

- [ ] **Step 5: Run the test to verify it passes**

```bash
cd frontend && npm test -- components/admin/QuizQuestionForm.test.tsx
```

Expected: PASS (all tests, including the 2 new ones).

- [ ] **Step 6: Commit**

```bash
git add frontend/components/admin/QuizQuestionForm.tsx frontend/components/admin/QuizQuestionForm.test.tsx
git commit -m "feat: make the admin quiz question form axis-aware"
```

---

## Final Integration

- [ ] **Step 1: Run the full backend test suite**

```bash
cd backend && source venv/bin/activate && python3 -m pytest -q
```

Expected: all tests pass.

- [ ] **Step 2: Run the full frontend test suite**

```bash
cd frontend && npm test
```

Expected: all tests pass. If `QuizQuestionList.tsx` (admin list view) or any
other file not touched by this plan renders `option.season` anywhere, fix it
here — search first:

```bash
grep -rln "\.season\b" frontend/components frontend/app --include="*.tsx" | grep -v node_modules
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manually verify in a browser**

With backend + frontend + Postgres running: take the quiz at
`/personal-color/quiz` end to end (10 questions, confirm the wrist-vein
image shows on question 1 only), submit, and confirm `/personal-color/result`
shows a real sub-season name, the three axis results, a palette matching that
sub-season (not always "Winter"), and season-specific recommendation text.
Repeat once logged in and once anonymous. Then open `/admin/quiz`, edit one
question, confirm the axis/axisValue/imageUrl fields work as expected.

- [ ] **Step 5: Commit any final fixups**

```bash
git add -A
git commit -m "chore: final integration fixes for the personal color quiz v2"
```

(Skip this commit if Steps 1–4 found nothing to fix.)
