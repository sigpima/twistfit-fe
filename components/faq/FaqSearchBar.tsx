const SUGGESTED_TAGS = [
  { label: '#ÁnhSáng', value: 'ánh sáng' },
  { label: '#BảoMật', value: 'bảo mật' },
  { label: '#ThửĐồẢo', value: 'thử đồ ảo' },
  { label: '#XuấtPDF', value: 'xuất pdf' },
]

type FaqSearchBarProps = {
  value: string
  onChange: (value: string) => void
  onTagClick: (value: string) => void
}

export default function FaqSearchBar({ value, onChange, onTagClick }: FaqSearchBarProps) {
  return (
    <div className="mt-space-xl w-full max-w-2xl">
      <div className="relative flex items-center rounded-full bg-surface-container-lowest p-space-xs shadow-md">
        <span className="material-symbols-outlined ml-space-md text-[24px] text-outline">search</span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Tìm kiếm thắc mắc (ví dụ: chụp ảnh như thế nào, độ chính xác...)"
          className="w-full bg-transparent px-space-sm py-space-sm text-body-md text-on-surface placeholder:text-outline focus:outline-none"
        />
        <button
          type="button"
          className="flex shrink-0 items-center gap-space-xs rounded-full bg-primary px-space-lg py-space-sm text-label-lg text-on-primary shadow-sm transition-all duration-300 hover:bg-primary-container"
        >
          <span>Tìm kiếm</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>
      <div className="mt-space-sm flex flex-wrap items-center justify-center gap-space-sm">
        <span className="text-label-sm text-outline">Gợi ý tìm kiếm:</span>
        {SUGGESTED_TAGS.map((tag) => (
          <button
            key={tag.value}
            type="button"
            onClick={() => onTagClick(tag.value)}
            className="text-label-sm text-primary transition-colors hover:text-primary-container"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  )
}
