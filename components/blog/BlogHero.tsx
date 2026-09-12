import Link from 'next/link'

export default function BlogHero() {
  return (
    <div className="mb-space-xl flex flex-col gap-space-sm">
      <div className="flex items-center gap-space-xs text-label-md text-on-surface-variant">
        <Link href="/" className="transition-colors hover:text-primary">
          Trang chủ
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="font-semibold text-primary">Blog &amp; Tạp chí phong cách</span>
      </div>
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div>
          <div className="mb-space-sm inline-flex items-center gap-space-xs rounded-full bg-secondary-container/60 px-space-md py-space-xs text-label-sm text-secondary backdrop-blur-md">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            <span>TwistFit Editorial</span>
          </div>
          <h1 className="text-display-lg-mobile font-bold tracking-tight text-on-surface md:text-display-lg">
            Tạp Chí Phong Cách TwistFit
          </h1>
          <p className="mt-space-xs max-w-2xl text-body-lg text-on-surface-variant">
            Khám phá bí quyết định hình bản sắc, giải mã bảng màu cá nhân và cập nhật xu hướng thời trang ứng
            dụng mới nhất.
          </p>
        </div>
        <div className="flex items-center gap-space-md self-start rounded-2xl bg-surface-container-lowest/80 px-space-lg py-space-sm shadow-sm backdrop-blur-md md:self-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <span className="material-symbols-outlined">menu_book</span>
          </div>
          <div>
            <p className="text-label-md uppercase tracking-wider text-on-surface-variant">Ấn bản phong cách</p>
            <p className="text-headline-sm font-bold text-on-surface">120+ Bài Viết</p>
          </div>
        </div>
      </div>
    </div>
  )
}
