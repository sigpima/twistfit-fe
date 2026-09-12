const PALETTE_SWATCHES = [
  { hex: '#FAFAFA', title: 'Pure White' },
  { hex: '#F0F2F5', title: 'Icy Off-white' },
  { hex: '#C8CCD3', title: 'Light Cool Gray' },
  { hex: '#8E95A5', title: 'Medium Slate' },
  { hex: '#6C7280', title: 'Charcoal Medium' },
  { hex: '#505763', title: 'Deep Charcoal' },
  { hex: '#B8C0D4', title: 'Icy Blue Gray' },
  { hex: '#BEA9BA', title: 'Muted Lavender' },
  { hex: '#C991A5', title: 'Cool Rose' },
  { hex: '#FFD1DC', title: 'Ice Pink' },
  { hex: '#F4A7BB', title: 'Blush Rose' },
  { hex: '#E06C9F', title: 'Hot Rose' },
  { hex: '#C43372', title: 'Magenta' },
  { hex: '#A61C5D', title: 'Deep Raspberry' },
  { hex: '#7B194B', title: 'Bordeaux Wine' },
  { hex: '#592651', title: 'Rich Aubergine' },
  { hex: '#3F2B63', title: 'Deep Violet' },
  { hex: '#291749', title: 'Night Purple' },
  { hex: '#3572C6', title: 'Electric Blue' },
  { hex: '#78A6E8', title: 'Sky Ice Blue' },
  { hex: '#5D9CEC', title: 'Cornflower Blue' },
  { hex: '#2B60B8', title: 'True Blue' },
  { hex: '#164B99', title: 'Cobalt Royal' },
  { hex: '#0F3A78', title: 'Deep Navy' },
  { hex: '#1F8287', title: 'Deep Cyan' },
  { hex: '#1C967A', title: 'Teal Blue' },
  { hex: '#276F5F', title: 'Pine Green' },
  { hex: '#0C584E', title: 'Dark Emerald' },
  { hex: '#1A4736', title: 'Forest Green' },
  { hex: '#255648', title: 'Bottle Green' },
  { hex: '#346B55', title: 'Cool Jade' },
  { hex: '#425C51', title: 'Spruce Slate' },
  { hex: '#134958', title: 'Petrol Teal' },
  { hex: '#0A3245', title: 'Deep Teal' },
  { hex: '#0A1F3B', title: 'Midnight Blue' },
  { hex: '#111622', title: 'Pure Onyx Black' },
]

export default function ColorProfileCard() {
  return (
    <section aria-labelledby="primary-analysis-title" className="flex flex-col gap-6 lg:col-span-7">
      <h2 className="sr-only" id="primary-analysis-title">
        Tổng quan mùa sắc thái và bảng màu
      </h2>
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-[#7b89ba]/15 bg-white p-5 shadow-[0_4px_20px_rgba(48,68,97,0.05)] md:flex-row md:items-stretch sm:p-6">
        <div className="relative w-full max-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[#7b89ba]/20 bg-[#eef4fa] shadow-inner md:w-5/12 md:max-w-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/personal-color/portrait-winter.jpg"
            alt="Chân dung phân tích sắc tố khuôn mặt"
            className="aspect-[4/5] h-full w-full object-cover object-center"
          />
        </div>
        <div className="flex w-full flex-col justify-between py-1 md:w-7/12">
          <div>
            <div className="mb-3 inline-block rounded-full border border-[#7b89ba]/20 bg-[#eef4fa] px-3 py-1 text-xs font-semibold text-[#7b89ba]">
              Bảng màu phù hợp nhất
            </div>
            <div className="mb-3 flex items-center gap-3.5">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a89dc] to-[#7b89ba] text-white shadow-md">
                <span className="material-symbols-outlined text-[24px]">ac_unit</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-[#304461]">Mùa Đông (Winter)</h3>
                <p className="text-xs font-medium tracking-wide text-[#7b89ba]">Tông lạnh – Sắc nét – Rõ ràng</p>
              </div>
            </div>
            <p className="mb-5 text-xs leading-relaxed text-[#304461]/80 sm:text-[13px]">
              Bạn thuộc nhóm <strong className="font-semibold text-[#304461]">Mùa Đông (Winter)</strong> với sắc độ
              lạnh, độ tương phản cao và vẻ đẹp rạng rỡ, sắc nét. Các tông màu lạnh, sáng và thuần khiết sẽ giúp làm
              sáng da, tôn đường nét và mang lại sức sống cho gương mặt bạn.
            </p>
          </div>
          <div className="border-t border-[#7b89ba]/15 pt-4">
            <h4 className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#304461] md:text-left">
              Tổng quan sắc diện
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-2 text-center">
                <div className="mb-1.5 h-7 w-7 rounded-full border-2 border-white bg-[#F5E6DA] shadow-xs" />
                <span className="text-[10px] text-[#304461]/70">Độ sáng (da)</span>
                <span className="text-xs font-bold text-[#304461]">Trung bình - sáng</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-2 text-center">
                <div className="mb-1.5 h-7 w-7 rounded-full border-2 border-white bg-[#8EAFDA] shadow-xs" />
                <span className="text-[10px] text-[#304461]/70">Sắc độ</span>
                <span className="text-xs font-bold text-[#4a89dc]">Lạnh</span>
              </div>
              <div className="flex flex-col items-center rounded-xl border border-[#7b89ba]/10 bg-[#eef4fa]/60 p-2 text-center">
                <div className="mb-1.5 h-7 w-7 rounded-full border-2 border-white bg-[#E57EA7] shadow-xs" />
                <span className="text-[10px] text-[#304461]/70">Độ tươi</span>
                <span className="text-xs font-bold text-[#D84B85]">Rực rỡ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-[#7b89ba]/15 bg-white p-6 shadow-[0_4px_20px_rgba(48,68,97,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-[#304461]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7b89ba]" />
            Bảng màu lý tưởng của bạn – Mùa Đông
          </h3>
          <span className="rounded-full bg-[#7b89ba]/10 px-2.5 py-1 text-[11px] font-medium text-[#7b89ba]">
            Winter Palette
          </span>
        </div>
        <div className="grid grid-cols-9 place-items-center gap-2 py-2 sm:gap-3">
          {PALETTE_SWATCHES.map((swatch) => (
            <div
              key={swatch.hex}
              title={swatch.title}
              className="h-7 w-7 cursor-pointer rounded-full border border-black/10 transition-transform hover:scale-[1.18] sm:h-9 sm:w-9"
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border-t border-[#7b89ba]/10 bg-[#eef4fa]/50 p-3 pt-4 sm:items-center">
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#fdc8e9]/50 text-[#7b89ba] sm:mt-0">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          </div>
          <p className="text-xs leading-relaxed text-[#304461]/80">
            Tông màu phù hợp sẽ giúp da bạn trông sáng hơn, che đi khuyết điểm và làm nổi bật đường nét khuôn mặt
            một cách tự nhiên nhất.
          </p>
        </div>
      </div>
    </section>
  )
}
