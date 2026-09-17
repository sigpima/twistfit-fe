# Accessory Recommendations (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin catalog UI (list/create/edit accessory products, with Gemini auto-tag suggestions) and the user-facing "accessories for this outfit" section on the Step 4 try-on result page, both against the `accessories` backend domain.

**Architecture:** Mirrors the existing `capsule-wardrobe` admin pages (list + new/edit forms under `AdminGate`) combined with `UploadFlow.tsx`'s upload → Gemini-suggest → review-and-save pattern. The user-facing section is a new component added to `Step4PageContent`'s layout, which moves from a single centered column to a 12-column grid so the accessories panel sits at the bottom-right of the result image on desktop and becomes a horizontal scroll-snap carousel on mobile.

**Tech Stack:** Next.js (App Router), React, `next-intl`, Tailwind, Vitest + Testing Library.

**Spec:** `frontend/docs/superpowers/specs/2026-09-17-accessory-recommendations-design.md`

**Depends on:** `frontend/docs/superpowers/plans/2026-09-17-accessory-recommendations-backend.md` (the `/accessories` endpoints must exist for this to run against a real backend; every task below tests the frontend in isolation with a mocked `fetch`, so the two plans can be implemented in either order, but the feature only works end-to-end once both are done).

## Global Constraints

- All API calls go through `apiFetch` from `@/lib/apiClient` (adds `credentials: 'include'` automatically; do not call `fetch` directly except for the raw SAS blob `PUT`, which is not a same-origin API call).
- Admin pages are wrapped in `<AdminGate>` (`@/components/auth/AdminGate`) and follow the exact file/route shape of `app/admin/capsule-wardrobe/*`.
- Test with `renderWithIntl` from `@/test-utils/renderWithIntl` and `vi.stubGlobal('fetch', ...)` / `vi.unstubAllGlobals()` in `afterEach` — no fetch mocking library, matching every existing admin/outfit test file.
- i18n: add new keys to `frontend/messages/vi.json` only (this project has a single locale). Follow the existing nesting: admin component keys under `Admin.<ComponentName>`, outfit step keys under `Outfit.Step4.<ComponentName>`.
- Tag vocabularies are re-declared locally per domain rather than imported across domains — this matches the existing codebase convention (`UploadFlow.tsx` has its own local `STYLE_TAGS`/`OCCASION_TAGS` rather than importing from `OutfitFlowProvider`). Define this feature's vocabulary once in `lib/accessories.ts` and use it from every accessory component.
- Run `npx tsc --noEmit` and `npx eslint <changed files>` after each task, in addition to the task's own test command.

---

## Task 1: `lib/accessories.ts` + `AccessoryList` admin component

**Files:**
- Create: `frontend/lib/accessories.ts`
- Create: `frontend/components/admin/AccessoryList.tsx`
- Test: `frontend/components/admin/AccessoryList.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Produces: `AccessoryProduct` type, `ACCESSORY_CATEGORIES`, `ACCESSORY_STYLE_TAGS`, `ACCESSORY_OCCASION_TAGS`, `ACCESSORY_TONE_TAGS` (all `as const` string-literal arrays) in `frontend/lib/accessories.ts` — consumed by Tasks 2, 3, and 4. `AccessoryList` component — consumed by Task 3's list page.

- [ ] **Step 1: Create the shared types/constants file**

Create `frontend/lib/accessories.ts`:

```ts
export const ACCESSORY_CATEGORIES = ['tui-xach', 'giay', 'trang-suc', 'mu-non', 'khan'] as const
export type AccessoryCategory = (typeof ACCESSORY_CATEGORIES)[number]

export const ACCESSORY_STYLE_TAGS = ['casual', 'minimalist', 'street', 'formal'] as const
export const ACCESSORY_OCCASION_TAGS = ['hang-ngay', 'di-lam', 'du-tiec', 'di-bien'] as const
export const ACCESSORY_TONE_TAGS = ['spring', 'summer', 'autumn', 'winter'] as const

export type AccessoryProduct = {
  id: number
  name: string
  imageUrl: string
  affiliateLink: string
  category: string
  styleTags: string[]
  occasionTags: string[]
  toneTags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

This file has no logic to unit test on its own (pure constants/types) — Step 2 tests it indirectly through `AccessoryList`.

- [ ] **Step 2: Write the failing `AccessoryList` test**

Create `frontend/components/admin/AccessoryList.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AccessoryList from './AccessoryList'
import type { AccessoryProduct } from '@/lib/accessories'

const PRODUCTS: AccessoryProduct[] = [
  {
    id: 1,
    name: 'Túi tote nâu',
    imageUrl: '/tote.png',
    affiliateLink: 'https://shop.example.com/tote',
    category: 'tui-xach',
    styleTags: ['casual'],
    occasionTags: ['hang-ngay'],
    toneTags: ['autumn'],
    isActive: true,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]

describe('AccessoryList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches and renders accessories with an edit link', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => PRODUCTS }))
    renderWithIntl(<AccessoryList />)

    await waitFor(() => expect(screen.getByText('Túi tote nâu')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: 'Sửa' })).toHaveAttribute('href', '/admin/accessories/1/edit')
  })

  it('deletes an accessory when confirmed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => PRODUCTS }).mockResolvedValueOnce({ ok: true })
    )
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderWithIntl(<AccessoryList />)

    await waitFor(() => expect(screen.getByText('Túi tote nâu')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))

    await waitFor(() => expect(screen.queryByText('Túi tote nâu')).not.toBeInTheDocument())
    expect(fetch).toHaveBeenCalledWith('/accessories/1', { method: 'DELETE', credentials: 'include' })
  })

  it('shows an empty state when there are no accessories', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    renderWithIntl(<AccessoryList />)
    await waitFor(() => expect(screen.getByText('Chưa có phụ kiện nào.')).toBeInTheDocument())
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd frontend
npx vitest run components/admin/AccessoryList.test.tsx
```

Expected: FAIL — `./AccessoryList` doesn't exist yet.

- [ ] **Step 4: Add the i18n keys**

Add to `frontend/messages/vi.json`, inside the `Admin` object (alongside `CapsuleList`):

```json
"AccessoryList": {
  "title": "Quản lý Phụ kiện",
  "newButton": "Thêm phụ kiện",
  "columnName": "Tên",
  "columnCategory": "Danh mục",
  "editButton": "Sửa",
  "deleteButton": "Xóa",
  "deleteConfirm": "Xóa phụ kiện này?",
  "emptyState": "Chưa có phụ kiện nào.",
  "loading": "Đang tải..."
}
```

- [ ] **Step 5: Implement `AccessoryList`**

Create `frontend/components/admin/AccessoryList.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { AccessoryProduct } from '@/lib/accessories'

export default function AccessoryList() {
  const t = useTranslations('Admin.AccessoryList')
  const [accessories, setAccessories] = useState<AccessoryProduct[] | null>(null)

  useEffect(() => {
    apiFetch('/accessories')
      .then((response) => response.json())
      .then(setAccessories)
  }, [])

  async function handleDelete(id: number) {
    if (!window.confirm(t('deleteConfirm'))) return
    await apiFetch(`/accessories/${id}`, { method: 'DELETE' })
    setAccessories((current) => current?.filter((item) => item.id !== id) ?? null)
  }

  if (accessories === null) {
    return <p className="text-body-md text-on-surface-variant">{t('loading')}</p>
  }

  if (accessories.length === 0) {
    return <p className="text-body-md text-on-surface-variant">{t('emptyState')}</p>
  }

  return (
    <table className="w-full text-left text-body-md">
      <thead>
        <tr className="border-b border-outline-variant text-label-sm text-on-surface-variant">
          <th className="py-2">{t('columnName')}</th>
          <th className="py-2">{t('columnCategory')}</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {accessories.map((accessory) => (
          <tr key={accessory.id} className="border-b border-outline-variant/50">
            <td className="py-3 font-semibold text-on-surface">{accessory.name}</td>
            <td className="py-3 text-on-surface-variant">{accessory.category}</td>
            <td className="py-3 text-right">
              <Link
                href={`/admin/accessories/${accessory.id}/edit`}
                className="mr-4 font-semibold text-primary hover:underline"
              >
                {t('editButton')}
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(accessory.id)}
                className="font-semibold text-error hover:underline"
              >
                {t('deleteButton')}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx vitest run components/admin/AccessoryList.test.tsx
```

Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add lib/accessories.ts components/admin/AccessoryList.tsx components/admin/AccessoryList.test.tsx messages/vi.json
git commit -m "feat: add accessories admin list component"
```

---

## Task 2: `AccessoryForm` admin component (upload, Gemini suggest, review, save)

**Files:**
- Create: `frontend/components/admin/AccessoryForm.tsx`
- Test: `frontend/components/admin/AccessoryForm.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: `AccessoryProduct`, `ACCESSORY_CATEGORIES`, `ACCESSORY_STYLE_TAGS`, `ACCESSORY_OCCASION_TAGS`, `ACCESSORY_TONE_TAGS` from `frontend/lib/accessories.ts` (Task 1).
- Produces: `AccessoryForm({ initialAccessory?: AccessoryProduct })` — consumed by Task 3's new/edit pages.

Note: the `'error'` step below only needs to handle the upload-URL request and the raw blob `PUT` failing — a Gemini failure specifically is already absorbed server-side by the backend plan's Task 3 (`/accessories/suggest-tags` falls back to an empty-but-valid suggestion instead of erroring), so `suggestResponse.ok` stays true and the admin lands on the normal review form with blank tag checkboxes to fill in by hand, satisfying the spec's "Gemini failure never blocks tagging" requirement without any extra branch here.

- [ ] **Step 1: Write the failing edit-mode test**

Create `frontend/components/admin/AccessoryForm.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AccessoryForm from './AccessoryForm'
import type { AccessoryProduct } from '@/lib/accessories'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

const EXISTING_ACCESSORY: AccessoryProduct = {
  id: 9,
  name: 'Túi tote nâu',
  imageUrl: '/tote.png',
  affiliateLink: 'https://shop.example.com/tote',
  category: 'tui-xach',
  styleTags: ['casual'],
  occasionTags: ['hang-ngay'],
  toneTags: ['autumn'],
  isActive: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('AccessoryForm', () => {
  afterEach(() => {
    pushMock.mockClear()
    vi.unstubAllGlobals()
  })

  it('pre-fills fields from initialAccessory and PUTs on submit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => EXISTING_ACCESSORY }))
    renderWithIntl(<AccessoryForm initialAccessory={EXISTING_ACCESSORY} />)

    expect(screen.getByLabelText('Tên phụ kiện')).toHaveValue('Túi tote nâu')
    expect(screen.getByLabelText('Link affiliate')).toHaveValue('https://shop.example.com/tote')

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/accessories'))
    expect(fetch).toHaveBeenCalledWith(
      '/accessories/9',
      expect.objectContaining({ method: 'PUT', credentials: 'include' })
    )
  })

  it('shows a generic error and does not redirect when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ detail: [] }) }))
    renderWithIntl(<AccessoryForm initialAccessory={EXISTING_ACCESSORY} />)

    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(screen.getByText('Có lỗi xảy ra, vui lòng thử lại.')).toBeInTheDocument())
    expect(pushMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run components/admin/AccessoryForm.test.tsx
```

Expected: FAIL — `./AccessoryForm` doesn't exist yet.

- [ ] **Step 3: Add the i18n keys**

Add to `frontend/messages/vi.json`, inside the `Admin` object (alongside `AccessoryList`):

```json
"AccessoryForm": {
  "pickFileTitle": "Tải ảnh phụ kiện lên",
  "pickFileHint": "Chọn một ảnh sản phẩm để AI gợi ý danh mục và tag.",
  "uploading": "Đang tải ảnh lên...",
  "errorMessage": "Có lỗi khi tải ảnh, vui lòng thử lại.",
  "fields": {
    "name": "Tên phụ kiện",
    "affiliateLink": "Link affiliate",
    "category": "Danh mục",
    "styleTags": "Phong cách phù hợp",
    "occasionTags": "Dịp phù hợp",
    "toneTags": "Tone màu phù hợp"
  },
  "categories": {
    "tui-xach": "Túi xách",
    "giay": "Giày",
    "trang-suc": "Trang sức",
    "mu-non": "Mũ nón",
    "khan": "Khăn"
  },
  "submitCreate": "Tạo phụ kiện",
  "submitEdit": "Lưu thay đổi",
  "saving": "Đang lưu...",
  "unauthorizedError": "Bạn cần đăng nhập với quyền quản trị.",
  "genericError": "Có lỗi xảy ra, vui lòng thử lại."
}
```

- [ ] **Step 4: Implement `AccessoryForm`**

Create `frontend/components/admin/AccessoryForm.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import {
  ACCESSORY_CATEGORIES,
  ACCESSORY_OCCASION_TAGS,
  ACCESSORY_STYLE_TAGS,
  ACCESSORY_TONE_TAGS,
  type AccessoryProduct,
} from '@/lib/accessories'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

type FormValues = {
  name: string
  affiliateLink: string
  imageUrl: string
  category: string
  styleTags: string[]
  occasionTags: string[]
  toneTags: string[]
}

type TagField = 'styleTags' | 'occasionTags' | 'toneTags'

type Suggestion = {
  category: string
  styleTags: string[]
  occasionTags: string[]
  toneTags: string[]
  blobUrl: string
}

type FlowState =
  | { step: 'pick' }
  | { step: 'uploading' }
  | { step: 'form'; values: FormValues }
  | { step: 'saving'; values: FormValues }
  | { step: 'error' }

function valuesFromAccessory(accessory: AccessoryProduct): FormValues {
  return {
    name: accessory.name,
    affiliateLink: accessory.affiliateLink,
    imageUrl: accessory.imageUrl,
    category: accessory.category,
    styleTags: accessory.styleTags,
    occasionTags: accessory.occasionTags,
    toneTags: accessory.toneTags,
  }
}

function valuesFromSuggestion(suggestion: Suggestion): FormValues {
  return {
    name: '',
    affiliateLink: '',
    imageUrl: suggestion.blobUrl,
    category: suggestion.category,
    styleTags: suggestion.styleTags,
    occasionTags: suggestion.occasionTags,
    toneTags: suggestion.toneTags,
  }
}

export default function AccessoryForm({ initialAccessory }: { initialAccessory?: AccessoryProduct }) {
  const t = useTranslations('Admin.AccessoryForm')
  const router = useRouter()
  const isEditing = Boolean(initialAccessory)

  const [state, setState] = useState<FlowState>(
    initialAccessory ? { step: 'form', values: valuesFromAccessory(initialAccessory) } : { step: 'pick' }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setState({ step: 'uploading' })

    const uploadUrlResponse = await apiFetch('/accessories/upload-url', { method: 'POST' })
    if (!uploadUrlResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const { uploadUrl, blobPath } = (await uploadUrlResponse.json()) as { uploadUrl: string; blobPath: string }

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'x-ms-blob-content-type': file.type },
      body: file,
    })
    if (!putResponse.ok) {
      setState({ step: 'error' })
      return
    }

    const suggestResponse = await apiFetch('/accessories/suggest-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blobPath }),
    })
    if (!suggestResponse.ok) {
      setState({ step: 'error' })
      return
    }
    const suggestion = (await suggestResponse.json()) as Suggestion
    setState({ step: 'form', values: valuesFromSuggestion(suggestion) })
  }

  function updateValues(patch: Partial<FormValues>) {
    if (state.step !== 'form') return
    setState({ step: 'form', values: { ...state.values, ...patch } })
  }

  function toggleTag(field: TagField, tag: string) {
    if (state.step !== 'form') return
    const current = state.values[field]
    updateValues({
      [field]: current.includes(tag) ? current.filter((existing) => existing !== tag) : [...current, tag],
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.step !== 'form') return
    const { values } = state
    setState({ step: 'saving', values })
    setErrors({})

    const response = await apiFetch(isEditing ? `/accessories/${initialAccessory!.id}` : '/accessories', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (response.status === 401 || response.status === 403) {
      setState({ step: 'form', values })
      setErrors({ form: t('unauthorizedError') })
      return
    }

    if (!response.ok) {
      setState({ step: 'form', values })
      setErrors({ form: t('genericError') })
      return
    }

    router.push('/admin/accessories')
  }

  if (state.step === 'pick') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-surface-container-lowest p-8 text-center shadow-sm">
        <span className="material-symbols-outlined text-[48px] text-primary">cloud_upload</span>
        <label htmlFor="accessoryUploadInput" className="cursor-pointer text-headline-sm font-semibold text-on-surface">
          {t('pickFileTitle')}
        </label>
        <p className="text-body-sm text-on-surface-variant">{t('pickFileHint')}</p>
        <input id="accessoryUploadInput" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    )
  }

  if (state.step === 'uploading') {
    return <p className="text-center text-body-md text-on-surface-variant">{t('uploading')}</p>
  }

  if (state.step === 'error') {
    return <p className="text-center text-body-md text-error">{t('errorMessage')}</p>
  }

  const { values } = state
  const isSaving = state.step === 'saving'

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={values.imageUrl} alt="" className="mx-auto h-40 w-40 object-contain" />

      <div className="space-y-1.5">
        <label htmlFor="accessory-name" className="text-label-md font-semibold text-on-surface">
          {t('fields.name')}
        </label>
        <input
          id="accessory-name"
          value={values.name}
          onChange={(event) => updateValues({ name: event.target.value })}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="accessory-affiliate-link" className="text-label-md font-semibold text-on-surface">
          {t('fields.affiliateLink')}
        </label>
        <input
          id="accessory-affiliate-link"
          value={values.affiliateLink}
          onChange={(event) => updateValues({ affiliateLink: event.target.value })}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="accessory-category" className="text-label-md font-semibold text-on-surface">
          {t('fields.category')}
        </label>
        <select
          id="accessory-category"
          value={values.category}
          onChange={(event) => updateValues({ category: event.target.value })}
          className={inputClass}
        >
          {ACCESSORY_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`categories.${category}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <span className="text-label-md font-semibold text-on-surface">{t('fields.styleTags')}</span>
        <div className="flex flex-wrap gap-2">
          {ACCESSORY_STYLE_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={values.styleTags.includes(tag)}
                onChange={() => toggleTag('styleTags', tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-label-md font-semibold text-on-surface">{t('fields.occasionTags')}</span>
        <div className="flex flex-wrap gap-2">
          {ACCESSORY_OCCASION_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={values.occasionTags.includes(tag)}
                onChange={() => toggleTag('occasionTags', tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-label-md font-semibold text-on-surface">{t('fields.toneTags')}</span>
        <div className="flex flex-wrap gap-2">
          {ACCESSORY_TONE_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={values.toneTags.includes(tag)}
                onChange={() => toggleTag('toneTags', tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      {errors.form && <p className="text-label-sm text-error">{errors.form}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
      >
        {isSaving ? t('saving') : isEditing ? t('submitEdit') : t('submitCreate')}
      </button>
    </form>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run components/admin/AccessoryForm.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 6: Write the failing create-flow test (upload → suggest → review → save)**

Add to `frontend/components/admin/AccessoryForm.test.tsx`:

```tsx
function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}) {
  return { ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }
}

it('walks through upload, Gemini suggestion, and creates on submit', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(jsonResponse({ uploadUrl: 'https://blob.example.com/upload?sig=abc', blobPath: 'x.png' }))
    .mockResolvedValueOnce({ ok: true }) // the raw PUT to blob storage
    .mockResolvedValueOnce(
      jsonResponse({
        category: 'tui-xach',
        styleTags: ['casual'],
        occasionTags: ['hang-ngay'],
        toneTags: ['autumn'],
        blobUrl: 'https://blob.example.com/x.png',
      })
    )
    .mockResolvedValueOnce(jsonResponse({ id: 1 }, { status: 201 }))
  vi.stubGlobal('fetch', fetchMock)

  renderWithIntl(<AccessoryForm />)

  const file = new File(['fake-image'], 'tote.png', { type: 'image/png' })
  fireEvent.change(screen.getByLabelText('Tải ảnh phụ kiện lên'), { target: { files: [file] } })

  await waitFor(() => expect(screen.getByLabelText('Tên phụ kiện')).toBeInTheDocument())
  expect(screen.getByRole('checkbox', { name: 'casual' })).toBeChecked()

  fireEvent.change(screen.getByLabelText('Tên phụ kiện'), { target: { value: 'Túi tote nâu' } })
  fireEvent.change(screen.getByLabelText('Link affiliate'), { target: { value: 'https://shop.example.com/tote' } })
  fireEvent.click(screen.getByRole('button', { name: 'Tạo phụ kiện' }))

  await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/admin/accessories'))
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/accessories',
    expect.objectContaining({ method: 'POST', credentials: 'include' })
  )
})
```

- [ ] **Step 7: Run test to verify it fails**

```bash
npx vitest run components/admin/AccessoryForm.test.tsx
```

Expected: FAIL — the label `'Tải ảnh phụ kiện lên'` isn't associated with the file input as an accessible name yet (the current markup uses a `<label htmlFor>` wrapping visible text, which Testing Library *should* already resolve — if this instead fails on a later assertion, that confirms the flow itself has a bug to fix, which is the point of watching it fail before trusting it).

- [ ] **Step 8: Fix the implementation if the failure was real, otherwise confirm the file's behavior already covers it**

The implementation from Step 4 already wires `handleFileChange` to the `pick` step's file input and drives `uploading` → `form` with the Gemini suggestion — no code change should be needed here if Step 4 was implemented as written. Re-run:

```bash
npx vitest run components/admin/AccessoryForm.test.tsx
```

Expected: PASS (3 tests). If it still fails, the most likely cause is the label/input association — `getByLabelText` requires the `<label htmlFor="accessoryUploadInput">` to match the `<input id="accessoryUploadInput">` exactly (already true in Step 4's code); double-check no typo was introduced.

- [ ] **Step 9: Commit**

```bash
git add components/admin/AccessoryForm.tsx components/admin/AccessoryForm.test.tsx messages/vi.json
git commit -m "feat: add accessories admin form with Gemini auto-tag suggestion"
```

---

## Task 3: Admin routes + dashboard entry

**Files:**
- Create: `frontend/app/admin/accessories/page.tsx`
- Create: `frontend/app/admin/accessories/new/page.tsx`
- Create: `frontend/app/admin/accessories/[id]/edit/page.tsx`
- Modify: `frontend/components/auth/AdminDashboard.tsx`
- Modify: `frontend/components/auth/AdminDashboard.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: `AccessoryList` (Task 1), `AccessoryForm` (Task 2), `AccessoryProduct` type (Task 1).

- [ ] **Step 1: Write the failing dashboard-link test**

Add one assertion line to the existing test in `frontend/components/auth/AdminDashboard.test.tsx`, inside the `it('links to the blog and quiz admin sections', ...)` test, after the existing `Quản lý Hộp thư` assertion:

```tsx
    expect(screen.getByRole('link', { name: /Quản lý Phụ kiện/ })).toHaveAttribute('href', '/admin/accessories')
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run components/auth/AdminDashboard.test.tsx
```

Expected: FAIL — no such link exists yet.

- [ ] **Step 3: Add the dashboard card i18n keys**

Add to `frontend/messages/vi.json`, inside the `Admin` object at the same level as `capsuleCardTitle`/`capsuleCardDescription`:

```json
"accessoriesCardTitle": "Quản lý Phụ kiện",
"accessoriesCardDescription": "Quản lý danh sách phụ kiện gợi ý và link affiliate.",
```

- [ ] **Step 4: Add the dashboard card**

In `frontend/components/auth/AdminDashboard.tsx`, add a new `<Link>` block after the existing `/admin/capsule-wardrobe` card:

```tsx
          <Link
            href="/admin/accessories"
            className="rounded-2xl border border-outline-variant p-6 transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            <h2 className="text-title-md font-bold text-on-surface">{t('accessoriesCardTitle')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('accessoriesCardDescription')}</p>
          </Link>
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run components/auth/AdminDashboard.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Create the three route pages**

Create `frontend/app/admin/accessories/page.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import AdminGate from '@/components/auth/AdminGate'
import AccessoryList from '@/components/admin/AccessoryList'

export default function AdminAccessoriesPage() {
  const t = useTranslations('Admin.AccessoryList')

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-5xl px-6 py-space-xl lg:py-24">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-headline-md font-bold text-on-surface">{t('title')}</h1>
            <Link
              href="/admin/accessories/new"
              className="rounded-full bg-primary px-6 py-3 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('newButton')}
            </Link>
          </div>
          <AccessoryList />
        </section>
      </AdminGate>
    </main>
  )
}
```

Create `frontend/app/admin/accessories/new/page.tsx`:

```tsx
'use client'

import AdminGate from '@/components/auth/AdminGate'
import AccessoryForm from '@/components/admin/AccessoryForm'

export default function NewAccessoryPage() {
  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          <AccessoryForm />
        </section>
      </AdminGate>
    </main>
  )
}
```

Create `frontend/app/admin/accessories/[id]/edit/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import AdminGate from '@/components/auth/AdminGate'
import AccessoryForm from '@/components/admin/AccessoryForm'
import { apiFetch } from '@/lib/apiClient'
import type { AccessoryProduct } from '@/lib/accessories'

export default function EditAccessoryPage({ params }: { params: Promise<{ id: string }> }) {
  const [accessory, setAccessory] = useState<AccessoryProduct | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      apiFetch(`/accessories/${id}`)
        .then((response) => response.json())
        .then(setAccessory)
    })
  }, [params])

  return (
    <main className="w-full bg-surface">
      <AdminGate>
        <section className="mx-auto w-full max-w-3xl px-6 py-space-xl lg:py-24">
          {accessory && <AccessoryForm initialAccessory={accessory} />}
        </section>
      </AdminGate>
    </main>
  )
}
```

These three pages are thin wiring with no logic of their own (identical shape to the already-tested `capsule-wardrobe` admin pages) — they're covered by this task's dashboard-link test plus Tasks 1-2's component tests, not by dedicated page tests, matching how `capsule-wardrobe`'s pages have no page-level test files either.

- [ ] **Step 7: Typecheck and lint**

```bash
npx tsc --noEmit
npx eslint app/admin/accessories components/auth/AdminDashboard.tsx
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add app/admin/accessories components/auth/AdminDashboard.tsx components/auth/AdminDashboard.test.tsx messages/vi.json
git commit -m "feat: add accessories admin routes and dashboard entry"
```

---

## Task 4: `AccessoryRecommendations` (user-facing) + Step 4 responsive layout

**Files:**
- Create: `frontend/components/outfit/step4/AccessoryRecommendations.tsx`
- Test: `frontend/components/outfit/step4/AccessoryRecommendations.test.tsx`
- Modify: `frontend/components/outfit/step4/Step4PageContent.tsx`
- Modify: `frontend/components/outfit/step4/Step4PageContent.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: `useOutfitFlow()` from `../OutfitFlowProvider` (`selectedOccasion: OccasionTag`, `selectedStyle: StyleTag`, both already implemented).
- Produces: `AccessoryRecommendations` component (renders `null` when there are no recommendations) — consumed by `Step4PageContent`.

Note on scope: the spec describes this section appearing "once the try-on job is done." Wiring that precisely would require lifting `ResultPreview`'s internal job-status state up into `Step4PageContent`, which `ResultPreview` doesn't currently expose. Since the recommendation only depends on the occasion/style chosen in Step 1 — not on the generated try-on image — this plan renders it as soon as Step 4 mounts instead, which is simpler and has no user-visible downside (there's no reason to delay a recommendation that's already computable). If a future change makes `ResultPreview` expose its status, gating on it is a one-line addition, not a redesign.

- [ ] **Step 1: Write the failing test**

Create `frontend/components/outfit/step4/AccessoryRecommendations.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import AccessoryRecommendations from './AccessoryRecommendations'
import { OutfitFlowProvider } from '../OutfitFlowProvider'

function jsonResponse(body: unknown, init: { ok?: boolean } = {}) {
  return { ok: init.ok ?? true, json: async () => body }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AccessoryRecommendations', () => {
  it('renders recommended accessories with a working buy link', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse([
          {
            id: 1,
            name: 'Túi tote nâu',
            imageUrl: '/tote.png',
            affiliateLink: 'https://shop.example.com/tote',
            category: 'tui-xach',
          },
        ])
      )
    )

    renderWithIntl(
      <OutfitFlowProvider>
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(screen.getByText('Túi tote nâu')).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /Túi tote nâu/ })).toHaveAttribute(
      'href',
      'https://shop.example.com/tote'
    )
  })

  it('requests recommendations using the selected occasion and style', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    renderWithIntl(
      <OutfitFlowProvider>
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/accessories/recommendations?occasion=hang-ngay&style=casual'),
        expect.anything()
      )
    )
  })

  it('renders nothing when there are no recommendations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])))

    const { container } = renderWithIntl(
      <OutfitFlowProvider>
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, { ok: false })))

    const { container } = renderWithIntl(
      <OutfitFlowProvider>
        <AccessoryRecommendations />
      </OutfitFlowProvider>
    )

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run components/outfit/step4/AccessoryRecommendations.test.tsx
```

Expected: FAIL — `./AccessoryRecommendations` doesn't exist yet.

- [ ] **Step 3: Add the i18n keys**

Add to `frontend/messages/vi.json`, inside the `Outfit.Step4` object (alongside `Page`/`ResultPreview`):

```json
"AccessoryRecommendations": {
  "heading": "Phụ kiện gợi ý cho bạn",
  "buyNowButton": "Mua ngay",
  "buyNowAriaLabel": "Mua ngay {name} (mở tab mới)"
}
```

- [ ] **Step 4: Implement `AccessoryRecommendations`**

Create `frontend/components/outfit/step4/AccessoryRecommendations.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useOutfitFlow } from '../OutfitFlowProvider'

type Accessory = {
  id: number
  name: string
  imageUrl: string
  affiliateLink: string
  category: string
}

export default function AccessoryRecommendations() {
  const t = useTranslations('Outfit.Step4.AccessoryRecommendations')
  const { selectedOccasion, selectedStyle } = useOutfitFlow()
  const [accessories, setAccessories] = useState<Accessory[]>([])

  useEffect(() => {
    let cancelled = false

    apiFetch(
      `/accessories/recommendations?occasion=${encodeURIComponent(selectedOccasion)}&style=${encodeURIComponent(selectedStyle)}`
    )
      .then(async (response) => {
        if (cancelled || !response.ok) return
        setAccessories((await response.json()) as Accessory[])
      })
      .catch(() => {
        if (!cancelled) setAccessories([])
      })

    return () => {
      cancelled = true
    }
  }, [selectedOccasion, selectedStyle])

  if (accessories.length === 0) return null

  return (
    <section
      aria-labelledby="accessory-recommendations-heading"
      className="flex flex-col gap-space-sm lg:col-span-5 lg:self-end"
    >
      <h2 id="accessory-recommendations-heading" className="text-label-lg font-bold text-on-surface">
        {t('heading')}
      </h2>
      <div className="flex snap-x snap-mandatory gap-space-sm overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {accessories.map((accessory) => (
          <div
            key={accessory.id}
            className="flex w-40 flex-shrink-0 snap-start flex-col gap-2 rounded-2xl bg-surface-container-lowest p-3 shadow-sm lg:w-full lg:flex-row lg:items-center lg:gap-3"
          >
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-surface-container lg:w-16 lg:flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={accessory.imageUrl} alt={accessory.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <span className="line-clamp-2 text-label-md font-semibold text-on-surface">{accessory.name}</span>
              <a
                href={accessory.affiliateLink}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-label={t('buyNowAriaLabel', { name: accessory.name })}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-4 text-label-sm font-semibold text-on-primary"
              >
                {t('buyNowButton')}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx vitest run components/outfit/step4/AccessoryRecommendations.test.tsx
```

Expected: PASS (4 tests).

- [ ] **Step 6: Wire it into `Step4PageContent` with the responsive grid layout**

Read the current `frontend/components/outfit/step4/Step4PageContent.tsx` first — it should still match this shape (no changes since the QR/AR-filter fix from earlier this session, which didn't touch this file):

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import ResultPreview from './ResultPreview'

export default function Step4PageContent() {
  const t = useTranslations('Outfit.Step4.Page')
  const router = useRouter()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-space-lg px-margin-desktop py-space-xl">
      <h1 className="text-headline-lg text-on-surface">{t('heading')}</h1>
      <div className="w-full">
        <ResultPreview />
      </div>
      <button
        type="button"
        onClick={() => router.push('/outfit/step-1')}
        className="flex items-center justify-center gap-space-sm rounded-full bg-primary px-space-xl py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg"
      >
        <span className="material-symbols-outlined text-[20px]">refresh</span>
        <span>{t('newOutfitButton')}</span>
      </button>
    </div>
  )
}
```

Replace it with:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import AccessoryRecommendations from './AccessoryRecommendations'
import ResultPreview from './ResultPreview'

export default function Step4PageContent() {
  const t = useTranslations('Outfit.Step4.Page')
  const router = useRouter()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-space-lg px-margin-desktop py-space-xl lg:max-w-6xl">
      <h1 className="text-headline-lg text-on-surface">{t('heading')}</h1>
      <div className="grid w-full grid-cols-1 items-start gap-space-lg lg:grid-cols-12 lg:items-end lg:gap-8">
        <div className="w-full lg:col-span-7">
          <ResultPreview />
        </div>
        <AccessoryRecommendations />
      </div>
      <button
        type="button"
        onClick={() => router.push('/outfit/step-1')}
        className="flex items-center justify-center gap-space-sm rounded-full bg-primary px-space-xl py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container hover:shadow-lg"
      >
        <span className="material-symbols-outlined text-[20px]">refresh</span>
        <span>{t('newOutfitButton')}</span>
      </button>
    </div>
  )
}
```

The layout mechanics: on `lg+`, the grid becomes 12 columns with `items-end`; `ResultPreview`'s wrapper takes columns 1-7, `AccessoryRecommendations` takes columns 8-12 (set on its own root `<section>`, per Step 4 above) and — being shorter than the result image — sinks to the bottom of the row because of `items-end`, which is the "bottom-right corner" placement from the design. Below `lg`, it's a single column, image first, accessories carousel below (source order = visual order, no `order-*` needed). When `AccessoryRecommendations` renders `null` (no recommendations), the grid simply collapses to one visible cell — no gap or empty box left behind.

- [ ] **Step 7: Update the existing `Step4PageContent` test to stub fetch**

`AccessoryRecommendations` now fetches on mount as part of `Step4PageContent`. Update `frontend/components/outfit/step4/Step4PageContent.test.tsx` to stub a fetch that resolves to an empty list, so the existing tests don't trigger a real network call:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import Step4PageContent from './Step4PageContent'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('Step4PageContent', () => {
  beforeEach(() => {
    pushMock.mockClear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the result heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ' })).toBeInTheDocument()
  })

  it('starts a new outfit at step 1 when clicking Phối Đồ Mới', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4PageContent />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Phối Đồ Mới/ }))
    expect(pushMock).toHaveBeenCalledWith('/outfit/step-1')
  })
})
```

(Only the `beforeEach`/`afterEach` and the added `vi.stubGlobal('fetch', ...)` line are new — the two `it` blocks are unchanged from before.)

- [ ] **Step 8: Run the full outfit step 4 test suite**

```bash
npx vitest run components/outfit/step4
```

Expected: all tests PASS (`ResultPreview`, `Step4PageContent`, `AccessoryRecommendations`).

- [ ] **Step 9: Typecheck, lint, and full test suite**

```bash
npx tsc --noEmit
npx eslint components/outfit/step4
npx vitest run
```

Expected: no type errors, no lint errors, full suite green (aside from any pre-existing unrelated failures already present on the branch before this task — confirm with `git stash` if anything unexpected fails).

- [ ] **Step 10: Manually verify the responsive layout in a browser**

jsdom/Vitest cannot verify actual grid alignment, so this must be checked visually — this is the step the design spec calls out as "verified manually in a browser," not automated:

```bash
npm run dev
```

With the backend also running (so `/accessories/recommendations` returns real data — seed at least one accessory via `POST /accessories` as an admin first, otherwise the section legitimately renders nothing), open `/outfit/step-4` after completing the outfit flow, and check at each of 320px, 375px, 414px, 768px, 1024px, and 1440px viewport widths (matching this project's established breakpoint-testing convention):

- At ≥1024px (`lg`): the accessories panel sits to the right of the result image, bottom-aligned with it (not top-aligned) — confirms `items-end` is working.
- Below 1024px: single column, result image on top, accessories below it as a horizontally-scrollable row with visible snap points — confirms the carousel, not a vertical stack, renders on mobile.
- With zero accessories seeded (or occasion/style that matches nothing before Task 4 of the backend plan's fallback kicks in): the section is fully absent, no leftover empty box or gap in the grid.

- [ ] **Step 11: Commit**

```bash
git add components/outfit/step4 messages/vi.json
git commit -m "feat: show accessory recommendations on the outfit result page"
```
