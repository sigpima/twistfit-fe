import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']

export type BlogCategory = 'personal-color' | 'styling' | 'sustainable' | 'beauty' | 'community'
export const BLOG_CATEGORIES: BlogCategory[] = [
  'personal-color',
  'styling',
  'sustainable',
  'beauty',
  'community',
]

export type BlogPost = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  coverImageUrl: string
  category: BlogCategory
  authorName: string | null
  isFeatured: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export type BlogPostInput = {
  slug: string
  title: string
  excerpt: string
  content: string
  coverImageUrl: string
  category: BlogCategory
  authorName: string | null
  isFeatured: boolean
  publishedAt: string
}

type BlogPostRow = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image_url: string
  category: string
  author_name: string | null
  is_featured: number
  published_at: string
  created_at: string
  updated_at: string
}

function rowToBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    category: row.category as BlogCategory,
    authorName: row.author_name,
    isFeatured: row.is_featured === 1,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image_url TEXT NOT NULL,
      category TEXT NOT NULL,
      author_name TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_text TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      season TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
  `)
}

export function getBlogPosts(db: Database.Database): BlogPost[] {
  const rows = db.prepare('SELECT * FROM blog_posts ORDER BY published_at DESC').all() as BlogPostRow[]
  return rows.map(rowToBlogPost)
}

export function getBlogPostBySlug(db: Database.Database, slug: string): BlogPost | null {
  const row = db.prepare('SELECT * FROM blog_posts WHERE slug = ?').get(slug) as BlogPostRow | undefined
  return row ? rowToBlogPost(row) : null
}

export function getBlogPostById(db: Database.Database, id: number): BlogPost | null {
  const row = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as BlogPostRow | undefined
  return row ? rowToBlogPost(row) : null
}

export function isBlogSlugTaken(db: Database.Database, slug: string, excludeId?: number): boolean {
  const row =
    excludeId !== undefined
      ? db.prepare('SELECT id FROM blog_posts WHERE slug = ? AND id != ?').get(slug, excludeId)
      : db.prepare('SELECT id FROM blog_posts WHERE slug = ?').get(slug)
  return row !== undefined
}

export function createBlogPost(db: Database.Database, input: BlogPostInput): BlogPost {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO blog_posts
        (slug, title, excerpt, content, cover_image_url, category, author_name, is_featured, published_at, created_at, updated_at)
       VALUES (@slug, @title, @excerpt, @content, @coverImageUrl, @category, @authorName, @isFeatured, @publishedAt, @createdAt, @updatedAt)`
    )
    .run({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      category: input.category,
      authorName: input.authorName,
      isFeatured: input.isFeatured ? 1 : 0,
      publishedAt: input.publishedAt,
      createdAt: now,
      updatedAt: now,
    })
  const created = getBlogPostById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created blog post')
  }
  return created
}

export function updateBlogPost(db: Database.Database, id: number, input: BlogPostInput): BlogPost | null {
  const existing = getBlogPostById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE blog_posts SET
      slug = @slug, title = @title, excerpt = @excerpt, content = @content,
      cover_image_url = @coverImageUrl, category = @category, author_name = @authorName,
      is_featured = @isFeatured, published_at = @publishedAt, updated_at = @updatedAt
     WHERE id = @id`
  ).run({
    id,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    content: input.content,
    coverImageUrl: input.coverImageUrl,
    category: input.category,
    authorName: input.authorName,
    isFeatured: input.isFeatured ? 1 : 0,
    publishedAt: input.publishedAt,
    updatedAt: now,
  })
  return getBlogPostById(db, id)
}

export function deleteBlogPost(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM blog_posts WHERE id = ?').run(id)
  return result.changes > 0
}

export type QuizOption = {
  id: number
  label: string
  season: Season
  sortOrder: number
}

export type QuizOptionInput = {
  label: string
  season: Season
}

export type QuizQuestion = {
  id: number
  questionText: string
  sortOrder: number
  options: QuizOption[]
}

export type QuizQuestionInput = {
  questionText: string
  sortOrder: number
  options: QuizOptionInput[]
}

type QuizQuestionRow = { id: number; question_text: string; sort_order: number }
type QuizOptionRow = { id: number; question_id: number; label: string; season: string; sort_order: number }

function getOptionsForQuestion(db: Database.Database, questionId: number): QuizOption[] {
  const rows = db
    .prepare('SELECT * FROM quiz_options WHERE question_id = ? ORDER BY sort_order ASC')
    .all(questionId) as QuizOptionRow[]
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    season: row.season as Season,
    sortOrder: row.sort_order,
  }))
}

function rowToQuizQuestion(db: Database.Database, row: QuizQuestionRow): QuizQuestion {
  return {
    id: row.id,
    questionText: row.question_text,
    sortOrder: row.sort_order,
    options: getOptionsForQuestion(db, row.id),
  }
}

export function getQuizQuestions(db: Database.Database): QuizQuestion[] {
  const rows = db.prepare('SELECT * FROM quiz_questions ORDER BY sort_order ASC').all() as QuizQuestionRow[]
  return rows.map((row) => rowToQuizQuestion(db, row))
}

export function getQuizQuestionById(db: Database.Database, id: number): QuizQuestion | null {
  const row = db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(id) as QuizQuestionRow | undefined
  return row ? rowToQuizQuestion(db, row) : null
}

export function createQuizQuestion(db: Database.Database, input: QuizQuestionInput): QuizQuestion {
  const insertQuestion = db.prepare('INSERT INTO quiz_questions (question_text, sort_order) VALUES (?, ?)')
  const insertOption = db.prepare(
    'INSERT INTO quiz_options (question_id, label, season, sort_order) VALUES (?, ?, ?, ?)'
  )

  const questionId = db.transaction(() => {
    const result = insertQuestion.run(input.questionText, input.sortOrder)
    const id = Number(result.lastInsertRowid)
    input.options.forEach((option, index) => {
      insertOption.run(id, option.label, option.season, index)
    })
    return id
  })()

  const created = getQuizQuestionById(db, questionId)
  if (!created) {
    throw new Error('Failed to read back created quiz question')
  }
  return created
}

export function updateQuizQuestion(
  db: Database.Database,
  id: number,
  input: QuizQuestionInput
): QuizQuestion | null {
  const existing = getQuizQuestionById(db, id)
  if (!existing) return null

  db.transaction(() => {
    db.prepare('UPDATE quiz_questions SET question_text = ?, sort_order = ? WHERE id = ?').run(
      input.questionText,
      input.sortOrder,
      id
    )
    db.prepare('DELETE FROM quiz_options WHERE question_id = ?').run(id)
    const insertOption = db.prepare(
      'INSERT INTO quiz_options (question_id, label, season, sort_order) VALUES (?, ?, ?, ?)'
    )
    input.options.forEach((option, index) => {
      insertOption.run(id, option.label, option.season, index)
    })
  })()

  return getQuizQuestionById(db, id)
}

export function deleteQuizQuestion(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM quiz_questions WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_BLOG_POSTS: BlogPostInput[] = [
  {
    slug: 'bi-quyet-chon-trang-phuc-ton-da-mua-dong',
    title: 'Bí quyết chọn trang phục tôn da chuẩn tone Mùa Đông - Xu hướng mới nhất 2026',
    excerpt:
      'Khám phá sức hút mãnh liệt của sự tương phản cao và cách kết hợp trang phục lạnh sáng sắc nét giúp tôn vinh thần thái tự nhiên, đánh bật mọi khung hình.',
    content:
      'Khám phá sức hút mãnh liệt của sự tương phản cao và cách kết hợp trang phục lạnh sáng sắc nét giúp tôn vinh thần thái tự nhiên, đánh bật mọi khung hình.',
    coverImageUrl: '/blog/featured-winter-outfit.jpg',
    category: 'personal-color',
    authorName: 'Stylist Mai Anh',
    isFeatured: true,
    publishedAt: '2026-06-18',
  },
  {
    slug: 'top-5-thoi-son-cool-undertone',
    title: 'Top 5 thỏi son kinh điển dành riêng cho cô nàng thuộc nhóm Cool Undertone',
    excerpt:
      'Sự thanh khiết và dịu mát của tone Mùa Hạ đến sắc son có sắc hồng dịu, tím sữa hoặc berry nhẹ để đôi môi luôn ửng hồng tự nhiên mà không bị già.',
    content:
      'Sự thanh khiết và dịu mát của tone Mùa Hạ đến sắc son có sắc hồng dịu, tím sữa hoặc berry nhẹ để đôi môi luôn ửng hồng tự nhiên mà không bị già.',
    coverImageUrl: '/blog/lipstick-flatlay.jpg',
    category: 'beauty',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-06-18',
  },
  {
    slug: 'tu-do-con-nhong-30-mon',
    title: 'Tủ đồ con nhộng (Capsule Wardrobe): Tối ưu 30 món mặc đẹp quanh năm',
    excerpt:
      'Hướng dẫn chi tiết từng bước thanh lọc trang phục lỗi thời, tập trung vào những món đồ bền vững có tính ứng dụng cao và chuẩn sắc thái cá nhân.',
    content:
      'Hướng dẫn chi tiết từng bước thanh lọc trang phục lỗi thời, tập trung vào những món đồ bền vững có tính ứng dụng cao và chuẩn sắc thái cá nhân.',
    coverImageUrl: '/blog/capsule-wardrobe-rail.jpg',
    category: 'sustainable',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-05-09',
  },
  {
    slug: 'doi-quan-ao-cu-nhan-phan-tich-mau-mien-phi',
    title: "Chiến dịch 'Đổi Quần Áo Cũ - Nhận Bản Phân Tích Màu Sắc Miễn Phí'",
    excerpt:
      'Chung tay cùng TwistFit giảm thiểu rác thải thời trang dệt may, mang lại vòng đời mới cho trang phục và nâng cấp gu ăn mặc của chính bạn.',
    content:
      'Chung tay cùng TwistFit giảm thiểu rác thải thời trang dệt may, mang lại vòng đời mới cho trang phục và nâng cấp gu ăn mặc của chính bạn.',
    coverImageUrl: '/blog/community-swap.jpg',
    category: 'community',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-05-06',
  },
  {
    slug: 'nhan-biet-warm-cool-undertone-tai-nha',
    title: 'Cách nhận biết Warm Undertone vs Cool Undertone chính xác tại nhà chỉ trong 1 phút',
    excerpt:
      'Chỉ với ánh sáng tự nhiên và vài mẹo quan sát mạch máu hoặc trang sức vàng bạc, bạn hoàn toàn có thể tự kiểm tra sắc thái da cơ bản.',
    content:
      'Chỉ với ánh sáng tự nhiên và vài mẹo quan sát mạch máu hoặc trang sức vàng bạc, bạn hoàn toàn có thể tự kiểm tra sắc thái da cơ bản.',
    coverImageUrl: '/blog/undertone-draping.jpg',
    category: 'personal-color',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-04-28',
  },
  {
    slug: 'phoi-layer-ton-dang-lung-dai-chan-ngan',
    title: 'Bí kíp phối layer tôn dáng cho người có tỷ lệ lưng dài chân ngắn',
    excerpt:
      "Tận dụng độ cạp cao của quần âu, áo croptop lửng và sự tương phản màu sắc giúp 'hack' chiều cao hiệu quả trên tính năng thử đồ ảo TwistFit.",
    content:
      "Tận dụng độ cạp cao của quần âu, áo croptop lửng và sự tương phản màu sắc giúp 'hack' chiều cao hiệu quả trên tính năng thử đồ ảo TwistFit.",
    coverImageUrl: '/blog/proportion-styling-flatlay.jpg',
    category: 'styling',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-04-20',
  },
  {
    slug: 'bang-mau-mua-thu-am-ap',
    title: 'Sức hút ấm áp từ bảng màu Mùa Thu (Autumn Warm): Khi tone đất lên ngôi',
    excerpt:
      'Những gam màu nâu caramel, cam cháy và rêu olive mang đến sự quý phái, đằm thắm cho những buổi hẹn hò hoặc sự kiện trang trọng.',
    content:
      'Những gam màu nâu caramel, cam cháy và rêu olive mang đến sự quý phái, đằm thắm cho những buổi hẹn hò hoặc sự kiện trang trọng.',
    coverImageUrl: '/blog/autumn-palette-moodboard.jpg',
    category: 'personal-color',
    authorName: null,
    isFeatured: false,
    publishedAt: '2026-04-12',
  },
]

const SEED_QUIZ_QUESTIONS: QuizQuestionInput[] = [
  {
    sortOrder: 0,
    questionText: 'Tĩnh mạch ở cổ tay bạn có màu gì khi nhìn dưới ánh sáng tự nhiên?',
    options: [
      { label: 'Xanh lá hoặc xanh ô liu', season: 'autumn' },
      { label: 'Xanh dương hoặc tím', season: 'winter' },
      { label: 'Xanh dương nhạt, khó phân biệt', season: 'summer' },
      { label: 'Xanh lá nhạt, ánh vàng', season: 'spring' },
    ],
  },
  {
    sortOrder: 1,
    questionText: 'Làn da bạn phản ứng thế nào khi ra nắng?',
    options: [
      { label: 'Dễ cháy nắng, ít khi sạm', season: 'summer' },
      { label: 'Sạm màu nhanh, hiếm khi cháy', season: 'autumn' },
      { label: 'Rám nắng đều, khỏe khoắn', season: 'spring' },
      { label: 'Da trắng sáng, tương phản rõ khi cháy nắng', season: 'winter' },
    ],
  },
  {
    sortOrder: 2,
    questionText: 'Màu tóc tự nhiên (chưa nhuộm) của bạn gần nhất với?',
    options: [
      { label: 'Nâu vàng, nâu hạt dẻ ánh đỏ', season: 'autumn' },
      { label: 'Đen tuyền hoặc nâu rất đậm', season: 'winter' },
      { label: 'Nâu tro, nâu hạt dẻ ánh xám', season: 'summer' },
      { label: 'Vàng óng, nâu sáng ánh vàng', season: 'spring' },
    ],
  },
  {
    sortOrder: 3,
    questionText: 'Màu mắt tự nhiên của bạn là?',
    options: [
      { label: 'Nâu đen sắc nét', season: 'winter' },
      { label: 'Nâu hạt dẻ ấm', season: 'autumn' },
      { label: 'Nâu nhạt hoặc xám xanh dịu', season: 'summer' },
      { label: 'Nâu sáng hoặc xanh lục ánh vàng', season: 'spring' },
    ],
  },
  {
    sortOrder: 4,
    questionText: 'Khi thử trang sức, loại nào tôn da bạn hơn?',
    options: [
      { label: 'Vàng ánh đồng, vàng ấm', season: 'autumn' },
      { label: 'Vàng nhạt, vàng hồng dịu', season: 'spring' },
      { label: 'Bạc, bạch kim sáng rõ', season: 'winter' },
      { label: 'Bạc mờ, tông pastel nhẹ', season: 'summer' },
    ],
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM blog_posts').get() as { count: number }
  if (count > 0) return

  SEED_BLOG_POSTS.forEach((post) => createBlogPost(db, post))
  SEED_QUIZ_QUESTIONS.forEach((question) => createQuizQuestion(db, question))
}

let singleton: Database.Database | null = null

export function getDb(): Database.Database {
  if (singleton) return singleton

  const dbPath = path.join(process.cwd(), 'data', 'twistfit.db')
  const dir = path.dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const db = new Database(dbPath)
  initSchema(db)
  seedIfEmpty(db)
  singleton = db
  return db
}
