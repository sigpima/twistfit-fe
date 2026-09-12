import type { ReactNode } from 'react'

export type FaqItem = {
  id: string
  number: string
  question: string
  categories: string[]
  answer: ReactNode
}

type FaqAccordionItemProps = {
  item: FaqItem
  isOpen: boolean
  onToggle: (id: string) => void
}

export default function FaqAccordionItem({ item, isOpen, onToggle }: FaqAccordionItemProps) {
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
            {item.number}
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
            {item.answer}
          </div>
        </div>
      )}
    </div>
  )
}
