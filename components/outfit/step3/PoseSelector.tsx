'use client'

import { useOutfitFlow } from '../OutfitFlowProvider'

const POSES = [
  { id: 'front', icon: 'man', label: 'Đứng thẳng phía trước', sublabel: 'Chuẩn Form 0°' },
  { id: '45deg', icon: 'person', label: 'Góc 45 độ', sublabel: 'Năng động' },
  { id: 'side', icon: 'directions_walk', label: 'Nghiêng cạnh bên', sublabel: 'Góc 90° rõ eo' },
  { id: 'hand-hip', icon: 'dry_cleaning', label: 'Chống tay hông', sublabel: 'Phong cách Chic' },
  { id: 'arms-crossed', icon: 'accessibility', label: 'Khoanh tay tự tin', sublabel: 'Hiện đại' },
  { id: 'runway-walk', icon: 'transfer_within_a_station', label: 'Sải chân Runway', sublabel: 'Chuyển động cao' },
  { id: 'seated', icon: 'chair', label: 'Ngồi thanh lịch', sublabel: 'Look cà phê' },
  { id: 'back-view', icon: 'flip', label: 'Góc sau lưng', sublabel: 'Chi tiết khóa lưng' },
  { id: 'dress-spin', icon: 'motion_sensor_active', label: 'Váy xoay nhẹ', sublabel: 'Bồng bềnh' },
]

export default function PoseSelector() {
  const { selectedPose, setSelectedPose } = useOutfitFlow()

  return (
    <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary">view_in_ar</span>
          <h2 className="text-title-md font-semibold text-on-surface">Lựa chọn tư thế (9 tư thế có sẵn)</h2>
        </div>
        <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-label-sm font-medium text-on-primary-fixed">
          Đã chọn: {selectedPose.label}
        </span>
      </div>
      <p className="text-body-sm text-on-surface-variant">
        Góc nhìn và thế đứng làm nổi bật độ rủ peplum và tôn đường cong cơ thể tốt nhất.
      </p>
      <div className="grid grid-cols-3 gap-space-sm pt-space-xs">
        {POSES.map((pose) => {
          const isSelected = selectedPose.id === pose.id
          return (
            <button
              key={pose.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedPose({ id: pose.id, label: pose.label })}
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
              <span className="text-label-md font-bold text-on-surface">{pose.label}</span>
              <span className="text-label-sm text-on-surface-variant">{pose.sublabel}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-space-sm flex items-center justify-between rounded-xl bg-surface-container-low p-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-secondary">wb_sunny</span>
          <div className="flex flex-col">
            <span className="text-label-md font-semibold text-on-surface">Ánh sáng trường quay</span>
            <span className="text-body-sm text-on-surface-variant">
              Natural Studio Light 5200K (Tôn da Spring/Summer)
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-primary">tune</span>
      </div>
    </div>
  )
}
