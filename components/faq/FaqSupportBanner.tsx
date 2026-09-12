export default function FaqSupportBanner() {
  return (
    <section className="w-full px-margin-desktop pb-space-xl">
      <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-between gap-space-lg overflow-hidden rounded-xl bg-gradient-to-r from-primary-fixed to-surface-container-high p-space-lg shadow-md md:flex-row md:p-space-xl">
        <div className="relative z-10 flex-1">
          <div className="mb-space-xs inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest/80 px-space-sm py-space-xs">
            <span className="material-symbols-outlined text-[16px] text-secondary">support_agent</span>
            <span className="text-label-sm font-semibold uppercase tracking-wider text-secondary">
              Hỗ Trợ 1 - 1
            </span>
          </div>
          <h3 className="text-headline-md font-bold text-on-surface">
            Vẫn Còn Câu Hỏi Chưa Được Giải Đáp?
          </h3>
          <p className="mt-space-xs max-w-lg text-body-md leading-relaxed text-on-surface-variant">
            Đội ngũ Stylist và chuyên gia công nghệ của TwistFit luôn sẵn sàng hỗ trợ bạn qua kênh trò chuyện
            trực tuyến hoặc giải đáp phản hồi chi tiết.
          </p>
        </div>
        <div className="relative z-10 flex w-full shrink-0 flex-col gap-space-sm sm:flex-row md:w-auto">
          <a
            href="#"
            className="flex items-center justify-center gap-space-xs rounded-full bg-primary px-space-lg py-space-sm text-center text-label-lg text-on-primary shadow-sm transition-all duration-300 hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Liên hệ hỗ trợ ngay</span>
          </a>
          <a
            href="#"
            className="flex items-center justify-center gap-space-xs rounded-full bg-surface-container-lowest px-space-lg py-space-sm text-center text-label-lg text-primary shadow-sm transition-all duration-300 hover:bg-surface"
          >
            <span className="material-symbols-outlined text-[18px]">rate_review</span>
            <span>Gửi phản hồi</span>
          </a>
        </div>
      </div>
    </section>
  )
}
