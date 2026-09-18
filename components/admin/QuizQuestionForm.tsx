'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { Axis, AxisValue, QuizQuestion } from '@/lib/db'

const inputClass =
  'w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none'

const AXIS_OPTIONS: { value: Axis; label: string }[] = [
  { value: 'hue', label: 'Nhiệt độ màu (Hue)' },
  { value: 'value', label: 'Sắc độ (Value)' },
  { value: 'chroma', label: 'Độ bão hoà (Chroma)' },
]

const AXIS_VALUE_OPTIONS: Record<Axis, { value: AxisValue; label: string }[]> = {
  hue: [
    { value: 'warm', label: 'Ấm (Warm)' },
    { value: 'cool', label: 'Lạnh (Cool)' },
    { value: 'neutral', label: 'Trung tính (Neutral)' },
  ],
  value: [
    { value: 'dark', label: 'Sẫm (Dark)' },
    { value: 'light', label: 'Sáng (Light)' },
    { value: 'medium', label: 'Trung bình (Medium)' },
  ],
  chroma: [
    { value: 'bright', label: 'Tươi sáng (Bright)' },
    { value: 'muted', label: 'Trầm (Muted)' },
    { value: 'neutral', label: 'Trung tính (Neutral)' },
  ],
}

type OptionDraft = { label: string; axisValue: AxisValue; imageUrl: string }

function initialAxis(initialQuestion?: QuizQuestion): Axis {
  return initialQuestion?.axis ?? 'hue'
}

function initialOptions(initialQuestion?: QuizQuestion): OptionDraft[] {
  if (initialQuestion) {
    return initialQuestion.options.map((option) => ({
      label: option.label,
      axisValue: option.axisValue,
      imageUrl: option.imageUrl ?? '',
    }))
  }
  return [
    { label: '', axisValue: 'warm', imageUrl: '' },
    { label: '', axisValue: 'cool', imageUrl: '' },
    { label: '', axisValue: 'neutral', imageUrl: '' },
    { label: '', axisValue: 'warm', imageUrl: '' },
  ]
}

export default function QuizQuestionForm({ initialQuestion }: { initialQuestion?: QuizQuestion }) {
  const t = useTranslations('Admin.QuizForm')
  const router = useRouter()
  const isEditing = Boolean(initialQuestion)

  const [questionText, setQuestionText] = useState(initialQuestion?.questionText ?? '')
  const [axis, setAxis] = useState<Axis>(() => initialAxis(initialQuestion))
  const [imageUrl, setImageUrl] = useState(initialQuestion?.imageUrl ?? '')
  const [options, setOptions] = useState<OptionDraft[]>(() => initialOptions(initialQuestion))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  function handleAxisChange(nextAxis: Axis) {
    setAxis(nextAxis)
    const fallbackValue = AXIS_VALUE_OPTIONS[nextAxis][0].value
    setOptions((current) => current.map((option) => ({ ...option, axisValue: fallbackValue })))
  }

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((current) => current.map((option, i) => (i === index ? { ...option, ...patch } : option)))
  }

  function addOption() {
    setOptions((current) => [
      ...current,
      { label: '', axisValue: AXIS_VALUE_OPTIONS[axis][0].value, imageUrl: '' },
    ])
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
      axis,
      imageUrl: imageUrl.trim() || null,
      sortOrder: initialQuestion?.sortOrder ?? 0,
      options: options.map((option) => ({ ...option, imageUrl: option.imageUrl.trim() || null })),
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

      <div className="space-y-1.5">
        <label htmlFor="question-axis" className="text-label-md font-semibold text-on-surface">
          {t('axisLabel')}
        </label>
        <select
          id="question-axis"
          value={axis}
          onChange={(event) => handleAxisChange(event.target.value as Axis)}
          className={inputClass}
        >
          {AXIS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="question-image-url" className="text-label-md font-semibold text-on-surface">
          {t('imageUrlLabel')}
        </label>
        <input
          id="question-image-url"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          className={inputClass}
        />
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
              <label
                htmlFor={`option-image-url-${index}`}
                className="block text-label-sm font-semibold text-on-surface-variant"
              >
                {t('optionImageUrlLabel')}
              </label>
              <input
                id={`option-image-url-${index}`}
                value={option.imageUrl}
                onChange={(event) => updateOption(index, { imageUrl: event.target.value })}
                className={inputClass}
              />
            </div>
            <div className="w-48 space-y-1.5">
              <label htmlFor={`option-axis-value-${index}`} className="text-label-md font-semibold text-on-surface">
                {t('axisValueLabel')}
              </label>
              <select
                id={`option-axis-value-${index}`}
                value={option.axisValue}
                onChange={(event) => updateOption(index, { axisValue: event.target.value as AxisValue })}
                className={inputClass}
              >
                {AXIS_VALUE_OPTIONS[axis].map((axisValueOption) => (
                  <option key={axisValueOption.value} value={axisValueOption.value}>
                    {axisValueOption.label}
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
