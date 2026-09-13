# TwistFit — Admin: Mở rộng CMS cho FAQ, Model Catalog, Capsule Wardrobe, Team (Design)

## Context

`/admin` hiện đã có CRUD hoàn chỉnh cho Blog và Quiz (xem
`docs/superpowers/specs/2026-09-13-admin-blog-quiz-cms-design.md`), dùng `better-sqlite3`
(`frontend/data/twistfit.db`), Route Handlers dưới `app/api/`, và session cookie ký
(`lib/auth/session.ts`) để gác API ghi. Bốn loại nội dung còn lại vẫn là mảng dữ liệu cứng
trong code (khảo sát chi tiết ở `docs/admin-dashboard-roadmap.md`):

- **FAQ** — `components/faq/FaqSection.tsx`, mảng `FAQ_ITEMS` (6 câu). Trường `answer` hiện
  là JSX thật (đoạn văn, danh sách, và một số câu có thêm khung "highlight" với icon —
  bố cục không đồng nhất giữa các câu, có câu dùng lưới 3 cột, có câu dùng khung QR riêng).
- **Model Catalog** — `components/outfit/step2/ModelCatalog.tsx`, 11 model + 1
  `DEFAULT_MODEL` (Carmen) định nghĩa riêng trong `OutfitFlowProvider.tsx`. Shape `Model`
  còn được đọc bởi `ModelDossier.tsx`, `ResultPreview.tsx`, `BodyMeasurements.tsx`,
  `QuickSelectionSummary.tsx` (qua state global, không phải đọc thẳng mảng — không bị ảnh
  hưởng miễn shape giữ nguyên). Luồng "tải ảnh của tôi" tạo `Model` tạm thời phía client,
  không liên quan tới CMS này (giữ nguyên).
- **Capsule Wardrobe** — `components/outfit/step4/CapsuleWardrobe.tsx`, 3 set đồ, mỗi set có
  mảng con `items: {label, price}[]`. Trường `tagClass` hiện là chuỗi class Tailwind viết tay
  cho từng set.
- **Team** — `components/about/TeamGrid.tsx`, 3 thành viên. Hai trường `badgeColor` và
  `roleColor` cũng là chuỗi class Tailwind viết tay.

## Goals

- Bốn loại nội dung trên chuyển từ mảng cứng sang SQLite, có CRUD qua `/admin/*`.
- Trang public tương ứng (`/faq`, `/outfit/step-2`, `/outfit/step-4`, `/about`) đọc dữ liệu
  từ DB thay vì mảng cứng.
- Seed DB từ đúng dữ liệu đang hardcode (đơn giản hóa các câu FAQ có bố cục JSX phức tạp hơn
  khuôn dữ liệu mới — xem "Di trú dữ liệu có sẵn").
- Thay các trường màu Tailwind tự do (`tagClass`, `badgeColor`, `roleColor`) bằng enum màu cố
  định + bảng tra cứu code-side, giống cách `category` → màu của Blog đang làm.
- `AdminDashboard` có thêm 4 thẻ liên kết tới 4 khu quản trị mới.
- Giữ nguyên nguyên tắc tách file server/client đã sửa ở CMS Blog/Quiz (bug đã gặp: Client
  Component import nhầm code có `better-sqlite3` → crash trình duyệt) — mỗi module dữ liệu
  mới đều tuân thủ pattern `lib/<domain>.ts` (types + CRUD, an toàn cho import gián tiếp) và
  chỉ `lib/getDb.ts` mới thực sự `import Database from 'better-sqlite3'`.

## Non-goals

- Không sắp xếp thứ tự (reorder) cho cả 4 loại — hiển thị theo thứ tự tạo, giống Blog.
- Không tái tạo chính xác 100% bố cục JSX hiện tại của từng câu FAQ — chuẩn hóa về 1 khuôn:
  đoạn markdown + tối đa 1 khung highlight (icon + text).
- Không đổi cấu trúc `Model` mà các component khác (`ModelDossier`, `ResultPreview`,...) đang
  dùng — chỉ đổi nguồn dữ liệu (DB thay vì mảng cứng), field giữ nguyên tên/kiểu.
- Không động tới luồng "tải ảnh của tôi" (custom model tạm thời phía client).
- Không làm CRUD cho phần "tải ảnh của tôi" hay bất kỳ nội dung nào không nằm trong roadmap.
- Không tách lại `lib/db.ts` (Blog/Quiz) thành các file domain riêng — giữ nguyên, chỉ áp
  dụng cách tổ chức file mới cho 4 loại nội dung này.
- Không thêm tính năng ngoài roadmap (không thêm trường mới ngoài dữ liệu đang có, trừ các
  trường enum thay thế class Tailwind).

## Kho dữ liệu

Bốn module mới, mỗi module một file, theo đúng khuôn của `lib/db.ts`/`lib/getDb.ts` hiện có:

```
lib/faq.ts              -- types + CRUD (initSchema, seedIfEmpty, get/create/update/delete)
lib/modelCatalog.ts      -- nt.
lib/capsuleWardrobe.ts   -- nt.
lib/team.ts              -- nt.
lib/getDb.ts             -- SỬA: gọi initSchema + seedIfEmpty của cả 4 module trên, cùng
                            với initSchema/seedIfEmpty hiện có của lib/db.ts, trong cùng
                            1 lần mở kết nối (transaction schema chạy 1 lần khi tạo DB).
```

Schema SQL (mỗi bảng một file `initSchema` riêng, gọi `CREATE TABLE IF NOT EXISTS`):

```sql
-- lib/faq.ts
CREATE TABLE faq_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categories TEXT NOT NULL,       -- JSON array of FaqCategory, ví dụ '["personal-color"]'
  question TEXT NOT NULL,
  answer_markdown TEXT NOT NULL,
  highlight_icon TEXT,            -- NULL = không có khung highlight
  highlight_text TEXT,            -- NULL nếu highlight_icon NULL
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- lib/modelCatalog.ts
CREATE TABLE catalog_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  dossier_image TEXT NOT NULL,
  pose_count INTEGER NOT NULL,
  tagline TEXT NOT NULL,
  undertone TEXT NOT NULL,        -- 'warm' | 'cool' | 'neutral'
  height TEXT NOT NULL,
  body_shape TEXT NOT NULL,
  waist TEXT NOT NULL,
  personal_color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- lib/capsuleWardrobe.ts
CREATE TABLE capsule_sets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image TEXT NOT NULL,
  alt TEXT NOT NULL,
  tag_variant TEXT NOT NULL,      -- 'primary' | 'secondary' | 'tertiary'
  tag_label TEXT NOT NULL,        -- vd "Set 1 • Thanh Lịch"
  fit_for TEXT NOT NULL,
  title TEXT NOT NULL,
  tone TEXT NOT NULL,
  description TEXT NOT NULL,
  items_json TEXT NOT NULL,       -- JSON: [{label, price}, ...]
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- lib/team.ts
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT NOT NULL,
  badge_variant TEXT NOT NULL,    -- 'primary' | 'secondary' | 'tertiary'
  role_variant TEXT NOT NULL,     -- 'primary' | 'secondary' | 'tertiary'
  footer_icon TEXT NOT NULL,      -- tên icon Material Symbols, nhập tự do
  footer_label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

`categories` (FAQ) và `items_json` (Capsule Wardrobe) lưu dạng JSON trong 1 cột text — quy mô
nhỏ (tối đa vài phần tử, luôn sửa cùng lúc với bản ghi cha), không cần bảng con riêng như
`quiz_options` (vốn cần ID + sort_order độc lập cho từng lựa chọn).

`highlight_icon` giới hạn ở danh sách cố định trong code (dropdown ở form admin), không cho
gõ tự do — tránh tên icon rác: `palette`, `wb_sunny`, `face_retouching_off`,
`center_focus_strong`, `qr_code_scanner`, `verified_user`, `info`, `lightbulb`.

`tag_variant`, `badge_variant`, `role_variant` giới hạn `'primary' | 'secondary' |
'tertiary'` — mỗi component có 1 file tra cứu nhỏ (`.../colorPresentation.ts`, giống
`components/blog/categoryPresentation.ts`) map variant → class Tailwind thật, để tránh lưu
CSS tự do vào DB.

## API routes

Tất cả dưới `app/api/`, JSON in/out, cùng khuôn `getAdminSessionFromCookieHeader` cho
POST/PUT/DELETE như Blog/Quiz.

| Route | Method | Việc |
|---|---|---|
| `/api/faq` | GET | Danh sách FAQ |
| `/api/faq` | POST (admin) | Tạo câu FAQ |
| `/api/faq/[id]` | GET / PUT (admin) / DELETE (admin) | Đọc / sửa / xóa 1 câu |
| `/api/model-catalog` | GET / POST (admin) | Danh sách / tạo model |
| `/api/model-catalog/[id]` | GET / PUT (admin) / DELETE (admin) | Đọc / sửa / xóa 1 model |
| `/api/capsule-wardrobe` | GET / POST (admin) | Danh sách / tạo set đồ |
| `/api/capsule-wardrobe/[id]` | GET / PUT (admin) / DELETE (admin) | Đọc / sửa / xóa 1 set |
| `/api/team` | GET / POST (admin) | Danh sách / tạo thành viên |
| `/api/team/[id]` | GET / PUT (admin) / DELETE (admin) | Đọc / sửa / xóa 1 thành viên |

## Trang Admin

Mỗi loại nội dung có đúng 3 trang, cùng khuôn `BlogPostForm`/`BlogPostList`:

- `/admin/faq` (danh sách + nút xóa) , `/admin/faq/new`, `/admin/faq/[id]/edit`
- `/admin/model-catalog`, `/admin/model-catalog/new`, `/admin/model-catalog/[id]/edit`
- `/admin/capsule-wardrobe`, `/admin/capsule-wardrobe/new`, `/admin/capsule-wardrobe/[id]/edit`
- `/admin/team`, `/admin/team/new`, `/admin/team/[id]/edit`

`AdminDashboard.tsx` thêm 4 thẻ liên kết (tổng cộng 6 thẻ, cùng dạng thẻ đang có cho
Blog/Quiz).

Form cho Capsule Wardrobe có thêm phần "danh sách món đồ" (thêm/xóa dòng label+price), giống
cách `QuizQuestionForm` xử lý danh sách lựa chọn (add/remove option) — tái dùng đúng pattern
đó, không thiết kế mới.

## Trang public đọc từ DB

- `app/faq/page.tsx` (mới là Server Component) gọi `getDb()` + `getFaqItems()`, truyền xuống
  `FaqSection` (đổi thành nhận prop `items: FaqItem[]` thay vì tự chứa mảng cứng). Component
  hiển thị/markdown-render `answer_markdown` bằng `renderMarkdown` đã có sẵn từ CMS Blog.
- `app/outfit/step-2/page.tsx` gọi `getModels()`, truyền xuống `ModelCatalog` (nhận prop
  `models: CatalogModel[]`). Shape ánh xạ đúng bằng `Model` hiện có để không phải sửa
  `OutfitFlowProvider`/`ModelDossier`/... — Carmen trở thành model đầu tiên trong DB, không
  còn hằng số `DEFAULT_MODEL` riêng trong code (chọn model đầu tiên trả về làm mặc định).
- `app/outfit/step-4/page.tsx` gọi `getCapsuleSets()`, truyền xuống `CapsuleWardrobe` (nhận
  prop `sets: CapsuleSet[]`).
- `app/about/page.tsx` gọi `getTeamMembers()`, truyền xuống `TeamGrid` (nhận prop
  `members: TeamMember[]`).

Cả 4 trang đều là dữ liệu đồng bộ (`better-sqlite3`), không cần `async` component, giống
cách `app/blog/page.tsx` đang làm.

## Di trú dữ liệu có sẵn

Seed 4 bảng trên từ đúng dữ liệu hardcode hiện tại khi bảng rỗng (giống `seedIfEmpty` của
Blog/Quiz), với các điều chỉnh đã duyệt:

- **FAQ**: 6 câu hiện tại viết lại theo khuôn `answer_markdown` + `highlight_icon`/
  `highlight_text` tùy chọn. Câu nào hiện có bố cục JSX phức tạp hơn 1 khung (ví dụ lưới 3
  cột) được gộp lại thành 1 đoạn markdown (danh sách hoặc đoạn văn) + tối đa 1 khung
  highlight — không cố giữ y nguyên bố cục cũ.
- **Model Catalog**: 11 model + Carmen (`DEFAULT_MODEL`) seed thành 12 hàng, Carmen đứng đầu.
- **Capsule Wardrobe**: 3 set đồ, `tagClass` cũ ánh xạ thủ công sang `tag_variant` gần đúng
  nhất (`primary`/`secondary`/`tertiary`) theo màu chữ hiện có.
- **Team**: 3 thành viên, `badgeColor`/`roleColor` cũ ánh xạ thủ công sang
  `badge_variant`/`role_variant`.

## Error handling

Giống Blog/Quiz: validate body ở 1 hàm `validate*Body` riêng mỗi loại (400 + field errors),
401 nếu thiếu session admin hợp lệ trên POST/PUT/DELETE, 404 khi sửa/xóa id không tồn tại.

## Testing

TDD từng bước như CMS Blog/Quiz: viết test đỏ trước, code cho xanh, chạy lại toàn bộ
`vitest run` + `tsc --noEmit` + `eslint .` sau mỗi phần lớn. Bắt buộc mở trình duyệt thật
(Playwright hoặc tương đương) kiểm tra `/faq`, `/outfit/step-2`, `/outfit/step-4`, `/about`
và luồng CRUD admin tương ứng sau khi cả 4 module xong — test suite/typecheck từng không bắt
được lỗi bundle `better-sqlite3` vào client ở lần làm CMS Blog/Quiz trước, nên bước kiểm tra
trình duyệt thật là bắt buộc, không phải tùy chọn.
