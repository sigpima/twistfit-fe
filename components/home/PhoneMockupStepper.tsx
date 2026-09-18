'use client'

type PhoneMockupStepperImage = {
  key: string
  src: string
  alt: string
  bg?: string
}

type PhoneMockupStepperProps = {
  images: PhoneMockupStepperImage[]
  activeIndex: number
  onSelect: (index: number) => void
}

export default function PhoneMockupStepper({ images, activeIndex, onSelect }: PhoneMockupStepperProps) {
  const activeImage = images[activeIndex]

  return (
    <div className="flex flex-col items-center gap-space-lg">
      <div className="relative flex w-full max-w-[420px] items-center justify-center p-2 sm:p-4">
        {activeImage.bg && (
          <div className="relative z-10 -mr-8 h-[440px] w-[58%] -rotate-1 overflow-hidden rounded-3xl shadow-2xl transition-transform duration-500 hover:rotate-0 sm:-mr-10 sm:h-[500px] sm:w-[60%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage.bg} alt="" aria-hidden="true" className="h-full w-full object-cover object-center" />
          </div>
        )}
        <div
          className={`relative z-20 h-[400px] w-[185px] shrink-0 overflow-hidden rounded-[32px] border-[7px] border-on-surface bg-surface shadow-2xl transition-transform duration-300 hover:-translate-y-1 sm:h-[450px] sm:w-[208px] ${
            !activeImage.bg ? 'mx-auto' : ''
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeImage.src} alt={activeImage.alt} className="h-full w-full object-cover object-top" />
        </div>
        {activeImage.bg && (
          <>
            <div
              aria-hidden="true"
              className="absolute -left-6 -top-6 -z-10 h-40 w-40 rounded-full bg-secondary-container/40 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-8 -right-8 -z-10 h-48 w-48 rounded-full bg-primary-fixed/50 blur-3xl"
            />
          </>
        )}
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
