'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { FAQ_CATEGORIES, FAQ_HIGHLIGHT_ICONS, type FaqCategory, type FaqHighlightIcon, type FaqItem } from '@/lib/faq'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

const CATEGORY_LABEL_KEYS: Record<FaqCategory, string> = {
  'personal-color': 'personalColor',
  'fitting-room': 'fittingRoom',
  account: 'account',
  stylist: 'stylist',
}

export default function FaqForm({ initialItem }: { initialItem?: FaqItem }) {
  const t = useTranslations('Admin.FaqForm')
  const tCategories = useTranslations('Faq.CategoryTabs.categories')
  const router = useRouter()
  const isEditing = Boolean(initialItem)

  const [question, setQuestion] = useState(initialItem?.question ?? '')
  const [answerMarkdown, setAnswerMarkdown] = useState(initialItem?.answerMarkdown ?? '')
  const [categories, setCategories] = useState<FaqCategory[]>(initialItem?.categories ?? [])
  const [highlightIcon, setHighlightIcon] = useState<FaqHighlightIcon | ''>(initialItem?.highlightIcon ?? '')
  const [highlightText, setHighlightText] = useState(initialItem?.highlightText ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function toggleCategory(category: FaqCategory) {
    setCategories((current) =>
      current.includes(category) ? current.filter((value) => value !== category) : [...current, category]
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = {
      question,
      answerMarkdown,
      categories,
      highlightIcon: highlightIcon || null,
      highlightText: highlightText.trim() || null,
    }

    const response = await fetch(isEditing ? `/api/faq/${initialItem!.id}` : '/api/faq', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

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

    router.push('/admin/faq')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="faq-question" className="text-label-md font-semibold text-on-surface">
          {t('fields.question')}
        </label>
        <input
          id="faq-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className={inputClass}
        />
        {errors.question && <p className="text-label-sm text-error">{errors.question}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="faq-answer" className="text-label-md font-semibold text-on-surface">
          {t('fields.answerMarkdown')}
        </label>
        <textarea
          id="faq-answer"
          rows={6}
          value={answerMarkdown}
          onChange={(event) => setAnswerMarkdown(event.target.value)}
          className={inputClass}
        />
        {errors.answerMarkdown && <p className="text-label-sm text-error">{errors.answerMarkdown}</p>}
      </div>

      <div className="space-y-1.5">
        <span className="text-label-md font-semibold text-on-surface">{t('fields.categories')}</span>
        <div className="flex flex-wrap gap-4">
          {FAQ_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center gap-2 text-body-md text-on-surface">
              <input
                type="checkbox"
                checked={categories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              {tCategories(CATEGORY_LABEL_KEYS[category])}
            </label>
          ))}
        </div>
        {errors.categories && <p className="text-label-sm text-error">{errors.categories}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="faq-highlight-icon" className="text-label-md font-semibold text-on-surface">
            {t('fields.highlightIcon')}
          </label>
          <select
            id="faq-highlight-icon"
            value={highlightIcon}
            onChange={(event) => setHighlightIcon(event.target.value as FaqHighlightIcon | '')}
            className={inputClass}
          >
            <option value="">{t('fields.highlightIconNone')}</option>
            {FAQ_HIGHLIGHT_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
          {errors.highlightIcon && <p className="text-label-sm text-error">{errors.highlightIcon}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="faq-highlight-text" className="text-label-md font-semibold text-on-surface">
            {t('fields.highlightText')}
          </label>
          <input
            id="faq-highlight-text"
            value={highlightText}
            onChange={(event) => setHighlightText(event.target.value)}
            className={inputClass}
          />
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
