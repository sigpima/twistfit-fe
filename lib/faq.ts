import type Database from 'better-sqlite3'

export type FaqCategory = 'personal-color' | 'fitting-room' | 'account' | 'stylist'
export const FAQ_CATEGORIES: FaqCategory[] = ['personal-color', 'fitting-room', 'account', 'stylist']

export type FaqHighlightIcon =
  | 'palette'
  | 'wb_sunny'
  | 'face_retouching_off'
  | 'center_focus_strong'
  | 'qr_code_scanner'
  | 'verified_user'
  | 'info'
  | 'lightbulb'

export const FAQ_HIGHLIGHT_ICONS: FaqHighlightIcon[] = [
  'palette',
  'wb_sunny',
  'face_retouching_off',
  'center_focus_strong',
  'qr_code_scanner',
  'verified_user',
  'info',
  'lightbulb',
]

export type FaqItem = {
  id: number
  categories: FaqCategory[]
  question: string
  answerMarkdown: string
  highlightIcon: FaqHighlightIcon | null
  highlightText: string | null
  createdAt: string
  updatedAt: string
}

export type FaqItemInput = {
  categories: FaqCategory[]
  question: string
  answerMarkdown: string
  highlightIcon: FaqHighlightIcon | null
  highlightText: string | null
}

type FaqItemRow = {
  id: number
  categories: string
  question: string
  answer_markdown: string
  highlight_icon: string | null
  highlight_text: string | null
  created_at: string
  updated_at: string
}

function rowToFaqItem(row: FaqItemRow): FaqItem {
  return {
    id: row.id,
    categories: JSON.parse(row.categories) as FaqCategory[],
    question: row.question,
    answerMarkdown: row.answer_markdown,
    highlightIcon: row.highlight_icon as FaqHighlightIcon | null,
    highlightText: row.highlight_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS faq_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categories TEXT NOT NULL,
      question TEXT NOT NULL,
      answer_markdown TEXT NOT NULL,
      highlight_icon TEXT,
      highlight_text TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getFaqItems(db: Database.Database): FaqItem[] {
  const rows = db.prepare('SELECT * FROM faq_items ORDER BY id ASC').all() as FaqItemRow[]
  return rows.map(rowToFaqItem)
}

export function getFaqItemById(db: Database.Database, id: number): FaqItem | null {
  const row = db.prepare('SELECT * FROM faq_items WHERE id = ?').get(id) as FaqItemRow | undefined
  return row ? rowToFaqItem(row) : null
}

export function createFaqItem(db: Database.Database, input: FaqItemInput): FaqItem {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO faq_items (categories, question, answer_markdown, highlight_icon, highlight_text, created_at, updated_at)
       VALUES (@categories, @question, @answerMarkdown, @highlightIcon, @highlightText, @createdAt, @updatedAt)`
    )
    .run({
      categories: JSON.stringify(input.categories),
      question: input.question,
      answerMarkdown: input.answerMarkdown,
      highlightIcon: input.highlightIcon,
      highlightText: input.highlightText,
      createdAt: now,
      updatedAt: now,
    })
  const created = getFaqItemById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created FAQ item')
  }
  return created
}

export function updateFaqItem(db: Database.Database, id: number, input: FaqItemInput): FaqItem | null {
  const existing = getFaqItemById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE faq_items SET
      categories = @categories, question = @question, answer_markdown = @answerMarkdown,
      highlight_icon = @highlightIcon, highlight_text = @highlightText, updated_at = @updatedAt
     WHERE id = @id`
  ).run({
    id,
    categories: JSON.stringify(input.categories),
    question: input.question,
    answerMarkdown: input.answerMarkdown,
    highlightIcon: input.highlightIcon,
    highlightText: input.highlightText,
    updatedAt: now,
  })
  return getFaqItemById(db, id)
}

export function deleteFaqItem(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM faq_items WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_FAQ_ITEMS: FaqItemInput[] = [
  {
    categories: ['personal-color'],
    question: 'Personal Color Test trên TwistFit hoạt động như thế nào qua camera?',
    answerMarkdown:
      'Thuật toán độc quyền của TwistFit tích hợp mô hình thị giác máy tính chuyên sâu để phân tích phổ màu tự nhiên của khuôn mặt bạn theo thời gian thực.\n\n- **Định vị sắc tố:** Tách nền và nhận diện độ sáng, độ bão hòa trên da, mắt và viền môi.\n- **Đối soát Undertone:** Kiểm tra mức độ phản ứng quang phổ giữa Warm (ấm) và Cool (lạnh).\n- **Phân nhóm 16 sắc độ:** Phân loại chi tiết theo hệ 4 mùa kinh điển.',
    highlightIcon: 'palette',
    highlightText: 'Quy trình 3 bước cốt lõi.',
  },
  {
    categories: ['personal-color'],
    question: 'Tôi cần chuẩn bị điều kiện ánh sáng và góc chụp thế nào để kết quả chính xác nhất?',
    answerMarkdown:
      'Độ chính xác của bài kiểm tra màu phụ thuộc đáng kể vào nguồn sáng xung quanh. Chúng tôi khuyến nghị:\n\n- **Ánh sáng tự nhiên:** Chụp cạnh cửa sổ ban ngày, tránh đèn huỳnh quang vàng/trắng gắt.\n- **Mặt mộc hoàn toàn:** Tẩy trang sạch sẽ, không dùng kem chống nắng nâng tông hay kính áp tròng màu.\n- **Góc mặt chính diện:** Giữ camera ngang tầm mắt, vén tóc mái để lộ rõ trán và tai.',
    highlightIcon: 'wb_sunny',
    highlightText: 'Ánh sáng tự nhiên, mặt mộc, góc chính diện.',
  },
  {
    categories: ['fitting-room'],
    question: 'Tính năng Thử Đồ Ảo (AI Virtual Fitting) có giữ đúng tỷ lệ vóc dáng của tôi không?',
    answerMarkdown:
      'Hoàn toàn chính xác! Hệ thống Virtual Fitting của TwistFit sử dụng mạng nơ-ron **DensePose kết hợp 3D Neural Mesh** để tái cấu trúc hình thể người dùng từ ảnh toàn thân mà không làm biến dạng tỷ lệ chân thực.\n\nVải của từng bộ trang phục được gán thông số vật lý riêng biệt (độ rũ của lụa, độ cứng của denim, độ bóng của da nhân tạo), giúp phản chiếu độ ôm sát và chuyển động theo đúng số đo eo, ngực và chiều dài tay chân của bạn.',
    highlightIcon: null,
    highlightText: null,
  },
  {
    categories: ['personal-color', 'account'],
    question: 'Nếu dùng máy tính (Laptop/PC) thì tôi làm bài test Personal Color như thế nào?',
    answerMarkdown:
      'Để đảm bảo chất lượng cảm biến camera tốt nhất (do webcam laptop thường có độ phân giải và cân bằng trắng thấp), TwistFit áp dụng công nghệ **Đồng Bộ Liên Màn Hình (Cross-device Sync)**: khi bắt đầu làm bài test trên màn hình lớn, một mã QR duy nhất sẽ xuất hiện. Bạn chỉ cần bật camera điện thoại quét mã để đo sắc tố, kết quả sẽ đồng bộ hiển thị ngay lập tức lên màn hình máy tính.',
    highlightIcon: 'qr_code_scanner',
    highlightText: 'Quét mã QR liền mạch.',
  },
  {
    categories: ['account'],
    question: 'Báo cáo Personal Color sau khi test có được lưu lại không và tải về ở đâu?',
    answerMarkdown:
      'Tất cả các lượt phân tích màu sắc và cấu trúc hình thể đều được lưu vĩnh viễn trong hồ sơ của bạn:\n\n- Truy cập menu góc phải: chọn **"Kết quả đánh giá"** để xem lại mọi bảng màu (Best Colors & Worst Colors).\n- Bạn có thể bấm nút **"Xuất Báo Cáo PDF"** để nhận cuốn cẩm nang phối đồ cá nhân hóa chuẩn tạp chí thời trang.',
    highlightIcon: null,
    highlightText: null,
  },
  {
    categories: ['account', 'stylist'],
    question: 'Dữ liệu hình ảnh khuôn mặt của tôi có được bảo mật không?',
    answerMarkdown:
      'TwistFit đặt quyền riêng tư và an toàn dữ liệu của bạn lên ưu tiên hàng đầu. Ảnh chân dung chụp qua camera chỉ được trích xuất ma trận giá trị màu (RGB/Lab) ngay trên phiên làm việc và tự động hủy sau khi tạo báo cáo. Chúng tôi không bao giờ bán, chia sẻ hoặc dùng dữ liệu khuôn mặt cho bên thứ ba.',
    highlightIcon: 'verified_user',
    highlightText: 'Chính sách không lưu trữ hình ảnh gốc thô (Raw Images).',
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM faq_items').get() as { count: number }
  if (count > 0) return
  SEED_FAQ_ITEMS.forEach((item) => createFaqItem(db, item))
}
