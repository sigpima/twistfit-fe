'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { TAG_VARIANTS, type CapsuleItem, type CapsuleSet, type TagVariant } from '@/lib/capsuleWardrobe'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

function initialItems(initialSet?: CapsuleSet): CapsuleItem[] {
  if (initialSet) return initialSet.items.map((item) => ({ ...item }))
  return [
    { label: '', price: '' },
    { label: '', price: '' },
  ]
}

export default function CapsuleForm({ initialSet }: { initialSet?: CapsuleSet }) {
  const t = useTranslations('Admin.CapsuleForm')
  const router = useRouter()
  const isEditing = Boolean(initialSet)

  const [image, setImage] = useState(initialSet?.image ?? '')
  const [alt, setAlt] = useState(initialSet?.alt ?? '')
  const [tagVariant, setTagVariant] = useState<TagVariant>(initialSet?.tagVariant ?? TAG_VARIANTS[0])
  const [tagLabel, setTagLabel] = useState(initialSet?.tagLabel ?? '')
  const [fitFor, setFitFor] = useState(initialSet?.fitFor ?? '')
  const [title, setTitle] = useState(initialSet?.title ?? '')
  const [tone, setTone] = useState(initialSet?.tone ?? '')
  const [description, setDescription] = useState(initialSet?.description ?? '')
  const [items, setItems] = useState<CapsuleItem[]>(() => initialItems(initialSet))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function updateItem(index: number, patch: Partial<CapsuleItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    setItems((current) => [...current, { label: '', price: '' }])
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = { image, alt, tagVariant, tagLabel, fitFor, title, tone, description, items }

    const response = await fetch(
      isEditing ? `/api/capsule-wardrobe/${initialSet!.id}` : '/api/capsule-wardrobe',
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    setSubmitting(false)

    if (response.status === 401) {
      setErrors({ form: t('unauthorizedError') })
      return
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setErrors(data.errors ?? { form: t('genericError') })
      return
    }

    router.push('/admin/capsule-wardrobe')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="capsule-title" className="text-label-md font-semibold text-on-surface">
          {t('fields.title')}
        </label>
        <input id="capsule-title" value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        {errors.title && <p className="text-label-sm text-error">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="capsule-image" className="text-label-md font-semibold text-on-surface">
            {t('fields.image')}
          </label>
          <input
            id="capsule-image"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            className={inputClass}
          />
          {errors.image && <p className="text-label-sm text-error">{errors.image}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="capsule-alt" className="text-label-md font-semibold text-on-surface">
            {t('fields.alt')}
          </label>
          <input id="capsule-alt" value={alt} onChange={(event) => setAlt(event.target.value)} className={inputClass} />
          {errors.alt && <p className="text-label-sm text-error">{errors.alt}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="capsule-tag-variant" className="text-label-md font-semibold text-on-surface">
            {t('fields.tagVariant')}
          </label>
          <select
            id="capsule-tag-variant"
            value={tagVariant}
            onChange={(event) => setTagVariant(event.target.value as TagVariant)}
            className={inputClass}
          >
            {TAG_VARIANTS.map((variant) => (
              <option key={variant} value={variant}>
                {t(`tagVariants.${variant}`)}
              </option>
            ))}
          </select>
          {errors.tagVariant && <p className="text-label-sm text-error">{errors.tagVariant}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="capsule-tag-label" className="text-label-md font-semibold text-on-surface">
            {t('fields.tagLabel')}
          </label>
          <input
            id="capsule-tag-label"
            value={tagLabel}
            onChange={(event) => setTagLabel(event.target.value)}
            className={inputClass}
          />
          {errors.tagLabel && <p className="text-label-sm text-error">{errors.tagLabel}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="capsule-fit-for" className="text-label-md font-semibold text-on-surface">
            {t('fields.fitFor')}
          </label>
          <input
            id="capsule-fit-for"
            value={fitFor}
            onChange={(event) => setFitFor(event.target.value)}
            className={inputClass}
          />
          {errors.fitFor && <p className="text-label-sm text-error">{errors.fitFor}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="capsule-tone" className="text-label-md font-semibold text-on-surface">
            {t('fields.tone')}
          </label>
          <input id="capsule-tone" value={tone} onChange={(event) => setTone(event.target.value)} className={inputClass} />
          {errors.tone && <p className="text-label-sm text-error">{errors.tone}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="capsule-description" className="text-label-md font-semibold text-on-surface">
          {t('fields.description')}
        </label>
        <textarea
          id="capsule-description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
        />
        {errors.description && <p className="text-label-sm text-error">{errors.description}</p>}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-1 space-y-1.5">
              <label htmlFor={`item-label-${index}`} className="text-label-md font-semibold text-on-surface">
                {t('itemLabel')} {index + 1}
              </label>
              <input
                id={`item-label-${index}`}
                value={item.label}
                onChange={(event) => updateItem(index, { label: event.target.value })}
                className={inputClass}
              />
              {errors[`items.${index}.label`] && (
                <p className="text-label-sm text-error">{errors[`items.${index}.label`]}</p>
              )}
            </div>
            <div className="w-40 space-y-1.5">
              <label htmlFor={`item-price-${index}`} className="text-label-md font-semibold text-on-surface">
                {t('itemPrice')}
              </label>
              <input
                id={`item-price-${index}`}
                value={item.price}
                onChange={(event) => updateItem(index, { price: event.target.value })}
                className={inputClass}
              />
              {errors[`items.${index}.price`] && (
                <p className="text-label-sm text-error">{errors[`items.${index}.price`]}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="mt-8 text-label-md font-semibold text-error hover:underline"
            >
              {t('removeItem')}
            </button>
          </div>
        ))}
        {errors.items && <p className="text-label-sm text-error">{errors.items}</p>}
        <button type="button" onClick={addItem} className="text-label-md font-semibold text-primary hover:underline">
          {t('addItem')}
        </button>
      </div>

      {errors.form && <p className="text-label-sm text-error">{errors.form}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container disabled:opacity-60"
      >
        {isEditing ? t('submitEdit') : t('submitCreate')}
      </button>
    </form>
  )
}
