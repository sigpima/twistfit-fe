'use client'

import { useTranslations } from 'next-intl'
import { useOutfitFlow } from '../OutfitFlowProvider'

const POSES = [
  { id: 'front', icon: 'man', key: 'front' },
  { id: '45deg', icon: 'person', key: 'angle45' },
  { id: 'side', icon: 'directions_walk', key: 'side' },
  { id: 'hand-hip', icon: 'dry_cleaning', key: 'handHip' },
  { id: 'arms-crossed', icon: 'accessibility', key: 'armsCrossed' },
  { id: 'runway-walk', icon: 'transfer_within_a_station', key: 'runwayWalk' },
  { id: 'seated', icon: 'chair', key: 'seated' },
  { id: 'back-view', icon: 'flip', key: 'backView' },
  { id: 'dress-spin', icon: 'motion_sensor_active', key: 'dressSpin' },
] as const

export default function PoseSelector() {
  const t = useTranslations('Outfit.Step3.PoseSelector')
  const { selectedPose, setSelectedPose } = useOutfitFlow()

  return (
    <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary">view_in_ar</span>
          <h2 className="text-title-md font-semibold text-on-surface">{t('heading')}</h2>
        </div>
        <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-label-sm font-medium text-on-primary-fixed">
          {t('selectedBadge', { label: selectedPose.label })}
        </span>
      </div>
      <p className="text-body-sm text-on-surface-variant">{t('description')}</p>
      <div className="grid grid-cols-3 gap-space-sm pt-space-xs">
        {POSES.map((pose) => {
          const isSelected = selectedPose.id === pose.id
          const label = t(`poses.${pose.key}.label`)
          return (
            <button
              key={pose.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedPose({ id: pose.id, label })}
              className={`relative flex flex-col items-center justify-center gap-space-xs rounded-xl p-space-md text-center transition-all ${
                isSelected
                  ? 'bg-surface-container-high text-primary shadow-sm hover:shadow-md'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              {isSelected && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />}
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                  isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">{pose.icon}</span>
              </div>
              <span className="text-label-md font-bold text-on-surface">{label}</span>
              <span className="text-label-sm text-on-surface-variant">{t(`poses.${pose.key}.sublabel`)}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-space-sm flex items-center justify-between rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-secondary">wb_sunny</span>
          <div className="flex flex-col">
            <span className="text-label-md font-semibold text-on-surface">{t('lightingLabel')}</span>
            <span className="text-body-sm text-on-surface-variant">{t('lightingDetail')}</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-primary">tune</span>
      </div>
    </div>
  )
}
