'use client'

type FrameSwitcherProps = {
  currentName: string
  onPrev: () => void
  onNext: () => void
}

export default function FrameSwitcher({ currentName, onPrev, onNext }: FrameSwitcherProps) {
  return (
    <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6 text-white">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Frame trước"
        className="rounded-full bg-white/20 px-4 py-2 text-xl"
      >
        ‹
      </button>
      <span className="min-w-[10rem] text-center text-lg font-medium">{currentName}</span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Frame sau"
        className="rounded-full bg-white/20 px-4 py-2 text-xl"
      >
        ›
      </button>
    </div>
  )
}
