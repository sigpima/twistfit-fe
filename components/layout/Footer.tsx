import Link from 'next/link'

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'TikTok',
    path: 'M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.97-4.52V8.4a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.97.17z',
  },
  {
    label: 'Facebook',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'Pinterest',
    path: 'M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z',
  },
  {
    label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
]

export default function Footer() {
  return (
    <footer className="mt-20 w-full border-t border-[#e2e8f0] bg-white pb-8 pt-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-10 border-b border-[#f1f5f9] pb-12 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-black tracking-tight text-[#304461]">TwistFit</h3>
            <p className="text-xs italic text-[#7b89ba]">&quot;A little twist, a better fit&quot;</p>
            <p className="text-xs leading-relaxed text-[#64748b]">
              Nền tảng ứng dụng công nghệ AI Personal Color &amp; Virtual Fitting tiên phong, giúp bạn khám
              phá vẻ đẹp tự nhiên và nâng tầm phong cách thời trang cá nhân hóa.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">Tính năng chính</h4>
            <ul className="space-y-2.5 text-xs text-[#64748b]">
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Trắc nghiệm Personal Color AI
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Phòng thử đồ ảo TwistFit
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Phối đồ theo vóc dáng
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Bản tin xu hướng thời trang
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">Hỗ trợ &amp; thông tin</h4>
            <ul className="space-y-2.5 text-xs text-[#64748b]">
              <li>
                <Link href="/about" className="transition-colors hover:text-[#304461]">
                  Về chúng tôi (About us)
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="transition-colors hover:text-[#304461]">
                  Cách hoạt động (How it works)
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-[#304461]">
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition-colors hover:text-[#304461]">
                  Tạp chí phong cách (Blog)
                </Link>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-[#304461]">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#304461]">Liên hệ &amp; hợp tác</h4>
            <ul className="mb-5 space-y-2.5 text-xs text-[#64748b]">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7b89ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>support@twistfit.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7b89ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>Hotline: 1900 8899</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-[#7b89ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Quận 1, TP. Hồ Chí Minh</span>
              </li>
            </ul>
            <div className="flex items-center gap-3 text-[#7b89ba]">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f3ff] transition-colors hover:bg-[#7b89ba] hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-[#94a3b8] md:flex-row">
          <p>© 2026 TwistFit Vietnam. All rights reserved. Nền tảng ứng dụng định hình phong cách cá nhân.</p>
          <p>Bản quyền thuộc về TwistFit Fashion AI.</p>
        </div>
      </div>
    </footer>
  )
}
