'use client'

type PhoneMockupStepperImage = {
  key: string
  src: string
  alt: string
}

type PhoneMockupStepperProps = {
  images: PhoneMockupStepperImage[]
  activeIndex: number
  onSelect: (index: number) => void
}

export default function PhoneMockupStepper({ images, activeIndex, onSelect }: PhoneMockupStepperProps) {
  const activeImage = images[activeIndex]

  return (
    <div className="flex flex-col items-center gap-space-md">
      <div className="w-full max-w-[240px] overflow-hidden rounded-[28px] border-[6px] border-on-surface shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activeImage.src} alt={activeImage.alt} className="block w-full" />
      </div>
      <div className="flex items-center">
        {images.map((image, index) => (
          <div key={image.key} className="flex items-center">
            {index > 0 && <div className="h-0.5 w-6 bg-surface-container-high" />}
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === activeIndex ? 'step' : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-label-md font-bold transition-colors ${
                index === activeIndex
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {index + 1}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
