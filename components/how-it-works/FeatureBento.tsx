export default function FeatureBento() {
  return (
    <section className="bg-surface-container-low/50 px-margin py-space-xl sm:px-margin-desktop lg:py-24" id="video-demo">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="text-label-sm font-bold uppercase tracking-wider text-primary">
            Trải Nghiệm Trực Quan
          </span>
          <h2 className="mt-1 text-headline-lg font-bold text-on-surface">
            Công nghệ AI đồng hành cùng phong cách của bạn
          </h2>
          <p className="mt-space-xs text-body-md text-on-surface-variant">
            Từ lúc mở điện thoại quét gương mặt đến khi tự tin diện outfit hoàn hảo đi làm hay dự tiệc,
            TwistFit tối ưu hóa mọi quyết định mua sắm của bạn.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-3xl bg-surface-container-lowest p-space-lg shadow-md">
            <div>
              <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
              <h4 className="text-headline-sm font-bold text-on-surface">1. Số hóa tủ đồ thần tốc</h4>
              <p className="mt-space-xs text-body-md text-on-surface-variant">
                Chụp ảnh quần áo bạn có trong tủ. AI tự động tách nền, phân loại danh mục (Áo sơ mi, Chân
                váy, Blazer) và gán tag sắc độ màu tự động.
              </p>
            </div>
            <div className="mt-space-lg flex items-center justify-around rounded-2xl bg-surface-container-low p-space-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1 shadow-xs">
                <span className="material-symbols-outlined text-[28px] text-primary">apparel</span>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1 shadow-xs">
                <span className="material-symbols-outlined text-[28px] text-secondary">styler</span>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1 shadow-xs">
                <span className="material-symbols-outlined text-[28px] text-tertiary">shopping_bag</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-3xl bg-surface-container-lowest p-space-lg shadow-md">
            <div>
              <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[24px]">tune</span>
              </div>
              <h4 className="text-headline-sm font-bold text-on-surface">2. Phân tích quang phổ</h4>
              <p className="mt-space-xs text-body-md text-on-surface-variant">
                Công nghệ độc quyền giải mã sắc tố melanin và hemoglobin dưới da để tìm ra bảng màu cá nhân
                chính xác tuyệt đối mà không cần đặt lịch tốn kém.
              </p>
            </div>
            <div className="mt-space-lg rounded-2xl bg-surface-container-low p-space-sm">
              <div className="mb-1 flex justify-between text-label-sm font-medium text-on-surface-variant">
                <span>Độ tương phản tự nhiên</span>
                <span className="font-bold text-primary">88/100</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full w-[88%] rounded-full bg-primary" />
              </div>
              <div className="mb-1 mt-3 flex justify-between text-label-sm font-medium text-on-surface-variant">
                <span>Nhiệt độ sắc tố (Cool Undertone)</span>
                <span className="font-bold text-secondary">92/100</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full w-[92%] rounded-full bg-secondary" />
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-3xl bg-surface-container-lowest p-space-lg shadow-md">
            <div>
              <div className="mb-space-md flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed">
                <span className="material-symbols-outlined text-[24px]">calendar_month</span>
              </div>
              <h4 className="text-headline-sm font-bold text-on-surface">3. Lên đồ thông minh mỗi ngày</h4>
              <p className="mt-space-xs text-body-md text-on-surface-variant">
                Không còn cảm giác &quot;không có gì để mặc&quot;. TwistFit tự động gợi ý các set đồ phối sẵn
                theo thời tiết hôm nay và lịch trình cuộc hẹn.
              </p>
            </div>
            <div className="mt-space-lg flex items-center justify-between rounded-2xl bg-surface-container-low p-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[22px] text-secondary">wb_sunny</span>
                <span className="text-label-sm font-semibold text-on-surface">Hà Nội, 26°C Nắng</span>
              </div>
              <span className="rounded-full bg-primary px-2.5 py-1 text-label-sm text-on-primary">
                3 gợi ý outfit
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
