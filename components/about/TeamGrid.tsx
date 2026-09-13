'use client'

import { useTranslations } from 'next-intl'
import type { TeamMember } from '@/lib/team'
import { COLOR_VARIANT_CLASSES } from './teamColorPresentation'

export default function TeamGrid({ members }: { members: TeamMember[] }) {
  const t = useTranslations('About.TeamGrid')

  return (
    <section className="w-full px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-space-xl max-w-2xl text-center">
          <div className="mb-space-sm inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed/50 px-space-md py-space-xs">
            <span className="text-label-sm font-semibold uppercase tracking-wider text-on-secondary-fixed">
              {t('kicker')}
            </span>
          </div>
          <h2 className="text-headline-lg text-on-surface">{t('heading')}</h2>
          <p className="mt-space-xs text-body-md text-on-surface-variant">{t('subheading')}</p>
        </div>
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                <div className="absolute right-space-sm top-space-sm rounded-full bg-surface-container-lowest/80 px-space-sm py-space-xs shadow-sm backdrop-blur-md">
                  <span className={`text-label-sm font-semibold ${COLOR_VARIANT_CLASSES[member.badgeVariant]}`}>
                    {member.role.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-space-lg">
                <div>
                  <h3 className="text-headline-sm font-semibold text-on-surface">{member.name}</h3>
                  <p className={`mt-space-xs text-label-md font-medium ${COLOR_VARIANT_CLASSES[member.roleVariant]}`}>
                    {member.role}
                  </p>
                  <p className="mt-space-sm text-body-sm leading-relaxed text-on-surface-variant">
                    {member.bio}
                  </p>
                </div>
                <div className="mt-space-md flex items-center gap-space-sm pt-space-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    {member.footerIcon}
                  </span>
                  <span className="text-label-sm">{member.footerLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
