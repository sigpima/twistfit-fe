'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

const CATEGORIES = [
  { id: 'all', key: 'all' },
  { id: 'personal-color', key: 'personalColor' },
  { id: 'styling', key: 'styling' },
  { id: 'sustainable', key: 'sustainable' },
  { id: 'beauty', key: 'beauty' },
  { id: 'community', key: 'community' },
] as const

const ARTICLES = [
  {
    id: 'lipstick',
    image: '/blog/lipstick-flatlay.jpg',
    alt: 'Bộ son môi tông berry và hồng lạnh cho Cool Undertone',
    category: 'beauty',
    badge: 'Làm đẹp & Makeup',
    badgeColor: 'text-secondary',
    date: '18.06.26',
    title: 'Top 5 thỏi son kinh điển dành riêng cho cô nàng thuộc nhóm Cool Undertone',
    description:
      'Sự thanh khiết và dịu mát của tone Mùa Hạ đến sắc son có sắc hồng dịu, tím sữa hoặc berry nhẹ để đôi môi luôn ửng hồng tự nhiên mà không bị già.',
    views: '1.8k',
  },
  {
    id: 'capsule',
    image: '/blog/capsule-wardrobe-rail.jpg',
    alt: 'Tủ đồ con nhộng tối giản 30 món trung tính',
    category: 'sustainable',
    badge: 'Lối sống xanh',
    badgeColor: 'text-tertiary',
    date: '09.05.26',
    title: 'Tủ đồ con nhộng (Capsule Wardrobe): Tối ưu 30 món mặc đẹp quanh năm',
    description:
      'Hướng dẫn chi tiết từng bước thanh lọc trang phục lỗi thời, tập trung vào những món đồ bền vững có tính ứng dụng cao và chuẩn sắc thái cá nhân.',
    views: '3.4k',
  },
  {
    id: 'community-swap',
    image: '/blog/community-swap.jpg',
    alt: 'Sự kiện đổi quần áo cũ của cộng đồng TwistFit',
    category: 'community',
    badge: 'Cộng đồng',
    badgeColor: 'text-primary',
    date: '06.05.26',
    title: "Chiến dịch 'Đổi Quần Áo Cũ - Nhận Bản Phân Tích Màu Sắc Miễn Phí'",
    description:
      'Chung tay cùng TwistFit giảm thiểu rác thải thời trang dệt may, mang lại vòng đời mới cho trang phục và nâng cấp gu ăn mặc của chính bạn.',
    views: '2.1k',
  },
  {
    id: 'undertone',
    image: '/blog/undertone-draping.jpg',
    alt: 'Buổi kiểm tra tông da bằng vải draping vàng và bạc',
    category: 'personal-color',
    badge: 'Personal Color',
    badgeColor: 'text-secondary',
    date: '28.04.26',
    title: 'Cách nhận biết Warm Undertone vs Cool Undertone chính xác tại nhà chỉ trong 1 phút',
    description:
      'Chỉ với ánh sáng tự nhiên và vài mẹo quan sát mạch máu hoặc trang sức vàng bạc, bạn hoàn toàn có thể tự kiểm tra sắc thái da cơ bản.',
    views: '6.8k',
  },
  {
    id: 'proportion',
    image: '/blog/proportion-styling-flatlay.jpg',
    alt: 'Flatlay quần âu cạp cao và áo croptop lửng phối layer',
    category: 'styling',
    badge: 'Phối đồ & AI',
    badgeColor: 'text-primary',
    date: '20.04.26',
    title: 'Bí kíp phối layer tôn dáng cho người có tỷ lệ lưng dài chân ngắn',
    description:
      "Tận dụng độ cạp cao của quần âu, áo croptop lửng và sự tương phản màu sắc giúp 'hack' chiều cao hiệu quả trên tính năng thử đồ ảo TwistFit.",
    views: '4.2k',
  },
  {
    id: 'autumn-palette',
    image: '/blog/autumn-palette-moodboard.jpg',
    alt: 'Mood board bảng màu Mùa Thu tông đất ấm',
    category: 'personal-color',
    badge: 'Xu hướng',
    badgeColor: 'text-tertiary',
    date: '12.04.26',
    title: 'Sức hút ấm áp từ bảng màu Mùa Thu (Autumn Warm): Khi tone đất lên ngôi',
    description:
      'Những gam màu nâu caramel, cam cháy và rêu olive mang đến sự quý phái, đằm thắm cho những buổi hẹn hò hoặc sự kiện trang trọng.',
    views: '5.1k',
  },
]

export default function BlogArticleGrid() {
  const t = useTranslations('Blog.ArticleGrid')
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({})

  const visibleArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return ARTICLES.filter((article) => {
      const matchesCategory = activeCategory === 'all' || article.category === activeCategory
      const matchesSearch = !query || article.title.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <section className="mb-space-xl">
      <div className="mb-space-xl flex flex-col justify-between gap-space-md rounded-2xl bg-surface-container-lowest/70 p-space-md shadow-sm backdrop-blur-xl lg:flex-row lg:items-center md:p-space-lg">
        <div className="flex items-center gap-space-xs overflow-x-auto pb-space-xs lg:pb-0">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`shrink-0 whitespace-nowrap rounded-full px-space-md py-space-xs text-label-lg transition-all ${
                activeCategory === category.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              {t(`categories.${category.key}`)}
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-space-sm lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <span className="material-symbols-outlined absolute left-space-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-full bg-surface-container-low/80 py-space-xs pl-9 pr-space-md text-body-md text-on-surface transition-all placeholder:text-on-surface-variant/70 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="relative">
            <select className="cursor-pointer appearance-none rounded-full bg-surface-container-low/80 py-space-xs pl-space-md pr-8 text-label-md text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="newest">{t('sortNewest')}</option>
              <option value="popular">{t('sortPopular')}</option>
              <option value="trending">{t('sortTrending')}</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-space-xs top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              expand_more
            </span>
          </div>
        </div>
      </div>

      <div className="mb-space-lg flex items-center justify-between">
        <div>
          <span className="text-label-sm font-bold uppercase tracking-widest text-primary">
            {t('sectionKicker')}
          </span>
          <h3 className="text-headline-md font-bold text-on-surface">{t('sectionHeading')}</h3>
        </div>
      </div>

      {visibleArticles.length === 0 ? (
        <div className="rounded-2xl bg-surface-container-lowest py-space-xl text-center shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
          <h4 className="mt-space-xs text-headline-sm font-semibold text-on-surface">
            {t('noResultsTitle')}
          </h4>
          <p className="mt-1 text-body-md text-on-surface-variant">{t('noResultsBody')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((article) => {
            const isBookmarked = Boolean(bookmarked[article.id])
            return (
              <article
                key={article.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest/80 shadow-sm backdrop-blur-md transition-all hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.image}
                    alt={article.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-space-sm left-space-sm">
                    <span
                      className={`rounded-full bg-surface-container-lowest/90 px-space-sm py-0.5 text-label-sm font-semibold shadow-xs backdrop-blur-md ${article.badgeColor}`}
                    >
                      {article.badge}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={t('bookmarkAriaLabel')}
                    aria-pressed={isBookmarked}
                    onClick={() =>
                      setBookmarked((current) => ({ ...current, [article.id]: !current[article.id] }))
                    }
                    className={`absolute right-space-sm top-space-sm flex h-8 w-8 items-center justify-center rounded-full shadow-xs backdrop-blur-md transition-colors ${
                      isBookmarked
                        ? 'bg-secondary-container text-secondary'
                        : 'bg-surface-container-lowest/90 text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isBookmarked ? 'bookmark_added' : 'bookmark'}
                    </span>
                  </button>
                </div>
                <div className="flex flex-1 flex-col justify-between p-space-md">
                  <div>
                    <div className="mb-space-xs flex items-center gap-space-xs text-label-sm text-on-surface-variant">
                      <span className="font-semibold text-primary">TwistFit</span>
                      <span>•</span>
                      <span className="rounded bg-surface-container px-space-xs py-0.5 font-medium text-on-surface-variant">
                        {article.date}
                      </span>
                    </div>
                    <h4 className="mb-space-xs line-clamp-2 text-title-md font-bold text-on-surface transition-colors group-hover:text-primary">
                      {article.title}
                    </h4>
                    <p className="line-clamp-3 text-body-sm text-on-surface-variant">{article.description}</p>
                  </div>
                  <div className="mt-space-sm flex items-center justify-between pt-space-md">
                    <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      {article.views} {t('viewsSuffix')}
                    </span>
                    <a
                      href="#"
                      className="inline-flex items-center gap-0.5 text-label-md font-semibold text-primary hover:underline"
                    >
                      {t('readNowLink')} <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-space-xl flex items-center justify-center gap-space-xs text-label-lg">
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition-colors hover:bg-surface-container">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-on-primary shadow-xs">
          1
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface transition-colors hover:bg-surface-container">
          2
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface transition-colors hover:bg-surface-container">
          3
        </button>
        <span className="px-space-xs text-outline">...</span>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest text-on-surface transition-colors hover:bg-surface-container">
          10
        </button>
        <button className="flex h-10 items-center gap-space-xs rounded-full bg-surface-container-low px-space-md font-semibold text-primary transition-colors hover:bg-surface-container">
          <span>{t('nextButton')}</span>
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </section>
  )
}
