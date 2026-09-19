'use client'

import { useTranslations } from 'next-intl'

type PolicySection = {
  heading: string
  intro?: string
  items: { label: string; text: string }[]
}

export default function CameraArPolicyContent() {
  const t = useTranslations('CameraArPolicy')
  const sections = t.raw('sections') as PolicySection[]

  return (
    <div className="space-y-5 text-body-sm leading-relaxed text-on-surface-variant">
      <div>
        <p className="text-label-lg font-bold tracking-wide text-on-surface">{t('documentTitle')}</p>
        <p className="mt-1 italic text-on-surface-variant">{t('documentSubtitle')}</p>
      </div>

      <p>{t('intro')}</p>

      {sections.map((section) => (
        <div key={section.heading}>
          <h4 className="text-label-md font-bold text-on-surface">{section.heading}</h4>
          {section.intro && <p className="mt-1">{section.intro}</p>}
          <ul className="mt-2 list-disc space-y-2 pl-5">
            {section.items.map((item) => (
              <li key={item.label}>
                <span className="font-semibold text-on-surface">{item.label}:</span> {item.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
