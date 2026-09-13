import type Database from 'better-sqlite3'

export type TagVariant = 'primary' | 'secondary' | 'tertiary'
export const TAG_VARIANTS: TagVariant[] = ['primary', 'secondary', 'tertiary']

export type CapsuleItem = {
  label: string
  price: string
}

export type CapsuleSet = {
  id: number
  image: string
  alt: string
  tagVariant: TagVariant
  tagLabel: string
  fitFor: string
  title: string
  tone: string
  description: string
  items: CapsuleItem[]
  createdAt: string
  updatedAt: string
}

export type CapsuleSetInput = {
  image: string
  alt: string
  tagVariant: TagVariant
  tagLabel: string
  fitFor: string
  title: string
  tone: string
  description: string
  items: CapsuleItem[]
}

type CapsuleSetRow = {
  id: number
  image: string
  alt: string
  tag_variant: string
  tag_label: string
  fit_for: string
  title: string
  tone: string
  description: string
  items_json: string
  created_at: string
  updated_at: string
}

function rowToCapsuleSet(row: CapsuleSetRow): CapsuleSet {
  return {
    id: row.id,
    image: row.image,
    alt: row.alt,
    tagVariant: row.tag_variant as TagVariant,
    tagLabel: row.tag_label,
    fitFor: row.fit_for,
    title: row.title,
    tone: row.tone,
    description: row.description,
    items: JSON.parse(row.items_json) as CapsuleItem[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS capsule_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT NOT NULL,
      alt TEXT NOT NULL,
      tag_variant TEXT NOT NULL,
      tag_label TEXT NOT NULL,
      fit_for TEXT NOT NULL,
      title TEXT NOT NULL,
      tone TEXT NOT NULL,
      description TEXT NOT NULL,
      items_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getCapsuleSets(db: Database.Database): CapsuleSet[] {
  const rows = db.prepare('SELECT * FROM capsule_sets ORDER BY id ASC').all() as CapsuleSetRow[]
  return rows.map(rowToCapsuleSet)
}

export function getCapsuleSetById(db: Database.Database, id: number): CapsuleSet | null {
  const row = db.prepare('SELECT * FROM capsule_sets WHERE id = ?').get(id) as CapsuleSetRow | undefined
  return row ? rowToCapsuleSet(row) : null
}

export function createCapsuleSet(db: Database.Database, input: CapsuleSetInput): CapsuleSet {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO capsule_sets
        (image, alt, tag_variant, tag_label, fit_for, title, tone, description, items_json, created_at, updated_at)
       VALUES (@image, @alt, @tagVariant, @tagLabel, @fitFor, @title, @tone, @description, @itemsJson, @createdAt, @updatedAt)`
    )
    .run({
      image: input.image,
      alt: input.alt,
      tagVariant: input.tagVariant,
      tagLabel: input.tagLabel,
      fitFor: input.fitFor,
      title: input.title,
      tone: input.tone,
      description: input.description,
      itemsJson: JSON.stringify(input.items),
      createdAt: now,
      updatedAt: now,
    })
  const created = getCapsuleSetById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created capsule set')
  }
  return created
}

export function updateCapsuleSet(
  db: Database.Database,
  id: number,
  input: CapsuleSetInput
): CapsuleSet | null {
  const existing = getCapsuleSetById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE capsule_sets SET
      image = @image, alt = @alt, tag_variant = @tagVariant, tag_label = @tagLabel,
      fit_for = @fitFor, title = @title, tone = @tone, description = @description,
      items_json = @itemsJson, updated_at = @updatedAt
     WHERE id = @id`
  ).run({
    id,
    image: input.image,
    alt: input.alt,
    tagVariant: input.tagVariant,
    tagLabel: input.tagLabel,
    fitFor: input.fitFor,
    title: input.title,
    tone: input.tone,
    description: input.description,
    itemsJson: JSON.stringify(input.items),
    updatedAt: now,
  })
  return getCapsuleSetById(db, id)
}

export function deleteCapsuleSet(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM capsule_sets WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_CAPSULE_SETS: CapsuleSetInput[] = [
  {
    image: '/outfit/capsule-set-office.jpg',
    alt: 'Set đồ công sở thanh lịch với áo peplum hồng, quần ống suông trắng ngà và túi xách minimalist',
    tagVariant: 'primary',
    tagLabel: 'Set 1 • Thanh Lịch',
    fitFor: 'Phù hợp: Office & Meeting',
    title: 'Thanh Lịch Công Sở',
    tone: 'Warm Cream',
    description:
      'Áo Peplum Voan Hồng + Quần Ống Suông Trắng Ngà + Túi xách Minimalist. Tối ưu chiều dài chân và tạo nét chuyên nghiệp, nhã nhặn.',
    items: [
      { label: 'Quần ống suông ngà:', price: '490.000 ₫' },
      { label: 'Túi xách Minimalist:', price: '720.000 ₫' },
    ],
  },
  {
    image: '/outfit/capsule-set-date.jpg',
    alt: 'Set đồ dạo phố với áo peplum hồng, chân váy midi xám bạc và giày slingback',
    tagVariant: 'secondary',
    tagLabel: 'Set 2 • Dạo Phố',
    fitFor: 'Phù hợp: Dating & Weekend',
    title: 'Hẹn Hò & Dạo Phố',
    tone: 'Soft Silver',
    description:
      'Áo Peplum + Chân Váy Xòe Midi Xám Bạc tôn vẻ nữ tính dịu dàng. Màu xám bạc lạnh làm nổi bật sắc hồng thanh khiết của áo.',
    items: [
      { label: 'Chân váy midi xám bạc:', price: '530.000 ₫' },
      { label: 'Giày Slingback Satin:', price: '650.000 ₫' },
    ],
  },
  {
    image: '/outfit/capsule-set-accessories.jpg',
    alt: 'Phụ kiện khuyên tai bạc và túi pastel lilac bổ trợ cho set đồ',
    tagVariant: 'tertiary',
    tagLabel: 'Set 3 • Điểm Nhấn',
    fitFor: 'Phù hợp: Điểm Nhấn Cao Cấp',
    title: 'Phụ Kiện Tối Ưu',
    tone: 'Pastel Lilac',
    description:
      'Khuyên Tai Bạc Silver + Túi Pastel Lilac ánh tím. Bổ trợ hoàn hảo cho nhóm màu Summer Soft mà không làm lu mờ sắc áo chính.',
    items: [
      { label: 'Khuyên tai bạc Ý 925:', price: '320.000 ₫' },
      { label: 'Túi Pastel Lilac:', price: '580.000 ₫' },
    ],
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM capsule_sets').get() as { count: number }
  if (count > 0) return
  SEED_CAPSULE_SETS.forEach((set) => createCapsuleSet(db, set))
}
