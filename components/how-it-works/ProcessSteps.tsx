const PALETTE_SWATCHES = [
  { hex: '#0E1F44', label: 'Navy' },
  { hex: '#2541B2', label: 'Cobalt' },
  { hex: '#8F1D57', label: 'Berry' },
  { hex: '#C1175A', label: 'Magenta' },
  { hex: '#0F4C5C', label: 'Teal' },
  { hex: '#F4F6FB', label: 'Ice', dark: true },
  { hex: '#1B1B1E', label: 'Noir' },
  { hex: '#6A0572', label: 'Violet' },
  { hex: '#B80049', label: 'Ruby' },
  { hex: '#3F88C5', label: 'Steel' },
  { hex: '#A7C7E7', label: 'Frost', dark: true },
  { hex: '#E0BBE4', label: 'Lavender', dark: true },
]

export default function ProcessSteps() {
  return (
    <section className="mx-auto w-full max-w-7xl px-margin py-space-xl sm:px-margin-desktop lg:py-20">
      <div className="mb-16 text-center">
        <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
          Quy Trình Tinh Gọn
        </span>
        <h2 className="mt-1 text-headline-lg font-bold text-on-surface">
          Chu trình 3 bước tái định hình phong cách cá nhân
        </h2>
      </div>

      {/* Step 1 */}
      <div className="mb-20 grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-6">
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-headline-sm font-bold text-on-secondary-fixed shadow-sm">
            01
          </div>
          <h3 className="text-headline-md font-bold text-on-surface">Chụp hoặc Tải Ảnh Khuôn Mặt</h3>
          <p className="mt-space-sm text-body-lg leading-relaxed text-on-surface-variant">
            AI Camera tự động kích hoạt tính năng tự cân bằng trắng thông minh, nhận diện góc nghiêng và độ
            phơi sáng nhằm bóc tách chuẩn xác ba chỉ số cốt lõi: <strong>Sắc tướng (Hue)</strong>,{' '}
            <strong>Độ sáng (Value)</strong> và <strong>Độ tinh rực rỡ (Chroma)</strong>.
          </p>
          <div className="mt-space-lg flex items-start gap-space-sm rounded-xl bg-surface-container-low p-space-md shadow-sm">
            <span className="material-symbols-outlined mt-0.5 text-[24px] text-secondary">
              tips_and_updates
            </span>
            <div>
              <h4 className="text-label-lg font-semibold text-on-surface">Mẹo chụp ảnh từ chuyên gia:</h4>
              <p className="mt-0.5 text-body-md text-on-surface-variant">
                Để mặt mộc không trang điểm, đứng trước nguồn ánh sáng tự nhiên ban ngày (cạnh cửa sổ) và
                nhìn thẳng trực diện ống kính với khoảng cách 40-50cm.
              </p>
            </div>
          </div>
          <div className="mt-space-md flex items-center gap-space-md text-label-md text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span> Tự
              động tách nền
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span> Bảo
              mật gương mặt 100%
            </span>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-space-lg shadow-xl">
            <div className="mb-space-md flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                AI Camera Calibrator
              </span>
              <span className="rounded-full bg-surface-container px-2.5 py-1 text-label-sm text-primary">
                ISO 100 • 5600K Daylight
              </span>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-container-low">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/how-it-works/camera-calibrator.jpg"
                alt="AI Camera Calibrator quét gương mặt xác định sắc tố da"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-60 w-48 items-center justify-center rounded-full border-2 border-dashed border-secondary-container/80">
                  <div className="h-4 w-4 animate-ping rounded-full bg-primary/40" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-surface-container-lowest/90 px-3 py-1.5 shadow-md backdrop-blur-md">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  center_focus_strong
                </span>
                <span className="text-label-sm text-on-surface">Khóa 1,024 điểm quang phổ</span>
              </div>
            </div>
            <div className="mt-space-md grid grid-cols-3 gap-space-sm">
              <div className="rounded-xl bg-surface-container-low p-space-sm text-center">
                <span className="block text-label-sm text-on-surface-variant">Undertone</span>
                <span className="text-label-lg font-bold text-primary">Cool/Lạnh (84%)</span>
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-sm text-center">
                <span className="block text-label-sm text-on-surface-variant">Độ tương phản</span>
                <span className="text-label-lg font-bold text-secondary">Cao (Clear)</span>
              </div>
              <div className="rounded-xl bg-surface-container-low p-space-sm text-center">
                <span className="block text-label-sm text-on-surface-variant">Sắc tố mắt/tóc</span>
                <span className="text-label-lg font-bold text-on-surface">Đen khói thuần</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 */}
      <div className="mb-20 grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-6 lg:order-2">
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-headline-sm font-bold text-on-primary-fixed shadow-sm">
            02
          </div>
          <h3 className="text-headline-md font-bold text-on-surface">
            Phân Tích AI &amp; Báo Cáo 12 Mùa Sắc Thái
          </h3>
          <p className="mt-space-sm text-body-lg leading-relaxed text-on-surface-variant">
            Thuật toán độc quyền đối chiếu đặc tính gương mặt với hệ thống phân loại 12 Season Color Palette
            quốc tế (Xuân Rạng Rỡ, Hè Dịu Dàng, Thu Ấm Áp, Đông Sắc Nét...). Bạn nhận được một cẩm nang màu
            toàn diện và độc bản.
          </p>
          <ul className="mt-space-md space-y-space-sm">
            <li className="flex items-start gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-secondary">palette</span>
              <div>
                <strong className="text-label-lg text-on-surface">36 Sắc màu vàng &amp; Bảng màu bổ trợ:</strong>
                <p className="text-body-sm text-on-surface-variant">
                  Lọc chính xác những mã màu làm gương mặt bừng sáng và loại bỏ các sắc độ khiến da xỉn màu.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-primary">brush</span>
              <div>
                <strong className="text-label-lg text-on-surface">Chỉ dẫn Makeup &amp; Màu tóc chuẩn:</strong>
                <p className="text-body-sm text-on-surface-variant">
                  Đề xuất màu son (Hồng lạnh, Cherry, Berry), sắc độ phấn mắt và tone màu nhuộm tóc lý tưởng
                  nhất.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-space-sm rounded-xl bg-surface-container-lowest p-space-sm shadow-sm">
              <span className="material-symbols-outlined text-[22px] text-tertiary">diamond</span>
              <div>
                <strong className="text-label-lg text-on-surface">Trang sức kim loại tương thích:</strong>
                <p className="text-body-sm text-on-surface-variant">
                  Đánh giá tính phù hợp giữa Bạc sáng, Bạch kim, Vàng hồng hay Vàng tây nguyên chất.
                </p>
              </div>
            </li>
          </ul>
        </div>
        <div className="lg:col-span-6 lg:order-1">
          <div className="rounded-3xl bg-surface-container-lowest p-space-lg shadow-xl">
            <div className="mb-space-md flex items-center justify-between border-b border-surface-container-high pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[24px] text-secondary">ac_unit</span>
                <div>
                  <span className="block text-label-sm uppercase text-on-surface-variant">
                    Kết Quả Phân Tích
                  </span>
                  <h4 className="text-headline-sm font-bold text-on-surface">Mùa Đông (Cool Winter)</h4>
                </div>
              </div>
              <span className="rounded-full bg-secondary-container px-space-md py-1 text-label-sm font-semibold text-on-secondary-fixed">
                Độ tin cậy: 99.2%
              </span>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-label-sm font-semibold text-on-surface">
                  Bảng màu lý tưởng (Best Palette)
                </span>
                <span className="text-label-sm text-primary">30 màu tương thích</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {PALETTE_SWATCHES.map((swatch) => (
                  <div
                    key={swatch.hex}
                    style={{ backgroundColor: swatch.hex }}
                    className="flex h-9 items-end justify-center rounded-lg p-1 shadow-sm"
                  >
                    <span className={`font-mono text-[9px] opacity-80 ${swatch.dark ? 'text-slate-800' : 'text-white'}`}>
                      {swatch.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-space-md grid grid-cols-2 gap-space-sm">
              <div className="flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-200 text-rose-700">
                  <span className="material-symbols-outlined text-[20px]">face_retouching_natural</span>
                </div>
                <div>
                  <span className="block text-label-sm text-on-surface-variant">Màu son hoàn hảo</span>
                  <span className="text-label-md font-bold text-on-surface">Đỏ mận, Hồng Ruby lạnh</span>
                </div>
              </div>
              <div className="flex items-center gap-space-sm rounded-xl bg-surface-container-low p-space-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                  <span className="material-symbols-outlined text-[20px]">arrow_left_alt</span>
                </div>
                <div>
                  <span className="block text-label-sm text-on-surface-variant">Trang sức khuyên dùng</span>
                  <span className="text-label-md font-bold text-on-surface">Bạc &amp; Bạch Kim sáng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3 */}
      <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
        <div className="flex flex-col justify-center lg:col-span-6">
          <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary-fixed text-headline-sm font-bold text-on-tertiary-fixed shadow-sm">
            03
          </div>
          <h3 className="text-headline-md font-bold text-on-surface">
            Thử Đồ Ảo 3D &amp; Xây Dựng Capsule Wardrobe
          </h3>
          <p className="mt-space-sm text-body-lg leading-relaxed text-on-surface-variant">
            Tải ảnh trang phục yêu thích của bạn từ bất kỳ sàn TMĐT nào hoặc chọn trực tiếp từ tủ đồ số hóa.
            AI Virtual Fitting mô phỏng chính xác độ rủ sợi vải, phom dáng và sự hòa hợp màu sắc ngay trên
            vóc dáng cơ thể của bạn.
          </p>
          <div className="mt-space-lg grid grid-cols-2 gap-space-sm">
            <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
              <span className="material-symbols-outlined text-[24px] text-primary">view_in_ar</span>
              <h4 className="mt-1 text-label-lg font-bold text-on-surface">Smart Fit Physics</h4>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">
                Mô phỏng chân thực nếp gấp, độ co giãn và bóng sáng của vải lụa, denim, len.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
              <span className="material-symbols-outlined text-[24px] text-secondary">checkroom</span>
              <h4 className="mt-1 text-label-lg font-bold text-on-surface">Mix &amp; Match Hàng Ngày</h4>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">
                Gợi ý 3 outfit mỗi sáng phối hợp từ những món sẵn có trong tủ đồ cá nhân.
              </p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="flex flex-col items-center gap-space-md rounded-3xl bg-surface-container-lowest p-space-lg shadow-xl md:flex-row">
            <div className="flex w-full flex-col items-center rounded-2xl bg-surface-container-low p-space-md md:w-5/12">
              <span className="mb-space-sm text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant">
                Trang Phục Đã Chọn
              </span>
              <div className="h-48 w-36 overflow-hidden rounded-xl bg-white p-2 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/how-it-works/garment-isolated.jpg"
                  alt="Trang phục đã chọn: áo peplum voan hồng nhạt"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="mt-space-sm text-center text-label-md font-bold text-on-surface">
                Áo Peplum Voan Hồng Nhạt
              </span>
              <span className="mt-1 rounded-md bg-emerald-50 px-2 py-0.5 text-label-sm text-emerald-600">
                Chuẩn tông Mùa Đông 98%
              </span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-on-secondary-fixed shadow-md">
              <span className="material-symbols-outlined text-[20px]">sync_alt</span>
            </div>
            <div className="flex w-full flex-col items-center md:w-7/12">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-container shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/how-it-works/tryon-result.jpg"
                  alt="Kết quả thử đồ ảo AI với trang phục đã chọn"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-xl bg-on-surface/80 px-3 py-1.5 text-on-primary backdrop-blur-md">
                  <span className="text-label-sm font-medium">Kết quả thử đồ AI</span>
                  <span className="text-label-sm text-secondary-fixed">Fit Size S • Rất hợp da</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
