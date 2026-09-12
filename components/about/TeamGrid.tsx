const TEAM = [
  {
    id: 'mai-anh',
    image: '/about/team-mai-anh.jpg',
    badge: 'Color Specialist',
    badgeColor: 'text-secondary',
    name: 'Trần Mai Anh',
    role: 'Head of Color Science & Consulting',
    roleColor: 'text-secondary',
    bio: 'Chứng chỉ Chuyên gia Màu sắc Quốc tế (IIC). 8+ năm kinh nghiệm tư vấn định vị hình ảnh cá nhân cho các người mẫu, KOL và doanh nhân hàng đầu.',
    footerIcon: 'verified',
    footerLabel: 'Korea Image Industry Association',
  },
  {
    id: 'quang-huy',
    image: '/about/team-quang-huy.jpg',
    badge: 'AI Lead & Co-Founder',
    badgeColor: 'text-primary',
    name: 'Dr. Lê Quang Huy',
    role: 'Chief Technology Officer (CTO)',
    roleColor: 'text-primary',
    bio: 'Tiến sĩ Khoa học Máy tính tại NTU Singapore, chuyên sâu về Deep Learning và Thị giác Máy tính ứng dụng trong phân tích sắc ký ảnh kỹ thuật số.',
    footerIcon: 'memory',
    footerLabel: '5+ Sáng chế thị giác màu quang phổ',
  },
  {
    id: 'khanh-linh',
    image: '/about/team-khanh-linh.jpg',
    badge: 'Creative Stylist',
    badgeColor: 'text-tertiary',
    name: 'Nguyễn Khánh Linh',
    role: 'Creative Director & Master Stylist',
    roleColor: 'text-tertiary',
    bio: 'Tốt nghiệp Học viện Thời trang London (LCA). Cựu biên tập viên phong cách cho các tạp chí phong cách sống hàng đầu, đam mê tái cấu trúc tủ đồ thông minh.',
    footerIcon: 'auto_fix_high',
    footerLabel: 'Stylist của 100+ Fashion Lookbooks',
  },
]

export default function TeamGrid() {
  return (
    <section className="w-full px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-space-xl max-w-2xl text-center">
          <div className="mb-space-sm inline-flex items-center gap-space-xs rounded-full bg-secondary-fixed/50 px-space-md py-space-xs">
            <span className="text-label-sm font-semibold uppercase tracking-wider text-on-secondary-fixed">
              Đội Ngũ Chuyên Gia
            </span>
          </div>
          <h2 className="text-headline-lg text-on-surface">Những Nhà Kiến Tạo Tại TwistFit</h2>
          <p className="mt-space-xs text-body-md text-on-surface-variant">
            Sự giao thoa hoàn hảo giữa cảm quan thẩm mỹ thời trang cao cấp và năng lực nghiên cứu trí tuệ
            nhân tạo.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          {TEAM.map((member) => (
            <div
              key={member.id}
              className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                <div className="absolute right-space-sm top-space-sm rounded-full bg-surface-container-lowest/80 px-space-sm py-space-xs shadow-sm backdrop-blur-md">
                  <span className={`text-label-sm font-semibold ${member.badgeColor}`}>{member.badge}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-space-lg">
                <div>
                  <h3 className="text-headline-sm font-semibold text-on-surface">{member.name}</h3>
                  <p className={`mt-space-xs text-label-md font-medium ${member.roleColor}`}>{member.role}</p>
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
