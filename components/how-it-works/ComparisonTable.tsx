const ROWS = [
  {
    icon: 'payments',
    label: 'Chi phí mỗi lần test',
    traditional: '1.500.000đ - 3.500.000đ / buổi',
    twistfit: 'Hoàn toàn miễn phí cơ bản (Nâng cao chỉ từ 49k)',
  },
  {
    icon: 'schedule',
    label: 'Thời gian thực hiện',
    traditional: 'Đặt lịch trước 1-2 tuần, mất 2 tiếng tại salon',
    twistfit: '30 giây trực tiếp trên điện thoại 24/7',
  },
  {
    icon: 'tune',
    label: 'Tính khách quan',
    traditional: 'Dễ bị ảnh hưởng bởi cảm quan chủ quan của stylist',
    twistfit: 'Thuật toán quang phổ 1024 điểm ảnh khách quan',
  },
  {
    icon: 'checkroom',
    label: 'Tính năng Thử Đồ Ảo (Virtual Try-on)',
    traditional: 'Không có (Chỉ dán vải mẫu lên người)',
    twistfit: 'Thử đồ 3D không giới hạn với ảnh chụp hoặc link TMĐT',
  },
  {
    icon: 'history_edu',
    label: 'Khả năng lưu trữ & Tái sử dụng',
    traditional: 'Tập tài liệu giấy hoặc hình ảnh rời rạc dễ mất',
    twistfit: 'Lưu vĩnh viễn trên App, tích hợp trực tiếp tủ đồ cá nhân',
  },
]

export default function ComparisonTable() {
  return (
    <section className="mx-auto w-full max-w-5xl px-margin py-space-xl sm:px-margin-desktop lg:py-24">
      <div className="mb-16 text-center">
        <span className="text-label-sm font-bold uppercase tracking-wider text-secondary">
          Giá Trị Vượt Trội
        </span>
        <h2 className="mt-1 text-headline-lg font-bold text-on-surface">
          Phương pháp truyền thống vs. TwistFit AI Color Test
        </h2>
        <p className="mt-space-xs text-body-md text-on-surface-variant">
          So sánh trải nghiệm tư vấn sắc thái cá nhân tại salon truyền thống và nền tảng thông minh TwistFit.
        </p>
      </div>
      <div className="overflow-x-auto rounded-3xl bg-surface-container-lowest shadow-xl">
        <table className="w-full min-w-[620px] border-collapse text-left">
          <thead>
            <tr className="border-b border-surface-container bg-surface-container-low">
              <th className="w-1/3 p-space-lg text-headline-sm text-on-surface">Tiêu chí so sánh</th>
              <th className="w-1/3 p-space-lg text-headline-sm text-on-surface-variant">Tư vấn truyền thống</th>
              <th className="w-1/3 bg-primary-fixed/20 p-space-lg text-headline-sm font-bold text-primary">
                TwistFit AI Digital
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-high text-body-md text-on-surface-variant">
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td className="flex items-center gap-space-xs p-space-lg font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-primary">{row.icon}</span>
                  {row.label}
                </td>
                <td className="p-space-lg">{row.traditional}</td>
                <td className="bg-primary-fixed/10 p-space-lg font-bold text-primary">{row.twistfit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
