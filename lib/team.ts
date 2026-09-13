import type Database from 'better-sqlite3'

export type ColorVariant = 'primary' | 'secondary' | 'tertiary'
export const COLOR_VARIANTS: ColorVariant[] = ['primary', 'secondary', 'tertiary']

export type TeamMember = {
  id: number
  image: string
  name: string
  role: string
  bio: string
  badgeVariant: ColorVariant
  roleVariant: ColorVariant
  footerIcon: string
  footerLabel: string
  createdAt: string
  updatedAt: string
}

export type TeamMemberInput = {
  image: string
  name: string
  role: string
  bio: string
  badgeVariant: ColorVariant
  roleVariant: ColorVariant
  footerIcon: string
  footerLabel: string
}

type TeamMemberRow = {
  id: number
  image: string
  name: string
  role: string
  bio: string
  badge_variant: string
  role_variant: string
  footer_icon: string
  footer_label: string
  created_at: string
  updated_at: string
}

function rowToTeamMember(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    image: row.image,
    name: row.name,
    role: row.role,
    bio: row.bio,
    badgeVariant: row.badge_variant as ColorVariant,
    roleVariant: row.role_variant as ColorVariant,
    footerIcon: row.footer_icon,
    footerLabel: row.footer_label,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      bio TEXT NOT NULL,
      badge_variant TEXT NOT NULL,
      role_variant TEXT NOT NULL,
      footer_icon TEXT NOT NULL,
      footer_label TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
}

export function getTeamMembers(db: Database.Database): TeamMember[] {
  const rows = db.prepare('SELECT * FROM team_members ORDER BY id ASC').all() as TeamMemberRow[]
  return rows.map(rowToTeamMember)
}

export function getTeamMemberById(db: Database.Database, id: number): TeamMember | null {
  const row = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id) as TeamMemberRow | undefined
  return row ? rowToTeamMember(row) : null
}

export function createTeamMember(db: Database.Database, input: TeamMemberInput): TeamMember {
  const now = new Date().toISOString()
  const result = db
    .prepare(
      `INSERT INTO team_members
        (image, name, role, bio, badge_variant, role_variant, footer_icon, footer_label, created_at, updated_at)
       VALUES (@image, @name, @role, @bio, @badgeVariant, @roleVariant, @footerIcon, @footerLabel, @createdAt, @updatedAt)`
    )
    .run({ ...input, createdAt: now, updatedAt: now })
  const created = getTeamMemberById(db, Number(result.lastInsertRowid))
  if (!created) {
    throw new Error('Failed to read back created team member')
  }
  return created
}

export function updateTeamMember(
  db: Database.Database,
  id: number,
  input: TeamMemberInput
): TeamMember | null {
  const existing = getTeamMemberById(db, id)
  if (!existing) return null

  const now = new Date().toISOString()
  db.prepare(
    `UPDATE team_members SET
      image = @image, name = @name, role = @role, bio = @bio,
      badge_variant = @badgeVariant, role_variant = @roleVariant,
      footer_icon = @footerIcon, footer_label = @footerLabel, updated_at = @updatedAt
     WHERE id = @id`
  ).run({ ...input, id, updatedAt: now })
  return getTeamMemberById(db, id)
}

export function deleteTeamMember(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM team_members WHERE id = ?').run(id)
  return result.changes > 0
}

const SEED_TEAM_MEMBERS: TeamMemberInput[] = [
  {
    image: '/about/team-mai-anh.jpg',
    name: 'Trần Mai Anh',
    role: 'Head of Color Science & Consulting',
    bio: 'Chứng chỉ Chuyên gia Màu sắc Quốc tế (IIC). 8+ năm kinh nghiệm tư vấn định vị hình ảnh cá nhân cho các người mẫu, KOL và doanh nhân hàng đầu.',
    badgeVariant: 'secondary',
    roleVariant: 'secondary',
    footerIcon: 'verified',
    footerLabel: 'Korea Image Industry Association',
  },
  {
    image: '/about/team-quang-huy.jpg',
    name: 'Dr. Lê Quang Huy',
    role: 'Chief Technology Officer (CTO)',
    bio: 'Tiến sĩ Khoa học Máy tính tại NTU Singapore, chuyên sâu về Deep Learning và Thị giác Máy tính ứng dụng trong phân tích sắc ký ảnh kỹ thuật số.',
    badgeVariant: 'primary',
    roleVariant: 'primary',
    footerIcon: 'memory',
    footerLabel: '5+ Sáng chế thị giác màu quang phổ',
  },
  {
    image: '/about/team-khanh-linh.jpg',
    name: 'Nguyễn Khánh Linh',
    role: 'Creative Director & Master Stylist',
    bio: 'Tốt nghiệp Học viện Thời trang London (LCA). Cựu biên tập viên phong cách cho các tạp chí phong cách sống hàng đầu, đam mê tái cấu trúc tủ đồ thông minh.',
    badgeVariant: 'tertiary',
    roleVariant: 'tertiary',
    footerIcon: 'auto_fix_high',
    footerLabel: 'Stylist của 100+ Fashion Lookbooks',
  },
]

export function seedIfEmpty(db: Database.Database): void {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM team_members').get() as { count: number }
  if (count > 0) return
  SEED_TEAM_MEMBERS.forEach((member) => createTeamMember(db, member))
}
