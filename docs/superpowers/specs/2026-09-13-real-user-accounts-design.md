# TwistFit — Tài khoản người dùng thật (Design)

## Context

Toàn bộ hệ thống đăng nhập/đăng ký hiện tại là giả lập:

- `lib/auth/mockAccounts.ts` — mảng cứng 2 tài khoản (`admin@twistfit.vn`/`admin1234`,
  `user@twistfit.vn`/`user1234`), so khớp email+mật khẩu bằng so sánh chuỗi thuần (không băm).
- `RegisterForm.tsx` — bấm "Đăng ký" chỉ hiện thông báo "tính năng đang hoàn thiện", **không
  lưu gì cả**.
- `AuthProvider.login()` hiện **đồng bộ**: tra thẳng `mockAccounts.ts` trong bộ nhớ, trả về
  ngay lập tức. `LoginForm.tsx` gọi hàm đồng bộ này trước, rồi gọi thêm 1 lần `fetch`
  riêng tới `/api/auth/login` chỉ để lấy cookie phiên đăng nhập ký (đã làm ở đợt CMS
  Blog/Quiz, xem `lib/auth/session.ts`) — 2 lệnh gọi tách rời cho cùng 1 hành động.

Mục tiêu đợt này: **thay tài khoản giả bằng tài khoản thật lưu trong SQLite**, để đăng
ký/đăng nhập hoạt động thật, và để dự án Diễn đàn (kế tiếp) có user thật để gắn tác giả bài
đăng. **Không làm màn quản trị user cho admin trong đợt này** (không có `/admin/users`,
không khoá/mở, không đổi vai trò qua UI — đã thống nhất với người dùng, có thể làm sau như
một đợt riêng).

## Goals

- Đăng ký tạo tài khoản thật trong SQLite, mật khẩu được băm (không lưu plaintext).
- Đăng nhập xác thực với tài khoản thật trong DB thay vì mảng cứng.
- Giữ nguyên 2 tài khoản demo hiện có (`admin@twistfit.vn`, `user@twistfit.vn`) bằng cách
  seed chúng vào bảng `users` — không phá vỡ lối vào demo đang dùng để test các CMS khác.
- `AuthProvider.login()` chuyển thành bất đồng bộ, gộp việc xác thực + lấy cookie phiên
  thành **một** lệnh gọi API duy nhất (dọn dẹp luôn 2 lệnh gọi tách rời hiện tại).
- Xoá `lib/auth/mockAccounts.ts` sau khi không còn ai dùng.

## Non-goals

- Không có trang quản trị danh sách user, khoá/mở tài khoản, đổi vai trò qua UI (roadmap
  riêng, làm sau).
- Không có trang tự sửa thông tin/đổi mật khẩu cho user thường.
- Không đổi cơ chế cookie phiên (`lib/auth/session.ts`) — vẫn ký HMAC như cũ, chỉ đổi nguồn
  tra cứu tài khoản đứng sau nó.
- Không có "quên mật khẩu" / gửi email xác nhận — ngoài phạm vi đợt này.
- Không giới hạn tốc độ đăng nhập (rate limiting) chống brute-force — ghi nhận là rủi ro biết
  trước, không phải phạm vi của một hệ thống demo/self-hosted quy mô nhỏ.

## Kho dữ liệu

Module mới `frontend/lib/auth/users.ts`, theo đúng khuôn các module CMS trước (types +
`initSchema` + CRUD + `seedIfEmpty`, nhận `db` làm tham số, không dùng singleton nội bộ),
wired vào `lib/getDb.ts`.

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

Băm mật khẩu bằng `node:crypto`'s `scryptSync` (có sẵn trong Node, không cần thêm thư viện
ngoài) — lưu dạng `"<salt hex>:<hash hex>"` trong `password_hash`. So sánh khi đăng nhập dùng
`timingSafeEqual` để tránh timing attack (cùng cách đã làm với chữ ký cookie ở
`lib/auth/session.ts`).

Hàm dự kiến:
- `initSchema(db)`, `seedIfEmpty(db)`
- `createUser(db, { name, email, password }): User` — luôn tạo với `role: 'user'` (đăng ký
  công khai không bao giờ tạo được admin); ném lỗi nếu email đã tồn tại (bắt ở lớp validate
  API để trả lỗi 400 rõ ràng, không để lỗi UNIQUE constraint rơi xuống người dùng).
- `verifyUserCredentials(db, email, password): User | null` — tra theo email, so mật khẩu
  đã băm, trả về `User` (không có `passwordHash`) nếu khớp, `null` nếu sai.
- `User` (kiểu trả ra ngoài, không có `passwordHash`) và `UserRow`/nội bộ có `passwordHash` —
  tách bạch để không bao giờ vô tình serialize password hash ra JSON response.

Seed 2 tài khoản demo hiện có (giữ nguyên email/mật khẩu để không phá lối vào demo đang test
các trang admin khác):
```
{ name: 'Người dùng Test', email: 'user@twistfit.vn', password: 'user1234', role: 'user' }
{ name: 'Quản trị viên Test', email: 'admin@twistfit.vn', password: 'admin1234', role: 'admin' }
```

## API routes

| Route | Method | Việc |
|---|---|---|
| `/api/auth/register` | POST | **Mới.** Nhận `{ name, email, password }`, validate, tạo user (role luôn `'user'`), trả 201 + `{ id, name, email, role }` (không có password hash). 400 nếu thiếu trường/email sai định dạng/mật khẩu quá ngắn. 409 nếu email đã tồn tại. |
| `/api/auth/login` | POST | **Sửa.** Đổi từ `findMockAccount` sang `verifyUserCredentials(getDb(), email, password)`. Body response đổi từ `{ email, role }` thành `{ name, email, role }` — bắt buộc phải có `name` vì `AuthProvider` giờ lấy toàn bộ thông tin user từ chính response này (xem phần Frontend). Cookie phiên (`createSessionCookieValue`) không đổi logic. |
| `/api/auth/logout` | POST | Không đổi. |

## Frontend — thay đổi hành vi (không chỉ nối API)

**`AuthProvider.login()` chuyển từ đồng bộ sang bất đồng bộ**, và trở thành nơi duy nhất gọi
`/api/auth/login`:

```ts
async function login(email: string, password: string): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/login', {
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
```

Đây là thay đổi hợp đồng (`login` từ trả `AuthUser | null` đồng bộ → `Promise<AuthUser |
null>`), ảnh hưởng tới mọi nơi gọi `login()`. Rà lại thấy chỉ có `LoginForm.tsx` gọi trực
tiếp — các trang admin khác (`BlogPostForm`, v.v.) không gọi `login()`, chỉ đọc `user` qua
`useAuth()`, nên không bị ảnh hưởng.

`LoginForm.tsx` rút gọn theo (không còn tự gọi `fetch` riêng nữa — `login()` đã làm hết):
```ts
async function handleSubmit(event) {
  event.preventDefault()
  const email = ...
  const password = ...
  const account = await login(email, password)
  if (!account) {
    setError(true)
    return
  }
  setError(false)
  router.push(account.role === 'admin' ? '/admin' : '/')
}
```

`RegisterForm.tsx` — bỏ khối "sắp ra mắt", gọi `/api/auth/register` thật, rồi gọi
`login(email, password)` (tái dùng nguyên vẹn, không viết lại logic đăng nhập) để tự đăng
nhập ngay sau khi đăng ký thành công, rồi điều hướng như `LoginForm`:
```ts
async function handleSubmit(event) {
  event.preventDefault()
  // ... check password === confirmPassword như hiện tại ...
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    setError(data.error === 'EMAIL_TAKEN' ? 'emailTaken' : 'generic')
    return
  }
  const account = await login(email, password)
  if (account) router.push(account.role === 'admin' ? '/admin' : '/')
}
```

`AuthUser` type (đã có sẵn trong `AuthProvider.tsx`) giữ nguyên `{ name, email, role }` —
không đổi, chỉ nguồn dữ liệu phía sau đổi.

## Di trú / dọn dẹp

- Xoá `frontend/lib/auth/mockAccounts.ts` và `frontend/lib/auth/mockAccounts.test.ts` sau khi
  `lib/auth/session.ts` (import `Role` từ đây) và `lib/auth/users.ts` (định nghĩa `Role` mới)
  đã tách bạch xong — `Role` chuyển sang định nghĩa trong `lib/auth/users.ts`,
  `lib/auth/session.ts` đổi import sang đó.
- Cập nhật `messages/vi.json`: thêm `Register.errors.emailTaken`,
  `Register.errors.generic`; xoá `Register.comingSoon` (không còn dùng).

## Error handling

- `/api/auth/register`: 400 (thiếu trường/định dạng sai), 409 (email đã tồn tại) — response
  dạng `{ error: 'EMAIL_TAKEN' }` để frontend map sang đúng chuỗi dịch, không hard-code tiếng
  Việt trong response API (nhất quán với cách các CMS trước trả `errors: Record<string,
  string>`, nhưng ở đây chỉ có 1 lỗi nghiệp vụ khả dĩ ngoài validate trường nên dùng mã lỗi
  đơn giản hơn là cả object field-errors).
- `/api/auth/login`: giữ nguyên 400 (thiếu email/mật khẩu) và 401 (sai thông tin) như hiện
  tại — chỉ đổi nguồn tra cứu.

## Testing

TDD từng bước như các CMS trước: viết test đỏ trước, code cho xanh. Vì `login()` đổi hợp
đồng (đồng bộ → bất đồng bộ), 3 file test hiện có phải viết lại phần gọi `login`:
`AuthProvider.test.tsx`, `LoginForm.test.tsx`, `RegisterForm.test.tsx` (RegisterForm chưa có
test thật, hiện chỉ test placeholder "sắp ra mắt"). Các test khác dựng sẵn user đăng nhập
bằng cách set thẳng `localStorage` (không gọi `login()`) — không bị ảnh hưởng, đã rà lại
danh sách và xác nhận không cần sửa.

Bắt buộc mở trình duyệt thật kiểm tra luồng đăng ký → tự đăng nhập → vào đúng trang theo vai
trò, và đăng nhập lại bằng 2 tài khoản demo cũ để xác nhận không bị mất lối vào — như mọi đợt
CMS trước, test suite xanh không đảm bảo hành vi thật đúng.
