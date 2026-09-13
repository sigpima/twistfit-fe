import type Database from 'better-sqlite3'

export type Undertone = 'warm' | 'cool' | 'neutral'
export const UNDERTONES: Undertone[] = ['warm', 'cool', 'neutral']

export type CatalogModel = {
  id: number
  name: string
  image: string
  dossierImage: string
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
  createdAt: string
  updatedAt: string
}

export type CatalogModelInput = {
  name: string
  image: string
  dossierImage: string
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
}

type CatalogModelRow = {
  id: number
  name: string
  image: string
  dossier_image: string
  pose_count: number
  tagline: string
  undertone: string
  height: string
  body_shape: string
  waist: string
  personal_color: string
  created_at: string
  updated_at: string
}

function rowToModel(row: CatalogModelRow): CatalogModel {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    dossierImage: row.dossier_image,
    poseCount: row.pose_count,
    tagline: row.tagline,
    undertone: row.undertone as Undertone,
    height: row.height,
    bodyShape: row.body_shape,
    waist: row.waist,
    personalColor: row.personal_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS catalog_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      dossier_image TEXT NOT NULL,
      pose_count INTEGER NOT NULL,
      tagline TEXT NOT NULL,
      undertone TEXT NOT NULL,
      height TEXT NOT NULL,
      body_shape TEXT NOT NULL,
      waist TEXT NOT NULL,
      personal_color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getModels(db: Database.Database): CatalogModel[] {
  const rows = db.prepare('SELECT * FROM catalog_models ORDER BY id ASC').all() as CatalogModelRow[]
  return rows.map(rowToModel)
}

export function getModelById(db: Database.Database, id: number): CatalogModel | null {
  const row = db.prepare('SELECT * FROM catalog_models WHERE id = ?').get(id) as CatalogModelRow | undefined
  return row ? rowToModel(row) : null
}

export function createModel(db: Database.Database, input: CatalogModelInput): CatalogModel {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO catalog_models
        (name, image, dossier_image, pose_count, tagline, undertone, height, body_shape, waist, personal_color, created_at, updated_at)
       VALUES (@name, @image, @dossierImage, @poseCount, @tagline, @undertone, @height, @bodyShape, @waist, @personalColor, @createdAt, @updatedAt)`
    )
    .run({ ...input, createdAt: now, updatedAt: now })
  const created = getModelById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created model')
  }
  return created
}

export function updateModel(db: Database.Database, id: number, input: CatalogModelInput): CatalogModel | null {
  const existing = getModelById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE catalog_models SET
      name = @name, image = @image, dossier_image = @dossierImage, pose_count = @poseCount,
      tagline = @tagline, undertone = @undertone, height = @height, body_shape = @bodyShape,
      waist = @waist, personal_color = @personalColor, updated_at = @updatedAt
     WHERE id = @id`
  ).run({ ...input, id, updatedAt: now })
  return getModelById(db, id)
}

export function deleteModel(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM catalog_models WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_MODELS: CatalogModelInput[] = [
  {
    name: 'Carmen',
    image: '/outfit/models/carmen-card.jpg',
    dossierImage: '/outfit/models/carmen-dossier.jpg',
    poseCount: 15,
    tagline: 'Tông da: Warm Neutral',
    undertone: 'neutral',
    height: '1m65',
    bodyShape: 'Đồng hồ cát',
    waist: '64cm',
    personalColor: 'Autumn Soft',
  },
  {
    name: 'Aisha',
    image: '/outfit/models/aisha.jpg',
    dossierImage: '/outfit/models/aisha.jpg',
    poseCount: 15,
    tagline: 'Da ngăm • Warm Deep',
    undertone: 'warm',
    height: '1m70',
    bodyShape: 'Đồng hồ cát',
    waist: '66cm',
    personalColor: 'Warm Deep Autumn',
  },
  {
    name: 'Alice',
    image: '/outfit/models/alice.jpg',
    dossierImage: '/outfit/models/alice.jpg',
    poseCount: 15,
    tagline: 'Da sáng • Cool Summer',
    undertone: 'cool',
    height: '1m68',
    bodyShape: 'Dáng thước kẻ',
    waist: '62cm',
    personalColor: 'Cool Summer Light',
  },
  {
    name: 'Amara',
    image: '/outfit/models/amara.jpg',
    dossierImage: '/outfit/models/amara.jpg',
    poseCount: 15,
    tagline: 'Afro Chic • Tôn đồ màu',
    undertone: 'warm',
    height: '1m72',
    bodyShape: 'Đồng hồ cát',
    waist: '68cm',
    personalColor: 'Warm Spring Bright',
  },
  {
    name: 'Arjun',
    image: '/outfit/models/arjun.jpg',
    dossierImage: '/outfit/models/arjun.jpg',
    poseCount: 12,
    tagline: 'Mẫu nam • Form Unisex',
    undertone: 'neutral',
    height: '1m80',
    bodyShape: 'Chữ nhật',
    waist: '80cm',
    personalColor: 'Neutral Autumn',
  },
  {
    name: 'Astrid',
    image: '/outfit/models/astrid.jpg',
    dossierImage: '/outfit/models/astrid.jpg',
    poseCount: 15,
    tagline: 'Tây Âu • Dáng thanh mảnh',
    undertone: 'cool',
    height: '1m75',
    bodyShape: 'Dáng thước kẻ',
    waist: '60cm',
    personalColor: 'Cool Winter Bright',
  },
  {
    name: 'Chloe',
    image: '/outfit/models/chloe.jpg',
    dossierImage: '/outfit/models/chloe.jpg',
    poseCount: 15,
    tagline: 'Á Đông • Dáng Petite',
    undertone: 'neutral',
    height: '1m58',
    bodyShape: 'Petite',
    waist: '58cm',
    personalColor: 'Neutral Spring',
  },
  {
    name: 'Bella',
    image: '/outfit/models/bella.jpg',
    dossierImage: '/outfit/models/bella.jpg',
    poseCount: 15,
    tagline: 'Đồng hồ cát • Đầy đặn',
    undertone: 'warm',
    height: '1m67',
    bodyShape: 'Đồng hồ cát',
    waist: '70cm',
    personalColor: 'Warm Autumn Deep',
  },
  {
    name: 'Camille',
    image: '/outfit/models/camille.jpg',
    dossierImage: '/outfit/models/camille.jpg',
    poseCount: 15,
    tagline: 'Parisian Chic • Dáng Quả Lê',
    undertone: 'neutral',
    height: '1m66',
    bodyShape: 'Quả lê',
    waist: '65cm',
    personalColor: 'Neutral Summer',
  },
  {
    name: 'Dave',
    image: '/outfit/models/dave.jpg',
    dossierImage: '/outfit/models/dave.jpg',
    poseCount: 10,
    tagline: 'Mẫu nam • Dáng thể thao',
    undertone: 'warm',
    height: '1m82',
    bodyShape: 'Thể thao',
    waist: '82cm',
    personalColor: 'Warm Spring',
  },
  {
    name: 'Linh Đan',
    image: '/outfit/models/linh-dan.jpg',
    dossierImage: '/outfit/models/linh-dan.jpg',
    poseCount: 15,
    tagline: 'Thuần Việt • Da trắng hồng',
    undertone: 'cool',
    height: '1m62',
    bodyShape: 'Đồng hồ cát',
    waist: '60cm',
    personalColor: 'Cool Summer Soft',
  },
  {
    name: 'Kenji',
    image: '/outfit/models/kenji.jpg',
    dossierImage: '/outfit/models/kenji.jpg',
    poseCount: 12,
    tagline: 'Tokyo Street • Tối giản',
    undertone: 'cool',
    height: '1m75',
    bodyShape: 'Chữ nhật',
    waist: '76cm',
    personalColor: 'Cool Winter Deep',
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM catalog_models').get() as { count: number }
  if (count > 0) return
  SEED_MODELS.forEach((model) => createModel(db, model))
}
