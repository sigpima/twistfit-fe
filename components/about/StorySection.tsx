const MILESTONES = [
  { year: '2023', label: 'Khởi sinh thuật toán quang phổ da', color: 'text-secondary' },
  { year: '2024', label: 'Hợp tác 20+ Master Stylists', color: 'text-primary' },
  { year: 'Hiện tại', label: '120K+ người dùng tại Việt Nam', color: 'text-tertiary' },
]

export default function StorySection() {
  return (
    <section className="w-full bg-surface-container-low/50 px-margin-desktop py-space-xl">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
          <div className="flex flex-col gap-space-md lg:col-span-6">
            <div className="inline-flex items-center gap-space-xs">
              <span className="h-px w-8 bg-secondary" />
              <span className="text-label-sm font-semibold uppercase tracking-widest text-secondary">
                Câu Chuyện Thương Hiệu
              </span>
            </div>
            <h2 className="text-headline-lg leading-snug text-on-surface">
              Bắt Đầu Từ Nỗi Băn Khoăn: <br />
              <span className="font-serif italic text-primary">
                &quot;Tủ Đồ Đầy Ắp Nhưng Không Có Gì Để Mặc&quot;
              </span>
            </h2>
            <div className="flex flex-col gap-space-md text-body-md leading-relaxed text-on-surface-variant">
              <p>
                Đã bao nhiêu lần bạn đứng trước chiếc tủ quần áo chật ních nhưng vẫn thở dài bất lực? Đã bao
                lần bạn mua một chiếc váy đắt đỏ vì người mẫu mặc quá đẹp, nhưng khi khoác lên mình lại cảm
                thấy làn da bị xỉn màu và kém sắc?
              </p>
              <p>
                Đó chính là thực trạng chung mà đội ngũ sáng lập TwistFit từng trải qua. Chúng tôi nhận thấy
                rào cản lớn nhất của đa số mọi người không nằm ở việc thiếu quần áo, mà nằm ở sự{' '}
                <strong>lệch pha giữa màu sắc trang phục và quang phổ sắc tố cơ thể (undertone, value &amp; chroma)</strong>.
              </p>
              <p>
                Để giải quyết bài toán này, dự án TwistFit Atelier đã ra đời. Chúng tôi dành hơn 2 năm nghiên
                cứu cùng các Image Consultant quốc tế, tích hợp công nghệ AI Camera nhận diện quang phổ ánh
                sáng da thực tế dưới các điều kiện môi trường khác nhau. Từ một thuật toán thử nghiệm tại
                phòng lab, TwistFit nay đã trở thành người bạn đồng hành phong cách của hàng trăm nghìn bạn
                trẻ.
              </p>
            </div>
            <div className="mt-space-sm grid grid-cols-3 gap-space-sm pt-space-sm">
              {MILESTONES.map((milestone) => (
                <div key={milestone.year} className="rounded-lg bg-surface-container-lowest p-space-sm shadow-sm">
                  <span className={`text-label-sm font-semibold ${milestone.color}`}>{milestone.year}</span>
                  <p className="mt-space-xs text-label-md font-medium text-on-surface">{milestone.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative flex flex-col items-center lg:col-span-6">
            <div className="relative aspect-[4/5] w-full max-w-lg overflow-hidden rounded-xl shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/about/story-draping.jpg"
                alt="Phân Tích Draping Vải Truyền Thống trong atelier TwistFit"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/60 via-transparent to-transparent" />
              <div className="absolute inset-x-space-md bottom-space-md text-inverse-on-surface">
                <span className="text-label-sm uppercase tracking-wider text-secondary-container">
                  Atelier Studio
                </span>
                <p className="text-headline-sm font-semibold">Phân Tích Draping Vải Truyền Thống</p>
              </div>
            </div>
            <div className="relative z-20 -mt-16 w-11/12 rounded-xl bg-surface-container-lowest/90 p-space-md shadow-xl backdrop-blur-md sm:-ml-24 sm:w-80">
              <div className="mb-space-xs flex items-center gap-space-sm">
                <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
                <span className="text-label-sm font-semibold uppercase text-primary">
                  TwistFit AI Camera Core
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant">
                Quét 1.024 điểm sắc tố gương mặt để bóc tách 3 thuộc tính: Hue, Value và Saturation chuẩn
                khoa học.
              </p>
              <div className="mt-space-sm flex items-center justify-between rounded bg-surface-container-low/50 px-space-sm py-1 pt-space-xs text-label-sm font-semibold text-on-surface">
                <span>Quang phổ tương thích</span>
                <span className="font-bold text-secondary">Cool Summer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
