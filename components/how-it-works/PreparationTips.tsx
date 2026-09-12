const TIPS = [
  {
    icon: 'wb_sunny',
    iconBg: 'bg-secondary-container text-on-secondary-fixed',
    title: 'Ánh sáng tự nhiên',
    body: 'Ưu tiên chụp cạnh cửa sổ vào buổi sáng hoặc đầu giờ chiều. Tránh đèn huỳnh quang vàng hoặc ánh đèn neon làm lệch tone ấm/lạnh.',
  },
  {
    icon: 'photo_camera_front',
    iconBg: 'bg-primary-fixed text-on-primary-fixed',
    title: 'Góc chụp 90 độ',
    body: 'Giữ điện thoại ngang tầm mắt, nhìn thẳng trực diện ống kính. Tránh chụp góc xiên, hất từ dưới lên hoặc đổ bóng lên cằm và cổ.',
  },
  {
    icon: 'face',
    iconBg: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Để mặt mộc tự nhiên',
    body: 'Lớp phấn nền, kem chống nắng nâng tone hay son màu sẽ che lấp undertone thật. Hãy tẩy trang nhẹ nhàng để lộ sắc diện mộc tự nhiên.',
  },
  {
    icon: 'face_retouching_off',
    iconBg: 'bg-surface-container-highest text-primary',
    title: 'Vén tóc gọn gàng',
    body: 'Nếu tóc bạn đã nhuộm màu nhân tạo, hãy buộc hoặc kẹp gọn ra sau mang tai để tránh màu tóc nhuộm đánh lừa cảm biến màu da của AI.',
  },
]

export default function PreparationTips() {
  return (
    <section className="bg-surface-container-low/40 px-margin py-space-xl sm:px-margin-desktop lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="text-label-sm font-bold uppercase tracking-wider text-primary">
            Bí Quyết Chuẩn Xác
          </span>
          <h2 className="mt-1 text-headline-lg font-bold text-on-surface">
            4 lời khuyên để có kết quả Personal Color chuẩn xác nhất
          </h2>
          <p className="mt-space-xs text-body-md text-on-surface-variant">
            Để thuật toán AI nhận diện sắc tố da tự nhiên không bị sai lệch, bạn hãy lưu ý các yếu tố sau khi
            chuẩn bị ảnh chụp.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {TIPS.map((tip) => (
            <div
              key={tip.title}
              className="rounded-3xl bg-surface-container-lowest p-space-lg shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl ${tip.iconBg}`}>
                <span className="material-symbols-outlined text-[26px]">{tip.icon}</span>
              </div>
              <h4 className="text-headline-sm font-bold text-on-surface">{tip.title}</h4>
              <p className="mt-space-xs text-body-md leading-relaxed text-on-surface-variant">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
