export const FAQ_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'personal-color', label: 'Trắc nghiệm Personal Color' },
  { id: 'fitting-room', label: 'Phòng thử đồ ảo (Fitting Room)' },
  { id: 'account', label: 'Tài khoản & Dữ liệu' },
  { id: 'stylist', label: 'Tư vấn Stylist & Mua sắm' },
] as const

type FaqCategoryTabsProps = {
  active: string
  onChange: (categoryId: string) => void
}

export default function FaqCategoryTabs({ active, onChange }: FaqCategoryTabsProps) {
  return (
    <div className="flex items-center gap-space-xs overflow-x-auto pb-space-sm md:justify-center">
      {FAQ_CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          className={`shrink-0 rounded-full px-space-lg py-space-sm text-label-lg transition-all duration-200 ${
            active === category.id
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}
