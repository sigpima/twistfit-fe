# How It Works: Real Personal Color Assessment Methodology — Design

## Context

`/how-it-works`'s `ProcessSteps` section describes the app's 3-step journey (scan → get result → try on). Step 1 currently claims the analysis happens via a camera scan ("AI Camera Calibrator", "1.024 điểm quang phổ", "ISO 100 • 5600K Daylight") — this is not just generic filler copy, it's factually wrong: the real Personal Color feature (`/personal-color/quiz`, built earlier this session) is a 10-question text questionnaire, not a camera scan. The user has provided the real methodology behind that questionnaire — 3 phases (Hue, Value, Chroma), each with 3-4 named diagnostic methods — and confirmed during brainstorming that this REPLACES Step 1 entirely, correcting the factual mismatch rather than just refreshing copy.

## Content (verbatim, as given by the user)

### Đánh giá màu sắc cá nhân

Bộ câu hỏi được chia thành 3 giai đoạn rõ rệt dựa trên 3 trục độc lập của Munsell, giao điểm của ba trục sẽ chỉ ra một trong 12 mùa.

**Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)** — Tìm ra màu nền ẩn bên dưới da (Undertone) thông qua các phản ứng quang học trên bề mặt và cơ chế biến đổi sinh học tự nhiên dưới ánh sáng.

1. *Tán xạ tĩnh mạch dưới ánh sáng tự nhiên*: Quan sát sự phản chiếu qua thành mạch để nhận diện sắc tố ẩn: ánh xanh tím (Cool undertone) hoặc ánh xanh lá (Warm undertone chịu ảnh hưởng từ carotenoid).
2. *Độ tương thích trang sức kim loại*: Kiểm tra độ hòa hợp sắc da khi tiếp xúc gần với ánh kim để đối chiếu phản ứng cùng gam màu ấm (vàng) hay gam màu lạnh (bạc/bạch kim).
3. *Phản ứng sinh học da Fitzpatrick*: Đo lường mức độ nhạy cảm trước ánh nắng mặt trời giữa phản ứng ửng đỏ (hoạt động của hemoglobin) và dễ rám nắng (tăng sinh eumelanin).
4. *Thử nghiệm Drapery sắc trắng*: Phân tách sắc tố qua hai sắc thái chuẩn: sắc trắng tinh (Pure White) kích hoạt undertone lạnh và sắc trắng kem/ngà (Ivory) làm rạng rỡ undertone ấm.

**Đo Lường Độ Sáng - Tối (Value: Light vs Deep)** — Đo lường chiều sâu sắc tố tổng thể và định lượng độ chênh lệch sáng/tối giữa các vùng đặc trưng trên gương mặt ở trạng thái nguyên bản.

1. *Chiều sâu sắc tố Mắt & Tóc tự nhiên*: Phân tích đặc điểm khuôn mặt (Facial feature analysis) ở trạng thái mộc nhằm xác định cấp độ giá trị sắc tố tổng thể thuộc nhóm Sáng (Light) hay Tối (Deep).
2. *Định lượng tương phản diện mạo (Contrast Level)*: Đo lường khoảng cách sắc độ giữa màu da, mắt và chân tóc để phân loại độ tương phản cao (High Contrast) hay tương phản thấp/đồng điệu (Low Contrast).
3. *Định hướng công thức phối màu trang phục*: Chuyển hóa chỉ số tương phản khuôn mặt thành nguyên tắc chọn đồ: gợi ý cách phối màu đối lập rõ rệt hay phối màu đơn sắc/chuyển tông mượt mà (Tonal).

**Độ Bão Hòa & Khóa Kết Quả (Chroma: Clear vs Muted)** — Đánh giá mức độ tương thích với dải màu rực rỡ hay trầm khói, kết hợp dữ liệu kiểm chứng đa chiều để khóa chuẩn xác 1 trong 12 mùa sắc thái.

1. *Bài kiểm tra hiệu ứng lấp lánh (Sparkle Test)*: Xác định giới hạn sắc độ giúp gương mặt nổi bật: nhóm Soft cần độ đục nhẹ để tránh bị lấn át, nhóm Bright cần độ bão hòa cao để diện mạo không mờ nhạt.
2. *Đối chiếu chéo trải nghiệm thực tế (Triangulation)*: Thu thập dữ liệu từ những nhóm màu trang phục từng giúp bạn nhận được nhiều lời khen nhất nhằm kiểm chứng độ chuẩn xác của các bước phân tích.
3. *Khóa kết quả & Định vị mùa phụ (Sub-season)*: Tổng hợp giao điểm của 3 trục Munsell để đưa ra kết luận mùa cá nhân chính xác tuyệt đối kèm bộ cẩm nang màu sắc độc bản.

## Decisions (confirmed during brainstorming)

| Decision | Choice |
|---|---|
| Relationship to the existing Step 1 | Replaces it entirely — the old camera-scan framing is factually wrong for the real quiz-based feature, not just thin copy. |
| Display of the 3 phases | A 3-tab switcher (Hue / Value / Chroma) rather than all 3 stacked continuously — keeps the page from growing very long; matches the numbered-stepper interaction pattern already established by `components/home/PhoneMockupStepper.tsx`. |
| Tab labels vs. full phase titles | Tabs show short labels ("1. Hue", "2. Value", "3. Chroma") — the full Vietnamese phase title (e.g. "Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)") renders as a heading below the tabs for the active phase, not on the tab itself, to keep tabs short enough to never wrap or need horizontal scroll at ~360-390px mobile widths. |
| Camera-scan visual mockup + trust badges ("Tự động tách nền", "Bảo mật gương mặt 100%") | Removed along with the rest of the old Step 1 — they illustrate a capture flow (camera privacy) that doesn't apply to a text questionnaire. |
| Layout width | Full-width (not the existing 50/50 text+image grid used by Steps 2/3) — the content is too extensive for a half-width column next to an image. |

## Current State (for context)

- `components/how-it-works/ProcessSteps.tsx` renders one shared heading/kicker, then 3 numbered (`01`/`02`/`03`) step blocks, each a `grid lg:grid-cols-12` split (text one side, visual mockup the other). Step 1's current block (lines ~36-112 in the file read this session) is the one being replaced; Steps 2 and 3 are untouched by this spec.
- `components/home/PhoneMockupStepper.tsx` is the established precedent for "numbered circle, click to switch active content" — its buttons use `aria-current="step"` on the active one. This spec's phase tabs follow the same `aria-current` convention (checked via `ui-ux-pro-max`'s "Compact Control Semantics" guidance from the earlier forum work: a toggle/selection control must be a real `<button>` exposing its current state, not a styled `<div>`).
- Touch-target guidance from `ui-ux-pro-max` (`domain: ux`, queries "tab navigation mobile touch target" and "horizontal tab overflow scroll mobile"): tabs need ≥44px-ish touch height and ≥8px gaps between adjacent targets; horizontal scrolling must be avoided — satisfied here by keeping labels short enough that 3 tabs always fit one row down to ~360px. A direct Next.js-stack card-grid guideline query returned no database match (confirmed via retry) — the responsive card grid below instead reuses this app's own already-verified-on-mobile pattern (`grid-cols-1 md:grid-cols-2`, the same one `ContrastCardPair` uses on the About page).

## Component

### `components/how-it-works/AssessmentMethodology.tsx` (new)

Reads `HowItWorks.AssessmentMethodology` translations. Internal `useState` for the active phase index (0/1/2, default 0).

Layout:
- The existing "01" numbered badge + `h3` title ("Đánh Giá Màu Sắc Cá Nhân"), matching the visual weight of the badge/title pairing already used for Steps 2 and 3.
- Intro paragraph (the "Bộ câu hỏi được chia thành 3 giai đoạn..." line), `max-w-prose`.
- Tab row: 3 `<button>`s, each `rounded-full px-space-lg py-space-sm` (comfortably over the ~44px touch-height guidance once padding is included) with `gap-space-sm` between them (well over the 8px minimum), the active one styled solid (`bg-primary text-on-primary`) and others neutral (`bg-surface-container text-on-surface-variant`), each with `aria-current={index === activePhase ? 'true' : undefined}`. Labels are the short `"{n}. {AxisName}"` form so 3 tabs never wrap at mobile widths.
- Active phase's full title as an `h4`, then its intro sentence (`max-w-prose`), then a `grid grid-cols-1 gap-space-md md:grid-cols-2` of method cards — one per method, each `rounded-xl bg-surface-container-lowest p-space-lg shadow-sm` with a `material-symbols-outlined` icon, the method's bolded title, and its body text.

### `components/how-it-works/ProcessSteps.tsx` (modified)

Delete the entire Step 1 block (the first `grid lg:grid-cols-12` div and everything inside it) and render `<AssessmentMethodology />` in its place, still inside the section's existing wrapper so it sits between the shared heading and Step 2. Steps 2 and 3 are otherwise untouched.

## i18n content (`messages/vi.json`)

Remove `HowItWorks.ProcessSteps.step1` entirely (all of its keys: `title`, `body`, `tipTitle`, `tipBody`, `checkAutoBg`, `checkPrivacy`, `calibratorLabel`, `calibratorSpec`, `imageAlt`, `lockLabel`, `undertoneLabel`, `undertoneValue`, `contrastLabel`, `contrastValue`, `pigmentLabel`, `pigmentValue`).

Add a new `HowItWorks.AssessmentMethodology` block:

```json
"AssessmentMethodology": {
  "title": "Đánh Giá Màu Sắc Cá Nhân",
  "intro": "Bộ câu hỏi được chia thành 3 giai đoạn rõ rệt dựa trên 3 trục độc lập của Munsell, giao điểm của ba trục sẽ chỉ ra một trong 12 mùa.",
  "phases": {
    "hue": {
      "tabLabel": "1. Hue",
      "title": "Xác Định Nhiệt Độ Màu (Hue: Warm vs Cool)",
      "intro": "Tìm ra màu nền ẩn bên dưới da (Undertone) thông qua các phản ứng quang học trên bề mặt và cơ chế biến đổi sinh học tự nhiên dưới ánh sáng.",
      "methods": {
        "veins": {
          "title": "Tán xạ tĩnh mạch dưới ánh sáng tự nhiên",
          "body": "Quan sát sự phản chiếu qua thành mạch để nhận diện sắc tố ẩn: ánh xanh tím (Cool undertone) hoặc ánh xanh lá (Warm undertone chịu ảnh hưởng từ carotenoid)."
        },
        "jewelry": {
          "title": "Độ tương thích trang sức kim loại",
          "body": "Kiểm tra độ hòa hợp sắc da khi tiếp xúc gần với ánh kim để đối chiếu phản ứng cùng gam màu ấm (vàng) hay gam màu lạnh (bạc/bạch kim)."
        },
        "fitzpatrick": {
          "title": "Phản ứng sinh học da Fitzpatrick",
          "body": "Đo lường mức độ nhạy cảm trước ánh nắng mặt trời giữa phản ứng ửng đỏ (hoạt động của hemoglobin) và dễ rám nắng (tăng sinh eumelanin)."
        },
        "drapery": {
          "title": "Thử nghiệm Drapery sắc trắng",
          "body": "Phân tách sắc tố qua hai sắc thái chuẩn: sắc trắng tinh (Pure White) kích hoạt undertone lạnh và sắc trắng kem/ngà (Ivory) làm rạng rỡ undertone ấm."
        }
      }
    },
    "value": {
      "tabLabel": "2. Value",
      "title": "Đo Lường Độ Sáng - Tối (Value: Light vs Deep)",
      "intro": "Đo lường chiều sâu sắc tố tổng thể và định lượng độ chênh lệch sáng/tối giữa các vùng đặc trưng trên gương mặt ở trạng thái nguyên bản.",
      "methods": {
        "eyesHair": {
          "title": "Chiều sâu sắc tố Mắt & Tóc tự nhiên",
          "body": "Phân tích đặc điểm khuôn mặt (Facial feature analysis) ở trạng thái mộc nhằm xác định cấp độ giá trị sắc tố tổng thể thuộc nhóm Sáng (Light) hay Tối (Deep)."
        },
        "contrastLevel": {
          "title": "Định lượng tương phản diện mạo (Contrast Level)",
          "body": "Đo lường khoảng cách sắc độ giữa màu da, mắt và chân tóc để phân loại độ tương phản cao (High Contrast) hay tương phản thấp/đồng điệu (Low Contrast)."
        },
        "colorFormula": {
          "title": "Định hướng công thức phối màu trang phục",
          "body": "Chuyển hóa chỉ số tương phản khuôn mặt thành nguyên tắc chọn đồ: gợi ý cách phối màu đối lập rõ rệt hay phối màu đơn sắc/chuyển tông mượt mà (Tonal)."
        }
      }
    },
    "chroma": {
      "tabLabel": "3. Chroma",
      "title": "Độ Bão Hòa & Khóa Kết Quả (Chroma: Clear vs Muted)",
      "intro": "Đánh giá mức độ tương thích với dải màu rực rỡ hay trầm khói, kết hợp dữ liệu kiểm chứng đa chiều để khóa chuẩn xác 1 trong 12 mùa sắc thái.",
      "methods": {
        "sparkleTest": {
          "title": "Bài kiểm tra hiệu ứng lấp lánh (Sparkle Test)",
          "body": "Xác định giới hạn sắc độ giúp gương mặt nổi bật: nhóm Soft cần độ đục nhẹ để tránh bị lấn át, nhóm Bright cần độ bão hòa cao để diện mạo không mờ nhạt."
        },
        "triangulation": {
          "title": "Đối chiếu chéo trải nghiệm thực tế (Triangulation)",
          "body": "Thu thập dữ liệu từ những nhóm màu trang phục từng giúp bạn nhận được nhiều lời khen nhất nhằm kiểm chứng độ chuẩn xác của các bước phân tích."
        },
        "lockResult": {
          "title": "Khóa kết quả & Định vị mùa phụ (Sub-season)",
          "body": "Tổng hợp giao điểm của 3 trục Munsell để đưa ra kết luận mùa cá nhân chính xác tuyệt đối kèm bộ cẩm nang màu sắc độc bản."
        }
      }
    }
  }
}
```

Method icons (decorative, `material-symbols-outlined`, chosen for the plan to assign directly since they carry no factual content): `veins` → `water_drop`, `jewelry` → `diamond`, `fitzpatrick` → `wb_sunny`, `drapery` → `checkroom`; `eyesHair` → `visibility`, `contrastLevel` → `contrast`, `colorFormula` → `palette`; `sparkleTest` → `auto_awesome`, `triangulation` → `hub`, `lockResult` → `verified`.

## Responsive behavior

- The phase tab row never wraps or scrolls at any width down to ~360px — verified by keeping labels to the short `"{n}. {Axis}"` form.
- The method-card grid stacks to one column below `md:` (768px), matching the same breakpoint already used by `ContrastCardPair` on the About page.
- Long-form intro/body text uses `max-w-prose` for readability at wide desktop widths, consistent with the About page work.
- Tabs keep a comfortable touch height (padding-driven, well over the ~44px guidance) and ≥8px gaps between them.

## Testing

- `components/how-it-works/AssessmentMethodology.test.tsx` (new): renders the Hue phase by default (title + all 4 method titles/bodies visible); clicking the Value tab switches to Value's title/3 methods and the Hue content is no longer shown; clicking a tab sets `aria-current` correctly on the active tab only; renders the section intro sentence.
- `components/how-it-works/ProcessSteps.test.tsx` (rewritten for the parts that change): removes any assertions tied to the old Step 1 copy (camera calibrator labels, undertone/contrast/pigment stat values); asserts `AssessmentMethodology`'s default content (Hue phase) renders as part of the full section; Step 2/3 assertions unchanged.

Run `npx tsc --noEmit` and the full `npx vitest run` as a final check.

## Out of scope

- Steps 2 and 3 of `ProcessSteps` (still fabricated: "98.4%", "Áo Peplum Voan Hồng Nhạt", etc.) — untouched; part of the same incremental content-replacement effort but not this turn's content.
- `FeatureBento`, `ComparisonTable`, `PreparationTips`, `CtaBanner` on the same page — also still fabricated, also untouched.
- Wiring this section's content to the real quiz data (e.g., pulling live question text from the backend) — this is static marketing copy describing the methodology, not a live mirror of the quiz's actual question bank.
