# TwistFit — Admin: Quản lý Blog & Câu hỏi Quiz (Design)

## Context

`/admin` hiện chỉ là khung trống (`AdminGate` + `AdminDashboard`), dựng cùng lúc với hệ
thống đăng nhập mock (`AuthProvider`, 2 tài khoản test cố định trong
`lib/auth/mockAccounts.ts`, phiên đăng nhập lưu ở `localStorage`, hoàn toàn phía client).

Toàn bộ nội dung site hiện là dữ liệu cứng trong code:

- **Blog** — `components/blog/BlogArticleGrid.tsx` (mảng `ARTICLES`, 6 bài) +
  `components/blog/BlogFeaturedArticle.tsx` (1 bài "nổi bật" viết JSX riêng, cấu trúc khác
  hẳn). Chưa có trang chi tiết bài viết (`/blog/[slug]` không tồn tại, nút "Đọc ngay" trỏ
  `#`).
- **Quiz** — `lib/personalColorQuiz.ts` (mảng `QUIZ_QUESTIONS`, 5 câu, mỗi câu 4 lựa chọn
  gắn với 1 season). File này tự ghi chú là "placeholder cho đến khi có bộ câu hỏi thật".

Backend Python (`backend/main.py`) mới chỉ là khung FastAPI rỗng, chưa có gì — không dùng
trong spec này. Khảo sát đầy đủ và các đề xuất admin khác (chưa làm) nằm ở
`docs/admin-dashboard-roadmap.md`.

Người dùng có server riêng (self-hosted), nên không cần lo ngại về filesystem tạm thời của
nền tảng serverless.

## Goals

- Chuyển dữ liệu Blog và Quiz từ mảng cứng sang SQLite, có API để đọc/ghi.
- Trang admin (`/admin/blog`, `/admin/quiz`) cho phép tạo/sửa/xóa bài viết và câu hỏi quiz.
- Trang public (`/blog`, quiz flow) đọc dữ liệu từ DB thay vì mảng cứng.
- Thêm trang chi tiết bài viết `/blog/[slug]` (chưa từng tồn tại).
- API ghi (create/update/delete) phải được xác thực phía server — không thể gọi thẳng mà
  không đăng nhập admin, dù hệ thống auth vẫn đang ở dạng mock.
- Seed DB từ đúng dữ liệu đang hardcode để site không trống khi chuyển đổi.

## Non-goals

- Diễn đàn (đăng bài từ user, kiểm duyệt) — ghi nhận ở roadmap, làm sau.
- Quản lý người dùng thật (danh sách tài khoản, khóa/mở) — vẫn dùng 2 tài khoản mock hiện có.
- CRUD cho FAQ / catalog người mẫu / capsule wardrobe / team — ghi nhận ở roadmap.
- Upload ảnh thật (object storage) — admin nhập đường dẫn/URL ảnh, giống cách dữ liệu cứng
  hiện tại đang tham chiếu `/public`.
- Dashboard thống kê, hộp thư liên hệ.
- Auth thật (bảng user, đăng ký thật) — chỉ nâng cấp tối thiểu để phiên đăng nhập mock có
  thể xác thực được ở server (xem "Nâng cấp xác thực" bên dưới).

## Kho dữ liệu

`better-sqlite3` (driver đồng bộ, không cần ORM cho quy mô 3 bảng), file DB tại
`frontend/data/twistfit.db` (thêm vào `.gitignore`; tự tạo + seed khi chưa tồn tại).

`lib/db.ts` mở kết nối, chạy `CREATE TABLE IF NOT EXISTS` cho schema dưới đây, seed dữ liệu
ban đầu nếu bảng rỗng, và export các hàm truy vấn dùng chung cho cả Route Handlers và Server
Components (không cần mỗi nơi tự viết SQL).

```sql
CREATE TABLE blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,        -- markdown
  cover_image_url TEXT NOT NULL,
  category TEXT NOT NULL,       -- 'personal-color' | 'styling' | 'sustainable' | 'beauty' | 'community'
  author_name TEXT,             -- NULL = không hiện khối tác giả
  is_featured INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL,   -- ISO date
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE quiz_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  season TEXT NOT NULL,         -- 'spring' | 'summer' | 'autumn' | 'winter'
  sort_order INTEGER NOT NULL
);
```

Lược bỏ so với dữ liệu cứng hiện tại (đã duyệt với người dùng):

- Bỏ `badge`/`badgeColor` tự do — nhãn + màu hiển thị suy ra từ `category` bằng một bảng
  tra cứu cố định trong frontend (không lưu DB).
- Bỏ `views` (số lượt xem hiện đang là chuỗi bịa tay, ví dụ `"1.8k"`).
- Bỏ trường "X phút đọc" nhập tay — tự tính từ số từ trong `content` (~200 từ/phút).

## Nâng cấp xác thực (để bảo vệ API ghi)

Vấn đề: `AuthProvider` hiện chỉ lưu trạng thái đăng nhập ở `localStorage` — phía server
không có cách nào biết ai đang gọi API. Nếu chỉ vậy, bất kỳ ai biết URL API đều có thể
`POST /api/blog` mà không cần đăng nhập.

Giải pháp tối thiểu (vẫn dùng 2 tài khoản mock, không xây bảng user thật):

- `app/api/auth/login/route.ts` (Route Handler mới) — nhận `email`/`password`, kiểm tra qua
  `findMockAccount` (dùng lại `lib/auth/mockAccounts.ts`), nếu đúng thì set cookie
  `twistfit_session` là **httpOnly, signed (HMAC-SHA256)** chứa `{ email, role, exp }`. Khóa
  ký lấy từ biến môi trường `AUTH_COOKIE_SECRET` (thêm vào `.env.local`, có giá trị mặc định
  dev-only nếu chưa set, log cảnh báo).
- `app/api/auth/logout/route.ts` — xóa cookie.
- `LoginForm.tsx` gọi thêm route này song song với `useAuth().login()` hiện có (giữ nguyên
  UX/điều hướng theo role đã có); `AuthProvider.logout()` gọi thêm route logout.
- `lib/auth/session.ts` — hàm `requireAdminSession(request)` dùng trong mọi Route Handler
  ghi: đọc cookie, verify chữ ký + hạn dùng, trả 401 nếu thiếu/sai/không phải role admin.
- Cookie này **không** thay thế `AuthProvider`/`localStorage` (UI vẫn đọc trạng thái đăng
  nhập từ đó như hiện tại) — nó chỉ là bản sao server-verifiable song song, dùng riêng để
  gác API ghi.

## API routes

Tất cả dưới `app/api/`, JSON in/out.

| Route | Method | Việc |
|---|---|---|
| `/api/blog` | GET | Danh sách bài viết (public) |
| `/api/blog` | POST | Tạo bài viết (yêu cầu admin session) |
| `/api/blog/[id]` | GET | Chi tiết 1 bài (dùng cho form sửa) |
| `/api/blog/[id]` | PUT | Sửa bài viết (yêu cầu admin session) |
| `/api/blog/[id]` | DELETE | Xóa bài viết (yêu cầu admin session) |
| `/api/quiz-questions` | GET | Danh sách câu hỏi + lựa chọn (public) |
| `/api/quiz-questions` | POST | Tạo câu hỏi (yêu cầu admin session) |
| `/api/quiz-questions/[id]` | GET/PUT/DELETE | Như trên, cho 1 câu hỏi (PUT/DELETE yêu cầu admin) |

`slug` cho blog tự sinh từ `title` (không dấu, kebab-case) khi tạo mới, admin sửa được nếu
cần; kiểm tra trùng trước khi ghi.

## Trang Admin

- `/admin` — sửa `AdminDashboard` hiện tại thành 2 thẻ liên kết: "Quản lý Blog" → `/admin/blog`,
  "Quản lý câu hỏi Quiz" → `/admin/quiz` (vẫn nằm sau `AdminGate` như hiện tại).
- `/admin/blog` — bảng danh sách (tiêu đề, chuyên mục, ngày đăng, nút sửa/xóa) + nút "Viết bài
  mới".
- `/admin/blog/new`, `/admin/blog/[id]/edit` — form: tiêu đề, slug, excerpt, content
  (textarea markdown), cover image URL, category (select), author name (optional), featured
  (checkbox), ngày đăng.
- `/admin/quiz` — danh sách câu hỏi (thứ tự, rút gọn nội dung) + nút "Thêm câu hỏi", nút
  lên/xuống trên mỗi dòng để đổi `sort_order` (đủ dùng cho quy mô ~5-10 câu, không cần thư
  viện kéo-thả).
- `/admin/quiz/new`, `/admin/quiz/[id]/edit` — form: nội dung câu hỏi + danh sách 4 lựa chọn
  (label + season chọn từ dropdown 4 giá trị), nút thêm/xóa lựa chọn.

Style tái dùng input/label/button đã thiết lập ở `RegisterForm`/`LoginForm`/`ContactSection`
(`rounded-xl bg-surface ... focus:bg-surface-container-high`, nút `rounded-full bg-primary`).

## Trang public đọc từ DB

- `app/blog/page.tsx` (Server Component) đọc `getBlogPosts()` từ `lib/db.ts`, truyền xuống
  `BlogArticleGrid`/`BlogFeaturedArticle` qua props thay vì mỗi component tự có mảng cứng.
  Bài có `is_featured = 1`, `published_at` mới nhất → khối nổi bật; các bài còn lại → lưới.
  Nhãn/màu badge suy ra từ `category` qua bảng tra cứu cố định trong
  `components/blog/categoryPresentation.ts` (dùng chung cho cả 2 component).
- `app/blog/[slug]/page.tsx` (mới) — trang chi tiết, `notFound()` nếu slug không tồn tại,
  render `content` markdown (thêm 1 dependency nhỏ để parse, ví dụ `marked`, sanitize trước
  khi `dangerouslySetInnerHTML` vì content do admin nhập).
- `components/personal-color/QuizFlow.tsx` nhận câu hỏi qua props từ
  `app/personal-color/quiz/page.tsx` (Server Component gọi `getQuizQuestions()`) thay vì
  import trực tiếp `QUIZ_QUESTIONS` từ `lib/personalColorQuiz.ts`. Giữ nguyên toàn bộ logic
  chấm điểm (`computeSeasonResult.ts`) — chỉ đổi nguồn câu hỏi.

## Di trú dữ liệu có sẵn

`lib/db.ts` seed đúng 1 lần khi bảng rỗng: 6 bài từ `ARTICLES` + bài trong
`BlogFeaturedArticle` (gán `is_featured = 1`) map sang schema mới; 5 câu hỏi +
lựa chọn từ `QUIZ_QUESTIONS`. Sau khi seed xong, `lib/personalColorQuiz.ts` và mảng
`ARTICLES`/component `BlogFeaturedArticle` cũ bị xóa khỏi codebase (không giữ song song 2
nguồn dữ liệu).

## Error handling

- API ghi: validate input tối thiểu (title/question_text không rỗng, category thuộc danh
  sách hợp lệ, slug không trùng) → 400 kèm thông báo lỗi field-level nếu sai; 401 nếu thiếu/
  sai session admin.
- `/blog/[slug]` không tồn tại → `notFound()` (trang 404 chuẩn Next.js).
- Form admin hiển thị lỗi trả về từ API ngay dưới nút submit (theo đúng pattern
  `RegisterForm`/`LoginForm` đã có: 1 khối `<p>` màu `text-error` / `bg-error-container`).
- DB file không mở được (quyền ghi thư mục...) → lỗi ném ra ngay khi `lib/db.ts` được import
  lần đầu (fail fast, dễ phát hiện lúc khởi động server hơn là lỗi ngầm khi ghi).

## Testing

Theo đúng quy ước hiện tại (Vitest + Testing Library):

- `lib/db.test.ts` — CRUD cơ bản cho cả 2 loại dữ liệu trên 1 DB file tạm
  (`:memory:` hoặc file temp, dọn sau mỗi test).
- `lib/auth/session.test.ts` — ký/verify cookie hợp lệ, cookie sai chữ ký hoặc hết hạn bị
  từ chối.
- Route Handlers (`app/api/blog/route.test.ts`, v.v.) — test bằng cách gọi trực tiếp hàm
  `GET`/`POST` exported với một `Request` giả, assert status code + body; case thiếu session
  admin → 401.
- Admin form components (`BlogPostForm.test.tsx`, `QuizQuestionForm.test.tsx`) — submit hợp
  lệ gọi đúng API; lỗi validate hiển thị đúng thông báo.
- `BlogArticleGrid.test.tsx`/`BlogFeaturedArticle.test.tsx` cập nhật để nhận props thay vì
  đọc mảng cứng.
- `app/blog/[slug]/page.test.tsx` (mới) — render đúng nội dung khi slug tồn tại, `notFound`
  khi không.
