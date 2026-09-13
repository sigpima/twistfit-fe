# TwistFit — Diễn đàn (Design)

## Context

Chưa có gì tồn tại: không bảng dữ liệu, không route, không trang. Đây là tính năng hoàn
toàn mới, xây trên nền tài khoản thật đã thiết kế ở
`docs/superpowers/specs/2026-09-13-real-user-accounts-design.md` (bảng `users`, cookie phiên
`twistfit_session`) — **Diễn đàn phải làm sau khi Tài khoản người dùng thật đã xong**, vì bài
đăng cần gắn với `user.id` thật, không phải 2 tài khoản demo hardcode.

Mục tiêu: cho phép người dùng đã đăng nhập đăng bài lên diễn đàn công khai, với hàng đợi
kiểm duyệt của admin (duyệt/từ chối/ẩn/xóa) và cơ chế báo cáo (report) bài vi phạm — đúng như
mô tả trong roadmap gốc: "kiểm duyệt cho admin (duyệt/ẩn/xóa, xử lý report)".

## Goals

- User đã đăng nhập đăng bài với tiêu đề + nội dung + 1 chuyên mục cố định.
- Bài đăng mới luôn ở trạng thái **chờ duyệt** — chỉ hiển thị công khai sau khi admin duyệt.
- User tự sửa/xóa bài của chính mình. **Sửa bài đã duyệt/bị từ chối sẽ đưa bài về lại trạng
  thái chờ duyệt** (chặn việc né kiểm duyệt bằng cách đăng nội dung vô hại rồi sửa lại sau).
- User đã đăng nhập report 1 bài kèm lý do.
- Admin có hàng đợi bài chờ duyệt (duyệt/từ chối) và hàng đợi report (xem/đánh dấu đã xử lý).
  Admin có thể ẩn bài đã duyệt hoặc xóa hẳn bất kỳ bài nào.
- Trang diễn đàn công khai: danh sách bài đã duyệt, lọc theo chuyên mục.

## Non-goals

- Không có bình luận/trả lời bài đăng — chỉ bài đăng độc lập (đã chốt lúc brainstorm).
- Không có like/vote, không có thông báo (notification) khi bài được duyệt/bị report.
- Report không tự động ẩn bài — admin luôn tự quyết định hành động (ẩn/xóa) sau khi xem report,
  đánh dấu report "đã xử lý" là một hành động độc lập với việc xử lý bài viết.
- Không có lý do report dạng danh sách cố định — chỉ 1 ô nhập lý do dạng văn bản tự do, giữ
  đơn giản tối đa cho đợt đầu.
- Không cho phép admin sửa nội dung bài của user — admin chỉ đổi trạng thái (duyệt/từ
  chối/ẩn) hoặc xóa, không chỉnh sửa chữ nghĩa.

## Kho dữ liệu

Module mới `frontend/lib/forum.ts`, theo đúng khuôn CRUD của các module trước (types +
`initSchema` + CRUD + `seedIfEmpty`), wired vào `lib/getDb.ts` sau bước `users`.

Chuyên mục là hằng số cấp ứng dụng (giống `BlogCategory`/`BLOG_CATEGORIES` trong `lib/db.ts`),
**không phải bảng riêng** — nhất quán với cách Blog đang làm:

```ts
export type ForumCategory =
  | 'general'
  | 'outfit-showcase'
  | 'styling-help'
  | 'personal-color'
  | 'sustainable-swap'
export const FORUM_CATEGORIES: ForumCategory[] = [
  'general',
  'outfit-showcase',
  'styling-help',
  'personal-color',
  'sustainable-swap',
]
```

```sql
CREATE TABLE forum_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'published' | 'rejected' | 'hidden'
  author_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE forum_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',     -- 'open' | 'resolved'
  created_at TEXT NOT NULL
);
```

Vòng đời `status` của `forum_posts`:
- Tạo mới → luôn `pending`.
- Admin duyệt: `pending` → `published`.
- Admin từ chối: `pending` → `rejected`.
- Admin ẩn (thường sau khi có report): `published` → `hidden`.
- Owner sửa nội dung bài (`PUT`): **bất kể trạng thái hiện tại**, đưa về `pending`.
- Admin xóa (`DELETE`): xóa hẳn dòng khỏi bảng, ở bất kỳ trạng thái nào. Report liên quan bị
  xóa theo (`ON DELETE CASCADE`).

Không seed dữ liệu mẫu cho `forum_posts`/`forum_reports` — khác với các CMS trước (Blog, FAQ,
Team...), nội dung diễn đàn hợp lý hơn khi để trống, chờ user thật đăng bài; `seedIfEmpty` vẫn
được định nghĩa (để khớp khuôn module chuẩn và không phá logic gọi tuần tự trong
`getDb.ts`) nhưng thân hàm không làm gì (no-op), có comment giải thích lý do.

## Auth — 1 thay đổi nhỏ trong `lib/auth/session.ts`

Hiện tại `session.ts` chỉ có `getAdminSessionFromCookieHeader` (đòi `role === 'admin'`). Đăng
bài/report chỉ cần đăng nhập, không cần admin, nên cần thêm 1 hàm tổng quát hơn:

```ts
export function getSessionFromCookieHeader(cookieHeader: string | null): SessionPayload | null {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
  if (!match) return null
  const rawValue = match.slice(SESSION_COOKIE_NAME.length + 1)
  return verifySessionCookieValue(decodeURIComponent(rawValue))
}

export function getAdminSessionFromCookieHeader(cookieHeader: string | null): SessionPayload | null {
  const session = getSessionFromCookieHeader(cookieHeader)
  return session?.role === 'admin' ? session : null
}
```

`SessionPayload` chỉ có `{ email, role, exp }`, không có `id` số. Mọi route Diễn đàn cần
`author_id`/`reporter_id` sẽ tự tra `id` từ `email` bằng `getUserByEmail(getDb(), email)`
(hàm đã có sẵn theo spec Tài khoản người dùng thật) ngay trong route handler — không đổi định
dạng cookie.

## API routes

| Route | Method | Quyền | Việc |
|---|---|---|---|
| `/api/forum/posts` | GET | Công khai | Danh sách bài `status = 'published'`, lọc tùy chọn `?category=`. |
| `/api/forum/posts` | POST | Đã đăng nhập | Tạo bài, `status` luôn `'pending'`, `authorId` lấy từ session. 400 nếu thiếu trường/chuyên mục không hợp lệ. |
| `/api/forum/posts/mine` | GET | Đã đăng nhập | Bài của chính mình, mọi trạng thái, mới nhất trước. |
| `/api/forum/posts/[id]` | GET | Công khai/Owner/Admin | Nếu `published` → ai cũng xem được. Nếu không → chỉ owner hoặc admin xem được, còn lại 404 (không lộ việc bài tồn tại). |
| `/api/forum/posts/[id]` | PUT | Owner | Sửa `title`/`body`/`category` bài của chính mình → `status` về `'pending'`. 403 nếu không phải chủ bài. |
| `/api/forum/posts/[id]` | PATCH | Admin | Đổi `status` (`published`/`rejected`/`hidden`) theo body `{ status }`. 400 nếu chuyển trạng thái không hợp lệ (vd `hidden` → `published` không được phép qua route này — dùng để "un-hide" không nằm trong phạm vi đợt này). |
| `/api/forum/posts/[id]` | DELETE | Owner hoặc Admin | Owner xóa bài mình; Admin xóa bất kỳ bài nào. |
| `/api/forum/posts/[id]/report` | POST | Đã đăng nhập | Tạo report với `{ reason }`. 400 nếu thiếu lý do. 404 nếu bài không tồn tại/không xem được. |
| `/api/forum/moderation/pending` | GET | Admin | Danh sách bài `status = 'pending'`, cũ nhất trước (xếp hàng theo thứ tự đăng). |
| `/api/forum/moderation/reports` | GET | Admin | Danh sách report `status = 'open'`, kèm thông tin bài (`postId`, `postTitle`, `postStatus`). |
| `/api/forum/reports/[id]` | PATCH | Admin | Đánh dấu report `status = 'resolved'`. |

Quy tắc chuyển trạng thái hợp lệ cho `PATCH /api/forum/posts/[id]`: `pending → published`,
`pending → rejected`, `published → hidden`. Mọi cặp khác trả 400.

## Frontend

**Trang công khai:**
- `/forum` — danh sách bài `published`, bộ lọc chuyên mục (client fetch `GET
  /api/forum/posts`), giống cấu trúc lọc đã có ở `/blog`.
- `/forum/[id]` — trang chi tiết 1 bài. Nếu API trả 404 (bài không tồn tại hoặc không có
  quyền xem) → hiển thị trạng thái "không tìm thấy bài viết".

**Trang cần đăng nhập (không cần admin) — dùng gate mới `AuthGate`:**
- `components/auth/AuthGate.tsx` — bản rút gọn của `AdminGate.tsx`, chỉ đòi `user` tồn tại
  (không kiểm tra `role`), điều hướng `/login` nếu chưa đăng nhập.
- `/forum/new` — form tạo bài (tiêu đề, chuyên mục dạng `<select>`, nội dung dạng textarea).
  Tạo xong điều hướng tới `/forum/my-posts` (không phải `/forum/[id]` vì bài mới luôn
  `pending`, chưa xem công khai được).
- `/forum/my-posts` — danh sách bài của chính mình (mọi trạng thái) kèm nhãn trạng thái
  (Chờ duyệt / Đã duyệt / Bị từ chối / Đã ẩn), nút Sửa/Xóa.
- `/forum/[id]/edit` — sửa bài của chính mình; nếu không phải chủ bài, điều hướng về
  `/forum/my-posts`.

**Trang admin — dùng `AdminGate` sẵn có:**
- `/admin/forum` — 2 khu vực trên cùng 1 trang: "Bài chờ duyệt" (danh sách, mỗi bài có nút
  Duyệt/Từ chối) và "Báo cáo" (danh sách report đang mở, mỗi dòng có link tới bài viết và nút
  Đánh dấu đã xử lý). Bài đã duyệt muốn ẩn/xóa được thao tác ngay trong khu vực "Báo cáo" (vì
  đó là nơi admin phát hiện vi phạm), không cần thêm 1 danh sách "tất cả bài" riêng — giữ
  đúng phạm vi roadmap, không mở rộng quá tay.
- Thêm 1 thẻ liên kết mới vào `AdminDashboard.tsx` trỏ tới `/admin/forum`.

## Chia thực thi thành 2 plan

Vì phạm vi lớn hơn hẳn 1 loại CMS đơn (nhiều trạng thái, quyền sở hữu, report), chia làm 2 plan
kế tiếp nhau:

1. **Đăng bài công khai** — `lib/forum.ts`, đổi `session.ts`, API `posts`/`posts/mine`/`posts/[id]`
   (GET/PUT/DELETE cho owner), trang `/forum`, `/forum/[id]`, `/forum/new`, `/forum/my-posts`,
   `/forum/[id]/edit`, `AuthGate`. Xong plan này, user có thể đăng/sửa/xóa bài — nhưng bài
   không bao giờ hiển thị công khai được (vì chưa có ai duyệt).
2. **Kiểm duyệt admin + report** — API `PATCH posts/[id]` (đổi trạng thái), `posts/[id]/report`,
   `moderation/pending`, `moderation/reports`, `reports/[id]`, trang `/admin/forum`. Xong plan
   này, luồng mới hoàn chỉnh đầu-cuối.

## Error handling

- `/api/forum/posts` POST: 400 field-errors (`title`, `body`, `category`) theo đúng khuôn
  `validateXBody` các CMS trước (`{ errors: Record<string, string> }`).
- `/api/forum/posts/[id]` PUT/DELETE/PATCH: 401 nếu chưa đăng nhập, 403 nếu đăng nhập nhưng
  không đủ quyền (không phải owner với PUT/DELETE, không phải admin với PATCH), 404 nếu id
  không tồn tại.
- `/api/forum/posts/[id]/report` POST: 401 nếu chưa đăng nhập, 400 nếu thiếu `reason`, 404 nếu
  bài không tồn tại/không xem được.

## Testing

TDD từng bước như mọi module trước: `lib/forum.test.ts` (CRUD + chuyển trạng thái +
`getSessionFromCookieHeader`), test cho từng route API (mock `@/lib/getDb` với DB `:memory:`,
dựng cookie qua `createSessionCookieValue`), test component cho `AuthGate`, các trang
`/forum/*` và `/admin/forum`.

Bắt buộc kiểm tra bằng trình duyệt thật sau khi cả 2 plan xong: đăng nhập user thường → đăng
bài → xác nhận **không** thấy ở `/forum` công khai → đăng nhập admin → duyệt bài ở
`/admin/forum` → xác nhận bài xuất hiện ở `/forum` → đăng nhập lại user thường → sửa bài đã
duyệt → xác nhận bài biến mất khỏi `/forum` (quay về `pending`) → report 1 bài (dùng tài khoản
demo còn lại) → đăng nhập admin → xác nhận report xuất hiện ở `/admin/forum`, đánh dấu đã xử
lý, thử ẩn bài và xác nhận bài biến mất khỏi `/forum`.
