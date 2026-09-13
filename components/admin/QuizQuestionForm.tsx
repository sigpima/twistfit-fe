'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { SEASONS, type QuizQuestion, type Season } from '@/lib/db'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

type OptionDraft = { label: string; season: Season }

function initialOptions(initialQuestion?: QuizQuestion): OptionDraft[] {
  if (initialQuestion) {
    return initialQuestion.options.map((option) => ({ label: option.label, season: option.season }))
  }
  return [
    { label: '', season: 'spring' },
    { label: '', season: 'summer' },
    { label: '', season: 'autumn' },
    { label: '', season: 'winter' },
  ]
}

export default function QuizQuestionForm({ initialQuestion }: { initialQuestion?: QuizQuestion }) {
  const t = useTranslations('Admin.QuizForm')
  const router = useRouter()
  const isEditing = Boolean(initialQuestion)

  const [questionText, setQuestionText] = useState(initialQuestion?.questionText ?? '')
  const [options, setOptions] = useState<OptionDraft[]>(() => initialOptions(initialQuestion))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((current) => current.map((option, i) => (i === index ? { ...option, ...patch } : option)))
  }

  function addOption() {
    setOptions((current) => [...current, { label: '', season: 'spring' }])
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})

    const body = {
      questionText,
      sortOrder: initialQuestion?.sortOrder ?? 0,
      options,
    }

    const response = await apiFetch(
      isEditing ? `/quiz-questions/${initialQuestion!.id}` : '/quiz-questions',
      {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    setSubmitting(false)

    if (response.status === 401 || response.status === 403) {
      setErrors({ form: t('unauthorizedError') })
      return
    }

    if (!response.ok) {
      setErrors({ form: t('genericError') })
      return
    }

    router.push('/admin/quiz')
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <label htmlFor="question-text" className="text-label-md font-semibold text-on-surface">
          {t('questionLabel')}
        </label>
        <textarea
          id="question-text"
          rows={2}
          value={questionText}
          onChange={(event) => setQuestionText(event.target.value)}
          className={inputClass}
        />
        {errors.questionText && <p className="text-label-sm text-error">{errors.questionText}</p>}
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-1 space-y-1.5">
              <label htmlFor={`option-label-${index}`} className="text-label-md font-semibold text-on-surface">
                {t('optionLabel')} {index + 1}
              </label>
              <input
                id={`option-label-${index}`}
                value={option.label}
                onChange={(event) => updateOption(index, { label: event.target.value })}
                className={inputClass}
              />
              {errors[`options.${index}.label`] && (
                <p className="text-label-sm text-error">{errors[`options.${index}.label`]}</p>
              )}
            </div>
            <div className="w-40 space-y-1.5">
              <label htmlFor={`option-season-${index}`} className="text-label-md font-semibold text-on-surface">
                {t('seasonLabel')}
              </label>
              <select
                id={`option-season-${index}`}
                value={option.season}
                onChange={(event) => updateOption(index, { season: event.target.value as Season })}
                className={inputClass}
              >
                {SEASONS.map((season) => (
                  <option key={season} value={season}>
                    {t(`seasons.${season}`)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="mt-8 text-label-md font-semibold text-error hover:underline"
            >
              {t('removeOption')}
            </button>
          </div>
        ))}
        {errors.options && <p className="text-label-sm text-error">{errors.options}</p>}
        <button
          type="button"
          onClick={addOption}
          className="text-label-md font-semibold text-primary hover:underline"
        >
          {t('addOption')}
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
