import Link from 'next/link'

export default function AboutCtaBanner() {
  return (
    <section className="mb-12 w-full px-margin-desktop py-space-xl">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-space-xl overflow-hidden rounded-xl bg-gradient-to-r from-surface-container to-secondary-container/50 p-space-xl shadow-lg lg:flex-row lg:p-16">
        <div className="relative z-10 max-w-xl text-center lg:text-left">
          <div className="mb-space-md inline-flex items-center gap-space-xs rounded-full bg-surface-container-lowest/80 px-space-md py-space-xs shadow-sm backdrop-blur-md">
            <span className="material-symbols-outlined text-[16px] text-secondary">arrow_back_ios_new</span>
            <span className="text-label-sm font-semibold uppercase text-secondary">
              Khởi đầu chuyển hóa phong cách
            </span>
          </div>
          <h2 className="text-display-lg leading-tight tracking-tight text-on-surface">
            Bắt đầu hành trình tìm kiếm sắc màu của riêng bạn ngay hôm nay.
          </h2>
          <p className="mt-space-md text-body-lg leading-relaxed text-on-surface-variant">
            Chỉ với 3 phút trải nghiệm bài test AI, bạn sẽ nhận được bản đồ bảng màu cá nhân hóa toàn diện và
            tự do thử nghiệm các outfits trong phòng thử đồ ảo.
          </p>
        </div>
        <div className="relative z-10 flex w-full flex-shrink-0 flex-col gap-space-md sm:flex-row lg:w-auto lg:flex-col">
          <Link
            href="/personal-color/quiz"
            className="inline-flex transform items-center justify-center gap-space-sm whitespace-nowrap rounded-full bg-on-background px-space-xl py-space-md text-center text-label-lg text-surface-container-lowest shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-primary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary-container">
              auto_awesome
            </span>
            <span>Làm bài test Personal Color</span>
          </Link>
          <Link
            href="/outfit/step-1"
            className="inline-flex transform items-center justify-center gap-space-sm whitespace-nowrap rounded-full bg-surface-container-lowest/90 px-space-xl py-space-md text-center text-label-lg text-primary shadow-md backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-surface-container-lowest hover:text-secondary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">styler</span>
            <span>Khám phá phòng thử đồ ảo</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
