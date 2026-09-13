import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createTeamMember,
  getTeamMembers,
  getTeamMemberById,
  updateTeamMember,
  deleteTeamMember,
  seedIfEmpty,
  type TeamMemberInput,
} from './team'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleMember: TeamMemberInput = {
  image: '/about/team-test.jpg',
  name: 'Nguyễn Văn Test',
  role: 'Test Role',
  bio: 'Tiểu sử test.',
  badgeVariant: 'secondary',
  roleVariant: 'secondary',
  footerIcon: 'verified',
  footerLabel: 'Footer label test',
}

describe('Team CRUD', () => {
  it('creates and reads back a member', () => {
    const created = createTeamMember(db, sampleMember)
    expect(created.id).toBeGreaterThan(0)
    expect(created.name).toBe('Nguyễn Văn Test')
    expect(created.badgeVariant).toBe('secondary')
  })

  it('lists members in creation order', () => {
    createTeamMember(db, { ...sampleMember, name: 'Member 1' })
    createTeamMember(db, { ...sampleMember, name: 'Member 2' })
    expect(getTeamMembers(db).map((m) => m.name)).toEqual(['Member 1', 'Member 2'])
  })

  it('updates a member', () => {
    const created = createTeamMember(db, sampleMember)
    const updated = updateTeamMember(db, created.id, { ...sampleMember, name: 'Tên đã sửa' })
    expect(updated?.name).toBe('Tên đã sửa')
    expect(updateTeamMember(db, 999999, sampleMember)).toBeNull()
  })

  it('deletes a member', () => {
    const created = createTeamMember(db, sampleMember)
    expect(deleteTeamMember(db, created.id)).toBe(true)
    expect(getTeamMemberById(db, created.id)).toBeNull()
    expect(deleteTeamMember(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 3 team members into an empty database', () => {
    seedIfEmpty(db)
    expect(getTeamMembers(db)).toHaveLength(3)
  })

  it('does nothing if team_members already has rows', () => {
    createTeamMember(db, sampleMember)
    seedIfEmpty(db)
    expect(getTeamMembers(db)).toHaveLength(1)
  })
})
