const CORE_VALUES = [
  {
    icon: 'fingerprint',
    iconBg: 'bg-secondary-fixed text-on-secondary-fixed',
    title: 'Cá Nhân Hóa Tối Đa',
    tag: 'Personalized Perfection',
    tagColor: 'text-secondary',
    body: 'Không rập khuôn tiêu chuẩn chung. Phong cách là tấm gương phản chiếu sắc vóc riêng biệt và cá tính nội tâm của chính bạn.',
  },
  {
    icon: 'science',
    iconBg: 'bg-primary-fixed text-on-primary-fixed',
    title: 'Khoa Học & Chính Xác',
    tag: 'Science-backed AI',
    tagColor: 'text-primary',
    body: 'Dựa trên lý thuyết phân tích sắc ký 12 mùa (12-Season Color Analysis) được mã hóa bằng mô hình thị giác máy tính chính xác cao.',
  },
  {
    icon: 'all_inclusive',
    iconBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Bền Vững & Tối Ưu',
    tag: 'Conscious Closet',
    tagColor: 'text-tertiary',
    body: 'Mua sắm có chủ đích, mặc nhiều lần và tái tổ chức tủ quần áo thông minh để bảo vệ tài nguyên môi trường toàn cầu.',
  },
]

export default function MissionVisionGrid() {
  return (
    <section className="w-full px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="mb-space-xl flex flex-col justify-between gap-space-sm md:flex-row md:items-end">
          <div>
            <span className="text-label-sm font-semibold uppercase tracking-wider text-secondary">
              Tầm Nhìn Tương Lai
            </span>
            <h2 className="mt-space-xs text-headline-lg text-on-surface">Sứ Mệnh &amp; Giá Trị Cốt Lõi</h2>
          </div>
          <p className="max-w-md text-body-md text-on-surface-variant">
            Chúng tôi xóa bỏ định kiến thời trang phải phức tạp hay tốn kém, mang phương pháp cố vấn hình ảnh
            cao cấp vào tầm tay bạn.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-lowest p-space-xl shadow-sm transition-all duration-300 hover:shadow-md lg:col-span-6">
            <div className="relative z-10">
              <div className="mb-space-lg flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                <span className="material-symbols-outlined text-[26px]">lightbulb</span>
              </div>
              <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
                Sứ mệnh của chúng tôi
              </span>
              <h3 className="mb-space-md mt-space-xs text-headline-md text-on-surface">
                Giải Phóng Tự Do Thể Hiện Bản Thân
              </h3>
              <p className="text-body-md leading-relaxed text-on-surface-variant">
                Giúp mọi người tự tin tỏa sáng qua việc thấu hiểu sắc tố tự nhiên của cơ thể. Bằng sự kết hợp
                chuẩn xác của khoa học sắc độ, TwistFit giúp người dùng tiết kiệm{' '}
                <span className="font-semibold text-secondary">70% thời gian</span> lựa chọn trang phục và
                cắt giảm những khoản chi tiêu mua sắm sai lầm do trang phục không hợp tone.
              </p>
            </div>
            <div className="relative z-10 mt-space-lg flex items-center gap-space-md rounded-lg bg-surface-container-low/60 p-space-md">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-primary">
                <span className="material-symbols-outlined text-[20px]">savings</span>
              </div>
              <p className="text-body-sm text-on-surface">
                Tối ưu chi tiêu cá nhân và giảm thiểu lãng phí may mặc thời trang nhanh.
              </p>
            </div>
          </div>
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-primary-container to-primary p-space-xl text-on-primary shadow-md lg:col-span-6">
            <div className="relative z-10">
              <div className="mb-space-lg flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-lowest/20 text-on-primary backdrop-blur-md">
                <span className="material-symbols-outlined text-[26px]">visibility</span>
              </div>
              <span className="text-label-sm font-semibold uppercase tracking-widest text-primary-fixed">
                Tầm nhìn 2030
              </span>
              <h3 className="mb-space-md mt-space-xs text-headline-md text-on-primary">
                Nền Tảng Thời Trang Cá Nhân Hóa Hàng Đầu
              </h3>
              <p className="text-body-md leading-relaxed text-primary-fixed">
                Trở thành nền tảng thời trang thông minh cá nhân hóa hàng đầu Đông Nam Á. Chúng tôi tiên
                phong thúc đẩy lối sống thời trang bền vững (Sustainable Fashion), giúp mỗi người xây dựng
                một tủ đồ capsule tinh giản, chuẩn sắc và không bao giờ lỗi mốt.
              </p>
            </div>
            <div className="relative z-10 mt-space-lg flex items-center justify-between rounded-lg bg-surface-container-lowest/10 p-space-md backdrop-blur-md">
              <div>
                <span className="block text-label-sm uppercase text-primary-fixed">Tiêu chí xanh</span>
                <span className="text-label-lg font-semibold text-on-primary">Eco-Fashion Impact</span>
              </div>
              <div className="flex items-center gap-space-xs text-primary-fixed">
                <span className="material-symbols-outlined text-[20px]">eco</span>
                <span className="text-label-md font-semibold">Zero-Waste Mindset</span>
              </div>
            </div>
          </div>
          {CORE_VALUES.map((value) => (
            <div
              key={value.title}
              className="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md lg:col-span-4"
            >
              <div className={`mb-space-md flex h-10 w-10 items-center justify-center rounded-full ${value.iconBg}`}>
                <span className="material-symbols-outlined text-[20px]">{value.icon}</span>
              </div>
              <h4 className="mb-space-xs text-headline-sm text-on-surface">{value.title}</h4>
              <p className={`mb-space-xs text-label-sm font-semibold uppercase tracking-wider ${value.tagColor}`}>
                {value.tag}
              </p>
              <p className="text-body-sm leading-relaxed text-on-surface-variant">{value.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
