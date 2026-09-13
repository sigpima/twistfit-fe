import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createCapsuleSet,
  getCapsuleSets,
  getCapsuleSetById,
  updateCapsuleSet,
  deleteCapsuleSet,
  seedIfEmpty,
  type CapsuleSetInput,
} from './capsuleWardrobe'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleSet: CapsuleSetInput = {
  image: '/outfit/capsule-set-test.jpg',
  alt: 'Ảnh set đồ test',
  tagVariant: 'primary',
  tagLabel: 'Set Test',
  fitFor: 'Phù hợp: Test',
  title: 'Tiêu đề test',
  tone: 'Test Tone',
  description: 'Mô tả test',
  items: [
    { label: 'Món đồ A:', price: '100.000 ₫' },
    { label: 'Món đồ B:', price: '200.000 ₫' },
  ],
}

describe('Capsule Wardrobe CRUD', () => {
  it('creates and reads back a set with its items in order', () => {
    const created = createCapsuleSet(db, sampleSet)
    expect(created.id).toBeGreaterThan(0)
    expect(created.items).toHaveLength(2)
    expect(created.items[0]).toEqual({ label: 'Món đồ A:', price: '100.000 ₫' })
  })

  it('lists sets in creation order', () => {
    createCapsuleSet(db, { ...sampleSet, title: 'Set 1' })
    createCapsuleSet(db, { ...sampleSet, title: 'Set 2' })
    expect(getCapsuleSets(db).map((s) => s.title)).toEqual(['Set 1', 'Set 2'])
  })

  it('replaces the item list on update', () => {
    const created = createCapsuleSet(db, sampleSet)
    const updated = updateCapsuleSet(db, created.id, {
      ...sampleSet,
      items: [{ label: 'Món đồ mới:', price: '300.000 ₫' }],
    })
    expect(updated?.items).toHaveLength(1)
    expect(updated?.items[0].label).toBe('Món đồ mới:')
    expect(updateCapsuleSet(db, 999999, sampleSet)).toBeNull()
  })

  it('deletes a set', () => {
    const created = createCapsuleSet(db, sampleSet)
    expect(deleteCapsuleSet(db, created.id)).toBe(true)
    expect(getCapsuleSetById(db, created.id)).toBeNull()
    expect(deleteCapsuleSet(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 3 capsule sets into an empty database', () => {
    seedIfEmpty(db)
    expect(getCapsuleSets(db)).toHaveLength(3)
  })

  it('does nothing if capsule_sets already has rows', () => {
    createCapsuleSet(db, sampleSet)
    seedIfEmpty(db)
    expect(getCapsuleSets(db)).toHaveLength(1)
  })
})
