'use client'

import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

function StoryChapter({
  image,
  imageAlt,
  imageOnRight,
  children,
}: {
  image: string
  imageAlt: string
  imageOnRight: boolean
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-2">
      <div className={imageOnRight ? 'lg:order-2' : 'lg:order-1'}>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-container-low shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={imageAlt} className="h-full w-full object-contain" />
        </div>
      </div>
      <div className={`flex flex-col gap-space-md ${imageOnRight ? 'lg:order-1' : 'lg:order-2'}`}>{children}</div>
    </div>
  )
}

export default function StorySections() {
  const t = useTranslations('About.StorySections')

  return (
    <section className="w-full px-margin-desktop py-space-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-space-xl">
        <StoryChapter image="/about/story.png" imageAlt={t('story.imageAlt')} imageOnRight>
          <h2 className="text-headline-lg text-on-surface">{t('story.heading')}</h2>
          <div className="flex max-w-prose flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
            <p>{t('story.paragraph1')}</p>
            <p>{t('story.paragraph2')}</p>
          </div>
        </StoryChapter>

        <StoryChapter image="/about/brand-meaning.png" imageAlt={t('brandMeaning.imageAlt')} imageOnRight={false}>
          <h2 className="text-headline-lg text-on-surface">{t('brandMeaning.heading')}</h2>
          <div className="flex max-w-prose flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
            <p>{t('brandMeaning.paragraph1')}</p>
            <p>{t('brandMeaning.paragraph2')}</p>
          </div>
        </StoryChapter>

        <StoryChapter image="/about/mission.png" imageAlt={t('mission.imageAlt')} imageOnRight>
          <h2 className="text-headline-lg text-on-surface">{t('mission.heading')}</h2>
          <p className="text-headline-sm font-semibold text-secondary">{t('mission.subheading')}</p>
          <p className="text-headline-sm italic text-secondary">{t('mission.quote')}</p>
          <div className="flex max-w-prose flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
            <p>{t('mission.paragraph1')}</p>
            <p>{t('mission.paragraph2')}</p>
            <p>{t('mission.paragraph3')}</p>
          </div>
        </StoryChapter>

        <StoryChapter image="/about/vision.png" imageAlt={t('vision.imageAlt')} imageOnRight={false}>
          <h2 className="text-headline-lg text-on-surface">{t('vision.heading')}</h2>
          <p className="text-headline-sm italic text-secondary">{t('vision.quote')}</p>
          <div className="flex max-w-prose flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
            <p>{t('vision.paragraph1')}</p>
          </div>
        </StoryChapter>
      </div>
    </section>
  )
}
