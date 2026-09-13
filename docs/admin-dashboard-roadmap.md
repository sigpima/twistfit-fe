# Trang Admin — Khảo sát & Đề xuất

_Ghi lại ngày 2026-09-13. Đây là ghi chú sống, cập nhật khi phạm vi thay đổi — không phải spec kỹ thuật cố định (spec kỹ thuật cho từng hạng mục nằm ở `docs/superpowers/specs/`)._

## Bối cảnh

Trang `/admin` hiện chỉ là khung trống có bảo vệ đăng nhập (`AdminGate` + `AdminDashboard`
placeholder), dựng cùng lúc với hệ thống đăng nhập/đăng ký mock (2 tài khoản test, xem
`frontend/lib/auth/mockAccounts.ts`). Backend (`backend/main.py`) mới chỉ là khung FastAPI
rỗng — chưa có database, chưa có API nào. Mọi nội dung hiển thị trên site (blog, câu hỏi
quiz, FAQ, catalog người mẫu, v.v.) hiện đang là mảng dữ liệu cứng trong code.

## Diễn đàn vs Blog

- **Blog**: bài viết do admin biên tập, một chiều (admin viết → user đọc).
- **Diễn đàn**: bài do user (và admin) tự đăng — cần thêm giao diện *đăng bài* cho user,
  và công cụ *kiểm duyệt* cho admin (duyệt/ẩn/xóa, xử lý report) — việc Blog không cần.
- Diễn đàn chưa được đưa vào phạm vi ngay; ghi nhận ở đây để làm sau.

## Hai việc bắt đầu trước (ưu tiên hiện tại)

### 1. Quản lý blog

Hiện trạng trong code:
- `components/blog/BlogArticleGrid.tsx` — mảng `ARTICLES` cứng, 6 bài, fields: id, image,
  alt, category, badge, badgeColor, date, title, description, views.
- `components/blog/BlogFeaturedArticle.tsx` — 1 bài "nổi bật" viết **inline JSX riêng**,
  cấu trúc **khác hẳn** bài thường (thêm author name/initials/role).
- **Chưa có trang chi tiết bài viết** — không có route `/blog/[slug]`, nút "Đọc ngay" trỏ `#`.

→ "Quản lý blog" cần giải quyết cả: (a) hợp nhất cấu trúc dữ liệu bài viết (bỏ phân biệt
"featured" khác cấu trúc), (b) trang chi tiết bài viết, (c) màn CRUD cho admin.

### 2. Quản lý câu hỏi quiz (Personal Color test)

- `lib/personalColorQuiz.ts` — mảng `QUIZ_QUESTIONS`, 5 câu, mỗi câu: `id`, `question`,
  `options[]` (4 lựa chọn/câu, mỗi lựa chọn có `label` + `season` warm/cool/neutral...).
  File này **tự ghi chú trong code** là "Demo quiz config — placeholder cho đến khi có bộ
  câu hỏi thật được cấu hình" → xác nhận việc này đã được tính trước, nên làm sớm.
- Điểm số/logic quy về mùa (season) nằm riêng ở `lib/computeSeasonResult.ts`.

## Đề xuất thêm (sau khi rà toàn bộ site)

**Nội dung tĩnh rõ ràng nên đưa vào admin** (đang hardcode, sửa phải deploy lại):
- FAQ (`FaqSection.tsx`) — lưu ý phần trả lời hiện là JSX lồng thẻ, không phải text thuần,
  cần đổi sang rich-text/markdown để admin sửa qua form được.
- Catalog người mẫu thử đồ (`ModelCatalog.tsx`, 11 người mẫu, nhiều thuộc tính: tone da,
  dáng người, vòng eo...).
- Set đồ gợi ý / Capsule wardrobe (`CapsuleWardrobe.tsx`) — thực chất là catalog sản phẩm
  **có giá tiền**.
- Team members (trang About, `TeamGrid.tsx`).

**Gắn liền với hệ thống đăng nhập vừa dựng:**
- Quản lý người dùng — danh sách tài khoản, khóa/mở, đổi vai trò user↔admin.
- Kiểm duyệt Diễn đàn (xem mục trên) — khi diễn đàn được xây.

**Vận hành, ít cấp bách hơn:**
- Dashboard thống kê (lượt làm quiz, bài viết/bài diễn đàn mới, user mới).
- Hộp thư liên hệ — form ở `ContactSection.tsx` hiện **không gửi đi đâu cả** (chỉ set state
  ẩn trên UI, không có backend nhận), nếu nối vào backend thì admin cần chỗ xem tin nhắn.

## Trạng thái

| Hạng mục | Trạng thái |
|---|---|
| Quản lý Blog | ✅ Hoàn thành |
| Quản lý câu hỏi Quiz | ✅ Hoàn thành |
| FAQ / Catalog người mẫu / Capsule wardrobe / Team | ✅ Hoàn thành |
| Đăng ký/Đăng nhập tài khoản thật | ✅ Hoàn thành (quản lý user cho admin — khóa/mở, đổi vai trò — vẫn chưa làm, xem `docs/superpowers/specs/2026-09-13-real-user-accounts-design.md`) |
| Diễn đàn (đăng bài + kiểm duyệt) | ✅ Hoàn thành |
| Dashboard thống kê / Hộp thư liên hệ | ✅ Hoàn thành |
