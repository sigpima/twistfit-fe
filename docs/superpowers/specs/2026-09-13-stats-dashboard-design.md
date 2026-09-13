# TwistFit — Dashboard thống kê (Design)

## Context

Đây là subproject cuối (2/2) của hạng mục "Dashboard thống kê / Hộp thư liên hệ" — hạng mục
cuối cùng còn lại trong `docs/admin-dashboard-roadmap.md`. Hộp thư liên hệ (1/2) đã xong,
bảng `contact_messages` (có cột `is_read`) đã có sẵn.

Không có hạ tầng thống kê nào tồn tại: `AdminDashboard.tsx` hiện chỉ là lưới thẻ liên kết đến
các trang quản lý, không có số liệu nào. Đặc biệt, **lượt làm quiz Personal Color hiện không
được lưu ở đâu cả** — `QuizFlow.tsx` gọi `computeSeasonResult(finalAnswers)` nhưng **vứt bỏ giá
trị trả về**, rồi điều hướng thẳng sang `/personal-color/result` mà không lưu gì vào DB. Đây là
lý do subproject này phải xây thêm cơ chế theo dõi lượt làm quiz từ đầu, trước khi có số liệu để
gộp vào dashboard.

## Goals

- Ghi lại mỗi lượt hoàn thành quiz Personal Color: kết quả season, thời điểm, và `user_id` nếu
  người làm đang đăng nhập (không bắt buộc đăng nhập để làm quiz — giữ nguyên hành vi hiện tại).
- Trang `/admin` hiển thị 5 số liệu tổng quan ngay phía trên lưới thẻ quản lý hiện có: bài viết
  Blog, bài viết Diễn đàn, người dùng, lượt làm quiz (mỗi mục kèm số phát sinh trong 30 ngày gần
  nhất), và tin nhắn liên hệ (tổng số + số chưa đọc).

## Non-goals

- Không sửa lỗi có sẵn "kết quả quiz không được truyền sang trang `/personal-color/result`" —
  đây là lỗi hiển thị không liên quan đến việc ghi nhận lượt làm quiz cho mục đích thống kê,
  nằm ngoài phạm vi đợt này.
- Không có biểu đồ/xu hướng theo thời gian, không có trang thống kê chi tiết riêng — chỉ số
  tổng quan dạng thẻ nhỏ, đặt ngay trên `/admin` hiện có, không tạo trang mới.
- Không phân biệt trạng thái bài diễn đàn khi đếm (tính mọi bài diễn đàn được tạo, không phân
  biệt `pending`/`published`/`rejected`/`hidden`) — phản ánh tổng hoạt động tạo bài, không phải
  chỉ nội dung đã duyệt.
- Không giới hạn tốc độ ghi lượt làm quiz (rate limiting) — cùng lý do đã áp dụng cho các API
  công khai khác trong dự án.

## Theo dõi lượt làm quiz

Module mới `frontend/lib/quizAttempts.ts`, theo khuôn CRUD tối giản (chỉ cần tạo + đếm, không
cần sửa/xóa), không seed dữ liệu mẫu (lý do giống `forum_posts`/`contact_messages`).

```sql
CREATE TABLE quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  season TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
```

`season` dùng lại type `Season` đã có ở `lib/db.ts` (`'spring' | 'summer' | 'autumn' |
'winter'`), không định nghĩa lại. Hàm dự kiến: `initSchema(db)`, `createQuizAttempt(db, season,
userId)`, `getQuizAttemptsCount(db)`, `getNewQuizAttemptsCount(db, sinceIso)`, `seedIfEmpty(db)`
(no-op).

**API mới** `POST /api/quiz-attempts` — công khai, không yêu cầu đăng nhập. Body `{ season }`,
400 nếu `season` không thuộc `SEASONS`. Nếu request có cookie phiên hợp lệ
(`getSessionFromCookieHeader`), tra `user_id` qua `getUserByEmail`; nếu không, lưu `user_id =
null`. Trả 201.

**Thay đổi `QuizFlow.tsx`**: `handleAdvance` giữ nguyên toàn bộ logic hiện tại, chỉ thêm — ngay
sau khi tính được `season` từ `computeSeasonResult(finalAnswers)` (giờ được gán vào biến thay vì
vứt bỏ) — một lệnh gọi `fetch('/api/quiz-attempts', ...)` **fire-and-forget** (không `await`,
có `.catch(() => {})`), cùng cách `AuthProvider.logout()` đang gọi `/api/auth/logout` — việc ghi
nhận thống kê không được làm chậm hoặc chặn trải nghiệm chuyển trang của người dùng.

## Gộp số liệu

Module mới `frontend/lib/stats.ts`, hàm duy nhất `getAdminStats(db): AdminStats`:

```ts
export type AdminStats = {
  blogPosts: { total: number; new30d: number }
  forumPosts: { total: number; new30d: number }
  users: { total: number; new30d: number }
  quizAttempts: { total: number; new30d: number }
  contactMessages: { total: number; unread: number }
}
```

Mỗi field lấy từ 1-2 câu `SELECT COUNT(*)` tĩnh (không nội suy tên bảng vào chuỗi SQL, kể cả
khi tên bảng không đến từ input bên ngoài — tránh xây SQL động không cần thiết) nhắm thẳng vào
bảng tương ứng (`blog_posts`, `forum_posts`, `users`, `quiz_attempts`, `contact_messages`), cắt
mốc `new30d` bằng `created_at >= ?` với tham số là `new Date(Date.now() - 30 * 86400000).toISOString()`.
`contactMessages.unread` lọc thêm `WHERE is_read = 0`.

**API mới** `GET /api/admin/stats` — chỉ admin (`getAdminSessionFromCookieHeader`), trả về
`AdminStats` ở trên.

## Frontend

Component mới `components/admin/AdminStatsOverview.tsx` — fetch `GET /api/admin/stats`, hiển
thị 5 thẻ nhỏ dạng lưới (Blog, Diễn đàn, Người dùng, Lượt làm quiz, Tin nhắn liên hệ). Bốn thẻ
đầu hiện `{total}` lớn kèm dòng phụ "+{new30d} trong 30 ngày qua"; thẻ Tin nhắn liên hệ hiện
`{total}` kèm dòng phụ "{unread} chưa đọc" thay vì mốc 30 ngày. Các thẻ chỉ mang tính thông tin,
không phải link (điều hướng vẫn qua lưới thẻ quản lý bên dưới, giữ đúng vai trò hiện có của các
thẻ đó).

**`AdminDashboard.tsx`**: chèn `<AdminStatsOverview />` ngay sau dòng chào (`{t('welcome', ...)}`)
và trước lưới `<Link>` hiện có, trong cùng khối `rounded-3xl bg-surface-container-lowest` — không
tạo trang riêng, không đổi cấu trúc lưới thẻ quản lý.

## Error handling

- `POST /api/quiz-attempts`: 400 nếu `season` thiếu hoặc không hợp lệ. Không có lỗi 401 — endpoint
  công khai.
- `GET /api/admin/stats`: 401 nếu thiếu phiên admin hợp lệ.
- `AdminStatsOverview` không cần xử lý lỗi hiển thị đặc biệt khi fetch thất bại — theo khuôn các
  danh sách admin khác, chỉ hiện trạng thái "Đang tải..." cho đến khi có dữ liệu (không có timeout
  hiển thị lỗi riêng, vì đây chỉ là thông tin phụ trợ trên trang đã có `AdminGate` bảo vệ).

## Testing

TDD từng bước như mọi module trước: `lib/quizAttempts.test.ts`, `lib/stats.test.ts` (dựng DB
`:memory:` với nhiều bảng, chèn dữ liệu ở các mốc thời gian khác nhau để kiểm tra `new30d`), test
route cho `POST /api/quiz-attempts` (có/không cookie phiên) và `GET /api/admin/stats` (401/200),
test cho `AdminStatsOverview` (fetch + hiển thị đúng số) và `QuizFlow.tsx` (xác nhận gọi đúng
`fetch` với `season` tính được, xác nhận vẫn điều hướng sang trang kết quả kể cả khi fetch thất
bại — do không `await`).

Bắt buộc kiểm tra bằng trình duyệt thật: làm thử quiz Personal Color (ẩn danh, chưa đăng nhập)
→ vào `/admin` xác nhận số "Lượt làm quiz" tăng 1 và "+1 trong 30 ngày qua" hiện đúng → đăng
nhập rồi làm lại quiz → xác nhận vẫn tăng đúng (không kiểm tra được `user_id` qua UI, chỉ xác
nhận số đếm đúng) → gửi 1 tin nhắn liên hệ → xác nhận số tin nhắn chưa đọc trên dashboard tăng
đúng → tạo 1 bài blog/forum mới → xác nhận số liệu tương ứng cập nhật.
