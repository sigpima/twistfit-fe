'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { COLOR_VARIANTS, type ColorVariant, type TeamMember } from '@/lib/team'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

export default function TeamForm({ initialMember }: { initialMember?: TeamMember }) {
  const t = useTranslations('Admin.TeamForm')
  const router = useRouter()
  const isEditing = Boolean(initialMember)

  const [image, setImage] = useState(initialMember?.image ?? '')
  const [name, setName] = useState(initialMember?.name ?? '')
  const [role, setRole] = useState(initialMember?.role ?? '')
  const [bio, setBio] = useState(initialMember?.bio ?? '')
  const [badgeVariant, setBadgeVariant] = useState<ColorVariant>(initialMember?.badgeVariant ?? COLOR_VARIANTS[0])
  const [roleVariant, setRoleVariant] = useState<ColorVariant>(initialMember?.roleVariant ?? COLOR_VARIANTS[0])
  const [footerIcon, setFooterIcon] = useState(initialMember?.footerIcon ?? '')
  const [footerLabel, setFooterLabel] = useState(initialMember?.footerLabel ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = { image, name, role, bio, badgeVariant, roleVariant, footerIcon, footerLabel }

    const response = await apiFetch(isEditing ? `/team/${initialMember!.id}` : '/team', {
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

    router.push('/admin/team')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="team-name" className="text-label-md font-semibold text-on-surface">
          {t('fields.name')}
        </label>
        <input id="team-name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        {errors.name && <p className="text-label-sm text-error">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="team-role" className="text-label-md font-semibold text-on-surface">
            {t('fields.role')}
          </label>
          <input id="team-role" value={role} onChange={(event) => setRole(event.target.value)} className={inputClass} />
          {errors.role && <p className="text-label-sm text-error">{errors.role}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="team-image" className="text-label-md font-semibold text-on-surface">
            {t('fields.image')}
          </label>
          <input
            id="team-image"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            className={inputClass}
          />
          {errors.image && <p className="text-label-sm text-error">{errors.image}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="team-bio" className="text-label-md font-semibold text-on-surface">
          {t('fields.bio')}
        </label>
        <textarea id="team-bio" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} className={inputClass} />
        {errors.bio && <p className="text-label-sm text-error">{errors.bio}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="team-badge-variant" className="text-label-md font-semibold text-on-surface">
            {t('fields.badgeVariant')}
          </label>
          <select
            id="team-badge-variant"
            value={badgeVariant}
            onChange={(event) => setBadgeVariant(event.target.value as ColorVariant)}
            className={inputClass}
          >
            {COLOR_VARIANTS.map((variant) => (
              <option key={variant} value={variant}>
                {t(`colorVariants.${variant}`)}
              </option>
            ))}
          </select>
          {errors.badgeVariant && <p className="text-label-sm text-error">{errors.badgeVariant}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="team-role-variant" className="text-label-md font-semibold text-on-surface">
            {t('fields.roleVariant')}
          </label>
          <select
            id="team-role-variant"
            value={roleVariant}
            onChange={(event) => setRoleVariant(event.target.value as ColorVariant)}
            className={inputClass}
          >
            {COLOR_VARIANTS.map((variant) => (
              <option key={variant} value={variant}>
                {t(`colorVariants.${variant}`)}
              </option>
            ))}
          </select>
          {errors.roleVariant && <p className="text-label-sm text-error">{errors.roleVariant}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="team-footer-icon" className="text-label-md font-semibold text-on-surface">
            {t('fields.footerIcon')}
          </label>
          <input
            id="team-footer-icon"
            value={footerIcon}
            onChange={(event) => setFooterIcon(event.target.value)}
            className={inputClass}
          />
          {errors.footerIcon && <p className="text-label-sm text-error">{errors.footerIcon}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="team-footer-label" className="text-label-md font-semibold text-on-surface">
            {t('fields.footerLabel')}
          </label>
          <input
            id="team-footer-label"
            value={footerLabel}
            onChange={(event) => setFooterLabel(event.target.value)}
            className={inputClass}
          />
          {errors.footerLabel && <p className="text-label-sm text-error">{errors.footerLabel}</p>}
        </div>
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
