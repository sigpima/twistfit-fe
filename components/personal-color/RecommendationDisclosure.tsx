'use client'

import { useState, type ReactNode } from 'react'

export default function RecommendationDisclosure({
  title,
  children,
  nested = false,
}: {
  title: string
  children: ReactNode
  nested?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#7b89ba]/15 ${nested ? 'bg-white' : 'bg-[#eef4fa]/40'}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-xs font-bold text-[#304461]">{title}</span>
        <span
          aria-hidden="true"
          className={`material-symbols-outlined shrink-0 text-[18px] text-[#7b89ba] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          keyboard_arrow_down
        </span>
      </button>
      {isOpen && <div className="border-t border-[#7b89ba]/10 p-4">{children}</div>}
    </div>
  )
}
