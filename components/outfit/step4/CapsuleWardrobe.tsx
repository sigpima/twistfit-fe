'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'

const CAPSULE_SETS = [
  {
    id: 'office',
    image: '/outfit/capsule-set-office.jpg',
    alt: 'Set đồ công sở thanh lịch với áo peplum hồng, quần ống suông trắng ngà và túi xách minimalist',
    tag: 'Set 1 • Thanh Lịch',
    tagClass: 'bg-surface-container-lowest/90 text-primary',
    fitFor: 'Phù hợp: Office & Meeting',
    title: 'Thanh Lịch Công Sở',
    tone: 'Warm Cream',
    description:
      'Áo Peplum Voan Hồng + Quần Ống Suông Trắng Ngà + Túi xách Minimalist. Tối ưu chiều dài chân và tạo nét chuyên nghiệp, nhã nhặn.',
    items: [
      { label: 'Quần ống suông ngà:', price: '490.000 ₫' },
      { label: 'Túi xách Minimalist:', price: '720.000 ₫' },
    ],
  },
  {
    id: 'date',
    image: '/outfit/capsule-set-date.jpg',
    alt: 'Set đồ dạo phố với áo peplum hồng, chân váy midi xám bạc và giày slingback',
    tag: 'Set 2 • Dạo Phố',
    tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
    fitFor: 'Phù hợp: Dating & Weekend',
    title: 'Hẹn Hò & Dạo Phố',
    tone: 'Soft Silver',
    description:
      'Áo Peplum + Chân Váy Xòe Midi Xám Bạc tôn vẻ nữ tính dịu dàng. Màu xám bạc lạnh làm nổi bật sắc hồng thanh khiết của áo.',
    items: [
      { label: 'Chân váy midi xám bạc:', price: '530.000 ₫' },
      { label: 'Giày Slingback Satin:', price: '650.000 ₫' },
    ],
  },
  {
    id: 'accessories',
    image: '/outfit/capsule-set-accessories.jpg',
    alt: 'Phụ kiện khuyên tai bạc và túi pastel lilac bổ trợ cho set đồ',
    tag: 'Set 3 • Điểm Nhấn',
    tagClass: 'bg-surface-container-highest text-on-surface',
    fitFor: 'Phù hợp: Điểm Nhấn Cao Cấp',
    title: 'Phụ Kiện Tối Ưu',
    tone: 'Pastel Lilac',
    description:
      'Khuyên Tai Bạc Silver + Túi Pastel Lilac ánh tím. Bổ trợ hoàn hảo cho nhóm màu Summer Soft mà không làm lu mờ sắc áo chính.',
    items: [
      { label: 'Khuyên tai bạc Ý 925:', price: '320.000 ₫' },
      { label: 'Túi Pastel Lilac:', price: '580.000 ₫' },
    ],
  },
]

export default function CapsuleWardrobe() {
  const t = useTranslations('Outfit.Step4.CapsuleWardrobe')

  return (
    <section id="capsule-wardrobe" className="w-full bg-surface py-space-xl">
      <div className="mx-auto max-w-7xl px-margin md:px-margin-desktop">
        <div className="mb-space-xl flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
          <div>
            <div className="mb-space-xs inline-flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1 text-label-sm font-semibold text-on-primary-fixed">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              {t('badgePill')}
            </div>
            <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
            <p className="mt-1 text-body-md text-on-surface-variant">{t('subheading')}</p>
          </div>
          <div className="flex items-center gap-space-xs text-label-md text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-secondary">tips_and_updates</span>
            {t('timeSavedNote')}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-gutter-desktop md:grid-cols-3">
          {CAPSULE_SETS.map((set) => (
            <div
              key={set.id}
              className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-space-md shadow-md transition-all duration-300 hover:shadow-xl"
            >
              <div>
                <div className="relative mb-space-md aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={set.image} alt={set.alt} className="h-full w-full object-cover" />
                  <div className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-label-sm font-bold backdrop-blur-md ${set.tagClass}`}>
                    {set.tag}
                  </div>
                  <div className="absolute bottom-3 right-3 rounded bg-inverse-surface/85 px-2 py-0.5 text-label-sm text-inverse-on-surface backdrop-blur-md">
                    {set.fitFor}
                  </div>
                </div>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-title-md font-bold text-on-surface">{set.title}</h3>
                  <span className="text-label-sm font-bold text-secondary">{t('toneLabel', { tone: set.tone })}</span>
                </div>
                <p className="mb-space-sm text-body-sm leading-relaxed text-on-surface-variant">
                  {set.description}
                </p>
                <div className="mb-space-md rounded-xl bg-surface-container-low p-space-sm">
                  {set.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between text-label-sm text-on-surface-variant last:mb-0"
                    >
                      <span>{item.label}</span>
                      <span className="font-semibold text-on-surface">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-space-sm py-2.5 text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary-container"
                >
                  <span className="material-symbols-outlined text-[17px]">magic_button</span>
                  {t('tryOutfitButton')}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-container-high px-space-sm py-2 text-label-md text-on-surface transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                  {t('viewProductButton')}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-space-xl flex flex-col items-center justify-between gap-space-md rounded-2xl bg-surface-container-low p-space-lg md:flex-row">
          <div className="flex items-center gap-space-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[24px]">palette</span>
            </div>
            <div>
              <h4 className="text-headline-sm text-on-surface">{t('moreQuizTitle')}</h4>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">{t('moreQuizBody')}</p>
            </div>
          </div>
          <div className="flex w-full shrink-0 items-center justify-end gap-space-sm md:w-auto">
            <Link
              href="/personal-color/quiz"
              className="rounded-full bg-primary px-space-lg py-space-sm text-label-md text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              {t('quizButton')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
