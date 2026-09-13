import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import Database from 'better-sqlite3'
import {
  initSchema,
  createModel,
  getModels,
  getModelById,
  updateModel,
  deleteModel,
  seedIfEmpty,
  type CatalogModelInput,
} from './modelCatalog'

let db: Database.Database

beforeEach(() => {
  db = new Database(':memory:')
  initSchema(db)
})

afterEach(() => {
  db.close()
})

const sampleModel: CatalogModelInput = {
  name: 'Test Model',
  image: '/outfit/models/test.jpg',
  dossierImage: '/outfit/models/test-dossier.jpg',
  poseCount: 15,
  tagline: 'Tagline test',
  undertone: 'warm',
  height: '1m70',
  bodyShape: 'Đồng hồ cát',
  waist: '66cm',
  personalColor: 'Warm Autumn',
}

describe('Model Catalog CRUD', () => {
  it('creates and reads back a model', () => {
    const created = createModel(db, sampleModel)
    expect(created.id).toBeGreaterThan(0)
    expect(created.name).toBe('Test Model')
    expect(created.poseCount).toBe(15)
    expect(created.undertone).toBe('warm')
  })

  it('lists models in creation order', () => {
    createModel(db, { ...sampleModel, name: 'Model 1' })
    createModel(db, { ...sampleModel, name: 'Model 2' })
    expect(getModels(db).map((m) => m.name)).toEqual(['Model 1', 'Model 2'])
  })

  it('updates a model', () => {
    const created = createModel(db, sampleModel)
    const updated = updateModel(db, created.id, { ...sampleModel, name: 'Tên đã sửa' })
    expect(updated?.name).toBe('Tên đã sửa')
    expect(updateModel(db, 999999, sampleModel)).toBeNull()
  })

  it('deletes a model', () => {
    const created = createModel(db, sampleModel)
    expect(deleteModel(db, created.id)).toBe(true)
    expect(getModelById(db, created.id)).toBeNull()
    expect(deleteModel(db, created.id)).toBe(false)
  })
})

describe('seedIfEmpty', () => {
  it('seeds 12 models into an empty database, with Carmen first', () => {
    seedIfEmpty(db)
    const models = getModels(db)
    expect(models).toHaveLength(12)
    expect(models[0].name).toBe('Carmen')
  })

  it('does nothing if catalog_models already has rows', () => {
    createModel(db, sampleModel)
    seedIfEmpty(db)
    expect(getModels(db)).toHaveLength(1)
  })
})
