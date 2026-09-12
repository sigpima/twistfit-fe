'use client'

import { useState, type FormEvent } from 'react'

export default function BlogNewsletterSection() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <section className="mb-space-xl">
      <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest/90 p-space-lg shadow-lg backdrop-blur-2xl md:p-space-xl">
        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <div className="mb-space-sm flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-secondary shadow-xs">
            <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
          </div>
          <h3 className="mb-space-xs text-headline-md font-bold tracking-tight text-on-surface md:text-headline-lg">
            Nhận Cẩm Nang Thời Trang Hàng Tuần
          </h3>
          <p className="mb-space-lg max-w-lg text-body-md text-on-surface-variant md:text-body-lg">
            Đăng ký nhận cẩm nang thời trang &amp; mẹo màu sắc độc quyền hàng tuần vào hộp thư của bạn. Hoàn
            toàn miễn phí, hủy đăng ký bất kỳ lúc nào.
          </p>
          <form className="flex w-full max-w-md flex-col gap-space-xs sm:flex-row" onSubmit={handleSubmit}>
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                mail
              </span>
              <input
                type="email"
                required
                placeholder="Nhập địa chỉ email của bạn..."
                className="w-full rounded-full bg-surface-container-low/90 py-space-sm pl-11 pr-space-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-space-xs rounded-full bg-primary px-space-lg py-space-sm text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
            >
              <span>Đăng ký</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
          {submitted && (
            <p className="mt-space-sm text-label-md font-semibold text-primary">
              Cảm ơn bạn đã đăng ký theo dõi TwistFit!
            </p>
          )}
          <div className="mt-space-md flex items-center gap-space-md text-label-sm text-outline">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">verified</span> Không
              spam
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">lock</span> Bảo mật dữ
              liệu
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">diamond</span> 15,000+
              Readers
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
