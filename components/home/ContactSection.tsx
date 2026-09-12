'use client'

import { useState, type FormEvent } from 'react'

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    event.currentTarget.reset()
  }

  return (
    <section className="relative mt-12 w-full overflow-hidden bg-surface-container-low/80 py-space-xl">
      <div className="relative z-10 mx-auto max-w-7xl px-margin-desktop">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="flex flex-col space-y-6 lg:col-span-5">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/contact-logo.png" alt="Logo TwistFit" className="h-12 w-12 object-contain" />
              <div>
                <span className="block text-headline-sm font-bold leading-none text-primary">TwistFit</span>
                <span className="text-body-sm text-on-surface-variant">A little twist, a better fit</span>
              </div>
            </div>
            <h3 className="text-headline-md text-on-surface">Chúng Tôi Luôn Lắng Nghe Ý Kiến Của Bạn</h3>
            <p className="text-body-md text-on-surface-variant">
              Bạn có câu hỏi về kết quả màu sắc, muốn hợp tác stylist hoặc muốn góp ý tính năng phối đồ? Hãy
              để lại lời nhắn cho đội ngũ cố vấn thời trang của TwistFit.
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <span className="text-body-md">support@twistfit.vn</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <span className="text-body-md">1900 8899 (8:30 - 21:00 hàng ngày)</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tertiary-fixed text-tertiary">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <span className="text-body-md">TwistFit AI Studio, Quận 1, TP. Hồ Chí Minh</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_12px_36px_rgba(4,28,55,0.06)] lg:p-10">
              <div className="mb-6">
                <h4 className="text-headline-sm font-bold text-on-surface">Hòm Thư Góp Ý &amp; Đặt Lịch Tư Vấn</h4>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Vui lòng điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
                </p>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-label-md font-semibold text-on-surface">
                      Họ và tên *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Linh Đan"
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-label-md font-semibold text-on-surface">
                      Địa chỉ Email *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="linhdan@gmail.com"
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="text-label-md font-semibold text-on-surface">
                      Số điện thoại
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      placeholder="0909 xxx xxx"
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-subject" className="text-label-md font-semibold text-on-surface">
                      Chủ đề góp ý *
                    </label>
                    <select
                      id="contact-subject"
                      required
                      defaultValue=""
                      className="w-full rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface transition-colors focus:bg-surface-container-high focus:outline-none"
                    >
                      <option value="" disabled>
                        -- Chọn chủ đề --
                      </option>
                      <option value="color-test">Hỏi về kết quả Personal Color</option>
                      <option value="virtual-fitting">Góp ý tính năng Phòng Thử Đồ Ảo</option>
                      <option value="stylist">Đăng ký hợp tác Stylist / Fashion KOL</option>
                      <option value="other">Ý kiến đóng góp khác</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-label-md font-semibold text-on-surface">
                    Nội dung tin nhắn *
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="Chia sẻ suy nghĩ, góp ý hoặc yêu cầu hỗ trợ của bạn tại đây..."
                    className="w-full resize-none rounded-xl bg-surface px-4 py-3 text-body-md text-on-surface placeholder:text-outline transition-colors focus:bg-surface-container-high focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-label-sm text-primary">
                    {submitted ? 'Cảm ơn bạn! Lời nhắn đã được chuyển đến bộ phận chăm sóc TwistFit.' : ''}
                  </span>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-9 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container sm:w-auto"
                  >
                    <span>GỬI LỜI NHẮN</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
