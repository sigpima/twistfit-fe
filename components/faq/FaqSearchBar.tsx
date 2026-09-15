'use client'

import { useTranslations } from 'next-intl'

const SUGGESTED_TAGS = [
  { key: 'otp', value: 'OTP' },
  { key: 'security', value: 'bảo mật' },
  { key: 'outfitAi', value: 'phối đồ' },
  { key: 'deleteAccount', value: 'xóa tài khoản' },
] as const

type FaqSearchBarProps = {
  value: string
  onChange: (value: string) => void
  onTagClick: (value: string) => void
}

export default function FaqSearchBar({ value, onChange, onTagClick }: FaqSearchBarProps) {
  const t = useTranslations('Faq.SearchBar')

  return (
    <div className="mt-space-xl w-full max-w-2xl">
      <div className="relative flex items-center rounded-full bg-surface-container-lowest p-space-xs shadow-md">
        <span className="material-symbols-outlined ml-space-md text-[24px] text-outline">search</span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('placeholder')}
          className="w-full bg-transparent px-space-sm py-space-sm text-body-md text-on-surface placeholder:text-outline focus:outline-none"
        />
        <button
          type="button"
          className="flex shrink-0 items-center gap-space-xs rounded-full bg-primary px-space-lg py-space-sm text-label-lg text-on-primary shadow-sm transition-all duration-300 hover:bg-primary-container"
        >
          <span>{t('searchButton')}</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
      <div className="mt-space-sm flex flex-wrap items-center justify-center gap-space-sm">
        <span className="text-label-sm text-outline">{t('suggestedLabel')}</span>
        {SUGGESTED_TAGS.map((tag) => (
          <button
            key={tag.value}
            type="button"
            onClick={() => onTagClick(tag.value)}
            className="text-label-sm text-primary transition-colors hover:text-primary-container"
          >
            {t(`tags.${tag.key}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
