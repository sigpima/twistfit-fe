# TwistFit — Hộp thư liên hệ (Design)

## Context

Form liên hệ ở trang chủ (`frontend/components/home/ContactSection.tsx`) hiện **không lưu gì
cả**: `handleSubmit` chỉ gọi `setSubmitted(true)` rồi `event.currentTarget.reset()` — không có
`fetch` nào, các input còn không có thuộc tính `name` nên không thể đọc giá trị qua
`FormData`/`form.elements`. Không có bảng dữ liệu, route API, hay trang admin nào liên quan đến
liên hệ tồn tại trong dự án.

Đây là subproject đầu (1/2) của hạng mục "Dashboard thống kê / Hộp thư liên hệ" còn lại trong
roadmap — làm trước vì Dashboard thống kê (subproject 2) sẽ hiển thị số tin nhắn mới từ chính
bảng dữ liệu subproject này tạo ra.

## Goals

- Form liên hệ lưu thật vào SQLite khi submit, không còn là hành động giả.
- Admin có trang xem danh sách tin nhắn, xem chi tiết, đánh dấu đã đọc/chưa đọc, xóa.
- Không cần đăng nhập để gửi liên hệ — giữ nguyên trải nghiệm khách vãng lai hiện tại.

## Non-goals

- Không gửi email thông báo cho admin hoặc trả lời cho người gửi — hệ thống chưa có hạ tầng
  email, ngoài phạm vi đợt này.
- Không giới hạn tốc độ gửi (rate limiting) chống spam — cùng lý do đã áp dụng cho đăng
  ký/đăng nhập: rủi ro biết trước, chấp nhận được với quy mô demo/self-hosted hiện tại.
- Không có tìm kiếm/lọc/phân trang trong danh sách tin nhắn — số lượng tin nhắn liên hệ thực tế
  sẽ nhỏ, danh sách đơn giản là đủ; có thể bổ sung sau nếu cần.

## Kho dữ liệu

Module mới `frontend/lib/contact.ts`, theo đúng khuôn CRUD của các module trước (types +
`initSchema` + CRUD + không seed dữ liệu mẫu — lý do giống Diễn đàn: tin nhắn liên hệ chỉ có ý
nghĩa khi là tin thật, để trống lúc khởi tạo), wired vào `lib/getDb.ts` sau `forum.ts` (cuối
chuỗi hiện tại).

```ts
export type ContactSubject = 'color-test' | 'virtual-fitting' | 'stylist' | 'other'
export const CONTACT_SUBJECTS: ContactSubject[] = ['color-test', 'virtual-fitting', 'stylist', 'other']
```

```sql
CREATE TABLE contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
```

Hàm dự kiến: `initSchema(db)`, `getContactMessages(db)` (mới nhất trước), `getContactMessageById(db,
id)`, `createContactMessage(db, input)` (luôn tạo với `isRead: false`), `setContactMessageRead(db,
id, isRead)`, `deleteContactMessage(db, id)`.

## API routes

| Route | Method | Quyền | Việc |
|---|---|---|---|
| `/api/contact` | POST | Công khai | Tạo tin nhắn. 400 nếu thiếu `name`/`message`, email sai định dạng, hoặc `subject` không thuộc `CONTACT_SUBJECTS`. `phone` tùy chọn. |
| `/api/contact` | GET | Admin | Danh sách toàn bộ tin nhắn, mới nhất trước. |
| `/api/contact/[id]` | PATCH | Admin | Đổi `isRead` theo body `{ isRead: boolean }`. 404 nếu không tồn tại. |
| `/api/contact/[id]` | DELETE | Admin | Xóa tin nhắn. 404 nếu không tồn tại. |

## Frontend

**`ContactSection.tsx`** — thêm thuộc tính `name` cho từng input (`name`, `email`, `phone`,
`subject`, `message` — hiện tại chưa có, chỉ có `id`), đổi `handleSubmit` thành bất đồng bộ,
đọc giá trị qua `form.elements.namedItem(...)` (cùng cách `LoginForm`/`RegisterForm` đang làm),
gọi `POST /api/contact`:

```ts
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const form = event.currentTarget
  const body = {
    name: (form.elements.namedItem('name') as HTMLInputElement).value,
    email: (form.elements.namedItem('email') as HTMLInputElement).value,
    phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
    subject: (form.elements.namedItem('subject') as HTMLSelectElement).value,
    message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
  }

  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    setSubmitted(false)
    setError(true)
    return
  }

  setError(false)
  setSubmitted(true)
  form.reset()
}
```

Thêm state `error` và hiển thị `t('errorMessage')` cạnh nút gửi khi `error === true` (thay chỗ
`successMessage` hiện đang hiển thị theo điều kiện `submitted`).

**`/admin/contact`** (mới, `AdminGate`): `ContactMessageList` — danh sách tin nhắn (tên, chủ
đề, thời gian, dấu hiệu nổi bật nếu chưa đọc), bấm vào xem toàn bộ nội dung + email/phone, nút
"Đánh dấu đã đọc"/"Đánh dấu chưa đọc" (tùy trạng thái hiện tại), nút "Xóa" (có xác nhận
`window.confirm`, cùng khuôn các trang admin khác). Thêm 1 thẻ liên kết vào `AdminDashboard.tsx`.

## Error handling

- `/api/contact` POST: 400 với `{ errors: Record<string, string> }` theo đúng khuôn
  `validateXBody` các module trước.
- `/api/contact` GET, `/api/contact/[id]` PATCH/DELETE: 401 nếu thiếu phiên admin hợp lệ
  (`getAdminSessionFromCookieHeader`), 404 nếu id không tồn tại (PATCH/DELETE).

## Testing

TDD từng bước như mọi module trước: `lib/contact.test.ts`, test cho từng route API (mock
`@/lib/getDb` với DB `:memory:`), test cho `ContactSection.tsx` (POST thành công/thất bại), test
cho `ContactMessageList`/`/admin/contact`.

Bắt buộc kiểm tra bằng trình duyệt thật: gửi form liên hệ ở trang chủ (không đăng nhập) →
đăng nhập admin → `/admin/contact` thấy tin nhắn vừa gửi, đánh dấu đã đọc, xóa thử 1 tin.
