import type { FaqItem } from '@/lib/faq'
import { renderMarkdown } from '@/lib/markdown'

type FaqAccordionItemProps = {
  item: FaqItem
  number: string
  isOpen: boolean
  onToggle: (id: number) => void
}

export default function FaqAccordionItem({ item, number, isOpen, onToggle }: FaqAccordionItemProps) {
  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => onToggle(item.id)}
        className="group flex w-full items-center justify-between p-space-lg text-left"
      >
        <div className="flex items-start gap-space-md pr-space-md">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-container text-label-md font-bold text-primary">
            {number}
          </span>
          <span className="text-headline-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
            {item.question}
          </span>
        </div>
        <span
          className={`material-symbols-outlined shrink-0 text-[24px] text-outline transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          keyboard_arrow_down
        </span>
      </button>
      {isOpen && (
        <div className="px-space-lg pb-space-lg pt-0">
          <div className="flex flex-col gap-space-sm pl-12 text-body-md leading-relaxed text-on-surface-variant">
            <div
              className="prose max-w-none text-body-md text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(item.answerMarkdown) }}
            />
            {item.highlightIcon && item.highlightText && (
              <div className="mt-space-xs flex items-center gap-space-xs rounded-lg bg-surface-container-low p-space-md text-label-md font-semibold text-primary">
                <span className="material-symbols-outlined text-[18px]">{item.highlightIcon}</span>
                <span>{item.highlightText}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
