'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { UNDERTONES, type CatalogModel, type Undertone } from '@/lib/modelCatalog'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function ModelForm({ initialModel }: { initialModel?: CatalogModel }) {
  const t = useTranslations('Admin.ModelForm')
  const router = useRouter()
  const isEditing = Boolean(initialModel)

  const [name, setName] = useState(initialModel?.name ?? '')
  const [image, setImage] = useState(initialModel?.image ?? '')
  const [dossierImage, setDossierImage] = useState(initialModel?.dossierImage ?? '')
  const [poseCount, setPoseCount] = useState(String(initialModel?.poseCount ?? ''))
  const [tagline, setTagline] = useState(initialModel?.tagline ?? '')
  const [undertone, setUndertone] = useState<Undertone>(initialModel?.undertone ?? UNDERTONES[0])
  const [height, setHeight] = useState(initialModel?.height ?? '')
  const [bodyShape, setBodyShape] = useState(initialModel?.bodyShape ?? '')
  const [waist, setWaist] = useState(initialModel?.waist ?? '')
  const [personalColor, setPersonalColor] = useState(initialModel?.personalColor ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = {
      name,
      image,
      dossierImage,
      poseCount: Number(poseCount),
      tagline,
      undertone,
      height,
      bodyShape,
      waist,
      personalColor,
    }

    const response = await apiFetch(isEditing ? `/model-catalog/${initialModel!.id}` : '/model-catalog', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSubmitting(false)

    if (response.status === 401 || response.status === 403) {
      setErrors({ form: t('unauthorizedError') })
      return
    }

    if (!response.ok) {
      setErrors({ form: t('genericError') })
      return
    }

    router.push('/admin/model-catalog')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="model-name" className="text-label-md font-semibold text-on-surface">
          {t('fields.name')}
        </label>
        <input id="model-name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        {errors.name && <p className="text-label-sm text-error">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="model-image" className="text-label-md font-semibold text-on-surface">
            {t('fields.image')}
          </label>
          <input
            id="model-image"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            className={inputClass}
          />
          {errors.image && <p className="text-label-sm text-error">{errors.image}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="model-dossier-image" className="text-label-md font-semibold text-on-surface">
            {t('fields.dossierImage')}
          </label>
          <input
            id="model-dossier-image"
            value={dossierImage}
            onChange={(event) => setDossierImage(event.target.value)}
            className={inputClass}
          />
          {errors.dossierImage && <p className="text-label-sm text-error">{errors.dossierImage}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="model-pose-count" className="text-label-md font-semibold text-on-surface">
            {t('fields.poseCount')}
          </label>
          <input
            id="model-pose-count"
            type="number"
            value={poseCount}
            onChange={(event) => setPoseCount(event.target.value)}
            className={inputClass}
          />
          {errors.poseCount && <p className="text-label-sm text-error">{errors.poseCount}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="model-tagline" className="text-label-md font-semibold text-on-surface">
            {t('fields.tagline')}
          </label>
          <input
            id="model-tagline"
            value={tagline}
            onChange={(event) => setTagline(event.target.value)}
            className={inputClass}
          />
          {errors.tagline && <p className="text-label-sm text-error">{errors.tagline}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="model-undertone" className="text-label-md font-semibold text-on-surface">
          {t('fields.undertone')}
        </label>
        <select
          id="model-undertone"
          value={undertone}
          onChange={(event) => setUndertone(event.target.value as Undertone)}
          className={inputClass}
        >
          {UNDERTONES.map((value) => (
            <option key={value} value={value}>
              {t(`undertones.${value}`)}
            </option>
          ))}
        </select>
        {errors.undertone && <p className="text-label-sm text-error">{errors.undertone}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="model-height" className="text-label-md font-semibold text-on-surface">
            {t('fields.height')}
          </label>
          <input
            id="model-height"
            value={height}
            onChange={(event) => setHeight(event.target.value)}
            className={inputClass}
          />
          {errors.height && <p className="text-label-sm text-error">{errors.height}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="model-body-shape" className="text-label-md font-semibold text-on-surface">
            {t('fields.bodyShape')}
          </label>
          <input
            id="model-body-shape"
            value={bodyShape}
            onChange={(event) => setBodyShape(event.target.value)}
            className={inputClass}
          />
          {errors.bodyShape && <p className="text-label-sm text-error">{errors.bodyShape}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="model-waist" className="text-label-md font-semibold text-on-surface">
            {t('fields.waist')}
          </label>
          <input
            id="model-waist"
            value={waist}
            onChange={(event) => setWaist(event.target.value)}
            className={inputClass}
          />
          {errors.waist && <p className="text-label-sm text-error">{errors.waist}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="model-personal-color" className="text-label-md font-semibold text-on-surface">
          {t('fields.personalColor')}
        </label>
        <input
          id="model-personal-color"
          value={personalColor}
          onChange={(event) => setPersonalColor(event.target.value)}
          className={inputClass}
        />
        {errors.personalColor && <p className="text-label-sm text-error">{errors.personalColor}</p>}
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
