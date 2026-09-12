'use client'

import { useState } from 'react'
import { useQrModal } from '@/components/qr-modal/QrModalProvider'

const TABS = [
  { icon: 'styler', label: 'Phối Đồ Thông Minh' },
  { icon: 'palette', label: 'Personal Color Test' },
  { icon: 'forum', label: 'Diễn Đàn Phong Cách' },
] as const

export default function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section id="features-section" className="w-full bg-surface-container-lowest/60 py-space-xl">
      <div className="mx-auto max-w-7xl px-margin-desktop">
        <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2 rounded-full bg-secondary-fixed px-3.5 py-1 text-label-sm text-on-secondary-fixed-variant">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            <span>Hệ Sinh Thái Thời Trang Cá Nhân Hoá</span>
          </div>
          <h2 className="text-headline-lg text-on-surface">Ba Bước Đột Phá Nâng Tầm Phong Cách</h2>
          <p className="mt-2 text-body-lg text-on-surface-variant">
            Từ phân tích sinh trắc quang phổ đến trải nghiệm thử đồ ảo và kết nối hội những tín đồ mặc đẹp
            cùng hệ sắc tố.
          </p>
        </div>
        <div className="mb-10 flex justify-center overflow-x-auto pb-2">
          <div role="tablist" className="inline-flex gap-1 rounded-full bg-surface-container p-1.5 shadow-inner">
            {TABS.map((tab, index) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={activeTab === index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-label-lg transition-all ${
                  activeTab === index
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        {activeTab === 0 && <SmartOutfitPanel />}
        {activeTab === 1 && <PersonalColorPanel />}
        {activeTab === 2 && <CommunityPanel />}
      </div>
    </section>
  )
}

const OUTFIT_STEPS = [
  {
    step: '1',
    badge: 'bg-secondary-container text-on-secondary-fixed',
    title: 'Tải lên hoặc chọn items từ tủ đồ cá nhân',
    body: 'Chụp hình trang phục bất kỳ, AI thông minh sẽ tự động tách nền siêu tốc và phân loại vào danh mục áo, quần, váy hoặc phụ kiện.',
  },
  {
    step: '2',
    badge: 'bg-primary-fixed text-primary',
    title: 'Chọn người mẫu ảo theo vóc dáng',
    body: 'Chọn từ kho 40+ mẫu có sẵn đa dạng số đo hoặc tự tải lên ảnh toàn thân của chính bạn để cá nhân hóa tỷ lệ cơ thể tuyệt đối.',
  },
  {
    step: '3',
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Xem mô phỏng AI & Lưu công thức mặc đẹp',
    body: 'Chiêm ngưỡng outfit hiển thị sinh động, kiểm tra độ hòa hợp sắc thái và thêm ngay vào lookbook tuần để không bao giờ phải băn khoăn "Hôm nay mặc gì?".',
  },
]

function SmartOutfitPanel() {
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-low p-6 shadow-sm lg:col-span-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_fix_high</span>
            <h3 className="text-headline-sm text-on-surface">Studio Thử Đồ Ảo AI</h3>
          </div>
          <span className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
            Tự động tách nền
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-on-surface-variant">1. Chọn đồ</p>
            <div className="mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-surface-container p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/studio-outfit.jpg" alt="Áo peplum voan hồng pastel" className="h-full w-full object-contain" />
            </div>
            <div className="grid w-full grid-cols-3 gap-1">
              <div className="flex h-6 items-center justify-center rounded bg-primary-fixed text-[9px] font-bold text-primary">Áo</div>
              <div className="flex h-6 items-center justify-center rounded bg-surface-container text-[9px] text-on-surface-variant">Váy</div>
              <div className="flex h-6 items-center justify-center rounded bg-surface-container text-[9px] text-on-surface-variant">Kính</div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-on-surface-variant">2. Người mẫu</p>
            <div className="grid w-full grid-cols-2 gap-1.5">
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-short-hair.jpg" alt="Mẫu nữ tóc ngắn mặc áo phông trắng" className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-long-curl.jpg" alt="Mẫu nữ tóc dài xoăn nhẹ" className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="aspect-square overflow-hidden rounded-lg bg-surface-container-highest p-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/home/model-tall.jpg" alt="Mẫu nữ dáng cao gầy phong cách năng động" className="h-full w-full rounded-md object-cover" />
              </div>
              <div className="flex aspect-square flex-col items-center justify-center rounded-lg bg-secondary-fixed text-secondary">
                <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                <span className="mt-0.5 text-[8px] font-bold">Tải ảnh</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-2xl bg-surface-container-lowest p-3">
            <p className="mb-2 text-label-sm font-bold text-primary">3. Kết quả AI</p>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-surface-container shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/home/model-tryon-result.jpg"
                alt="Người mẫu mặc thử áo lụa satin hồng pastel do AI ướm"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-1 right-1 rounded bg-on-surface/80 px-1.5 py-0.5 text-[8px] text-surface-container-lowest">
                Khớp 99%
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container-lowest px-2 pt-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">hd</span>
            <span className="text-label-sm text-on-surface">Chế độ hiển thị chất lượng cao HD</span>
          </div>
          <div className="flex h-5 w-10 items-center justify-end rounded-full bg-primary p-0.5">
            <div className="h-4 w-4 rounded-full bg-on-primary shadow-sm" />
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-primary">Tính năng trọng tâm 01</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">Phối Đồ Đa Năng Trong 3 Chạm</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Không còn nỗi lo mua quần áo online bị lệch form hay không hợp màu da. TwistFit tạo dựng phòng
            thay đồ ảo chuẩn xác đến từng nếp vải.
          </p>
        </div>
        <div className="space-y-4">
          {OUTFIT_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container-high/40">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{item.title}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-label-lg text-on-primary shadow-md transition-all hover:bg-primary-container"
          >
            <span>Thử Tính Năng Phối Đồ</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  )
}

const COLOR_TEST_STEPS = [
  {
    step: '1',
    badge: 'bg-secondary-container text-on-secondary-fixed',
    title: 'Quét mã QR bằng điện thoại',
    body: 'Mở camera máy ảnh quét mã để lập tức kết nối bộ quét nhận diện khuôn mặt trực tiếp mà không cần cài đặt thêm ứng dụng.',
  },
  {
    step: '2',
    badge: 'bg-primary-fixed text-primary',
    title: 'Căn chỉnh khuôn mặt trong 5 giây',
    body: 'Hệ thống tự động bù trừ ánh sáng, đo undertone (ấm/lạnh), sắc tố lòng đen mắt và độ tương phản tự nhiên của làn da.',
  },
  {
    step: '3',
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Nhận báo cáo 12 trang cá nhân hoá',
    body: 'Sở hữu cẩm nang chi tiết trọn đời: từ bảng màu "chân ái", màu son khử xỉn da đến loại trang sức giúp bạn tỏa sáng.',
  },
]

const SPECTRUM_METRICS = [
  { label: 'Độ sáng da', value: 68, color: 'bg-secondary' },
  { label: 'Sắc độ (Tone Lạnh)', value: 84, color: 'bg-primary' },
  { label: 'Độ tương phản tự nhiên', value: 76, color: 'bg-secondary-container' },
]

const SPECTRUM_RECOMMENDATIONS = [
  { icon: 'checkroom', badge: 'bg-primary-fixed text-primary', title: 'Trang phục', body: 'Xanh coban, hồng thạch anh' },
  { icon: 'brush', badge: 'bg-secondary-fixed text-secondary', title: 'Màu son', body: 'Hồng berry lạnh, đỏ mận' },
  { icon: 'diamond', badge: 'bg-tertiary-fixed text-tertiary', title: 'Phụ kiện', body: 'Bạc bạch kim, ngọc trai' },
]

function PersonalColorPanel() {
  const { openQrModal } = useQrModal()

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">palette</span>
            <span className="text-label-lg font-bold text-on-surface">Kết Quả Đo Sắc Tố Thực Tế</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-0.5 text-xs font-semibold text-[#16a34a]">
            <span className="material-symbols-outlined text-[14px]">check_circle</span> Độ chính xác cao
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h4 className="text-label-md font-bold text-on-surface">Chỉ số phân giải quang phổ</h4>
            {SPECTRUM_METRICS.map((metric) => (
              <div key={metric.label}>
                <div className="mb-1 flex justify-between text-xs font-medium">
                  <span className="text-on-surface-variant">{metric.label}</span>
                  <span className="font-bold text-on-surface">{metric.value} / 100</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div className={`h-full rounded-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-2xl bg-surface-container-low p-4">
            <h4 className="text-label-md font-bold text-on-surface">Gợi ý ứng dụng thực tiễn</h4>
            {SPECTRUM_RECOMMENDATIONS.map((item) => (
              <div key={item.title} className="flex items-center gap-2 text-xs">
                <div className={`flex h-6 w-6 items-center justify-center rounded font-bold ${item.badge}`}>
                  <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">{item.title}</p>
                  <p className="text-[11px] text-on-surface-variant">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-secondary-fixed/50 p-3">
          <span className="material-symbols-outlined text-[24px] text-secondary">phonelink_ring</span>
          <p className="text-body-sm text-on-secondary-fixed-variant">
            <strong>Gợi ý:</strong> Tính năng đạt kết quả tối ưu nhất khi sử dụng camera góc rộng trên điện
            thoại thông minh dưới ánh sáng tự nhiên.
          </p>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-secondary">Tính năng trọng tâm 02</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">Khám Phá Sắc Độ Mùa Cá Nhân</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Được bảo chứng bởi thuật toán phân tích màu sắc 12 mùa chuyên sâu từ Hàn Quốc kết hợp thị giác
            máy tính hiện đại.
          </p>
        </div>
        <div className="space-y-4">
          {COLOR_TEST_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{item.title}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={openQrModal}
            className="inline-flex items-center gap-2 rounded-full bg-secondary px-8 py-3.5 text-label-lg text-on-secondary shadow-md transition-all hover:bg-secondary/90"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            <span>Mở Quét QR / Test Ngay</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const COMMUNITY_POSTS = [
  {
    image: '/home/street-outfit-hanoi.jpg',
    alt: 'Outfit đường phố trench coat xanh pastel tại Hà Nội',
    tag: 'Mùa Hạ',
    tagColor: 'text-primary',
    author: 'An Nhiên',
    likes: 428,
    caption: 'Set đồ tone pastel nhẹ nhàng đi làm và cafe cuối tuần',
  },
  {
    image: '/home/blazer-outfit.jpg',
    alt: 'Set đồ blazer màu mận chín và trang sức bạc',
    tag: 'Mùa Đông',
    tagColor: 'text-secondary',
    author: 'Minh Khuê',
    likes: 852,
    caption: 'Công thức son mận chín và áo dạ đen cho ngày trở lạnh',
  },
]

const COMMUNITY_STEPS = [
  {
    step: '1',
    badge: 'bg-secondary-container text-on-secondary-fixed',
    title: 'Đăng tải lookbook & công thức outfit',
    body: 'Tự tin chia sẻ những set đồ hàng ngày, đánh dấu nhãn sắc độ cá nhân để giúp bạn bè cùng tông màu dễ dàng tham khảo.',
  },
  {
    step: '2',
    badge: 'bg-primary-fixed text-primary',
    title: 'Nhận feedback từ Stylist và cộng đồng',
    body: 'Gửi câu hỏi tư vấn cách phối phụ kiện hoặc lựa chọn kiểu cổ áo tôn dáng, nhận phản hồi tức thì từ cộng đồng sành điệu.',
  },
  {
    step: '3',
    badge: 'bg-tertiary-fixed text-on-tertiary-fixed',
    title: 'Lưu vào bộ sưu tập cá nhân trong 1 chạm',
    body: 'Thả tim và gom những ý tưởng mix-match ưng ý vào album "Bộ sưu tập đã lưu" trên trang tài khoản của riêng bạn.',
  },
]

function CommunityPanel() {
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm lg:col-span-6">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">groups</span>
            <span className="text-label-lg font-bold text-on-surface">Cộng Đồng TwistFit Style Club</span>
          </div>
          <span className="text-xs font-semibold text-primary">#CoolSummer #WinterVibe</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {COMMUNITY_POSTS.map((post) => (
            <div key={post.author} className="overflow-hidden rounded-2xl bg-surface-container-low shadow-sm">
              <div className="relative h-44 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.image} alt={post.alt} className="h-full w-full object-cover" />
                <span className={`absolute right-2 top-2 rounded-full bg-surface-container-lowest/80 px-2 py-0.5 text-[10px] font-bold ${post.tagColor}`}>
                  {post.tag}
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm font-bold text-on-surface">{post.author}</span>
                  <div className="flex items-center gap-1 text-xs text-secondary">
                    <span className="material-symbols-outlined text-[14px]">favorite</span>
                    <span>{post.likes}</span>
                  </div>
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] text-on-surface-variant">{post.caption}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container p-3">
          <span className="text-xs font-medium text-on-surface">Hơn 4,500 bài viết chia sẻ phong cách mỗi tháng</span>
          <span className="text-xs font-bold text-primary">Tham gia ngay →</span>
        </div>
      </div>
      <div className="flex flex-col space-y-6 lg:col-span-6">
        <div>
          <span className="text-label-md font-bold uppercase tracking-wider text-tertiary">Tính năng trọng tâm 03</span>
          <h3 className="mt-1 text-headline-lg text-on-surface">Không Gian Kết Nối Hội Tín Đồ Mặc Đẹp</h3>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Học hỏi mẹo phối đồ từ những người bạn có cùng sắc thái da và cùng nhau xây dựng tủ đồ thông minh
            bền vững.
          </p>
        </div>
        <div className="space-y-4">
          {COMMUNITY_STEPS.map((item) => (
            <div key={item.step} className="flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-headline-sm font-bold ${item.badge}`}>
                {item.step}
              </div>
              <div>
                <h4 className="text-title-md font-bold text-on-surface">{item.title}</h4>
                <p className="mt-1 text-body-md text-on-surface-variant">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-tertiary px-8 py-3.5 text-label-lg text-on-tertiary shadow-md transition-all hover:bg-tertiary/90"
          >
            <span>Khám Phá Diễn Đàn</span>
            <span className="material-symbols-outlined text-[18px]">explore</span>
          </a>
        </div>
      </div>
    </div>
  )
}
