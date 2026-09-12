'use client'

import { useMemo, useState } from 'react'
import FaqSearchBar from './FaqSearchBar'
import FaqCategoryTabs from './FaqCategoryTabs'
import FaqAccordionItem, { type FaqItem } from './FaqAccordionItem'

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'q1',
    number: '01',
    categories: ['personal-color'],
    question: 'Personal Color Test trên TwistFit hoạt động như thế nào qua camera?',
    answer: (
      <>
        <p>
          Thuật toán độc quyền của TwistFit tích hợp mô hình thị giác máy tính chuyên sâu để phân tích phổ
          màu tự nhiên của khuôn mặt bạn theo thời gian thực.
        </p>
        <div className="mt-space-xs flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
          <div className="flex items-center gap-space-xs text-label-md font-semibold text-primary">
            <span className="material-symbols-outlined text-[18px]">palette</span>
            <span>Quy trình 3 bước cốt lõi:</span>
          </div>
          <ul className="list-inside list-disc space-y-1 text-on-surface-variant">
            <li>
              <strong>Định vị sắc tố:</strong> Tách nền và nhận diện độ sáng, độ bão hòa trên da, mắt và viền
              môi.
            </li>
            <li>
              <strong>Đối soát Undertone:</strong> Kiểm tra mức độ phản ứng quang phổ giữa Warm (ấm) và Cool
              (lạnh).
            </li>
            <li>
              <strong>Phân nhóm 16 sắc độ:</strong> Phân loại chi tiết theo hệ 4 mùa kinh điển.
            </li>
          </ul>
        </div>
      </>
    ),
  },
  {
    id: 'q2',
    number: '02',
    categories: ['personal-color'],
    question: 'Tôi cần chuẩn bị điều kiện ánh sáng và góc chụp thế nào để kết quả chính xác nhất?',
    answer: (
      <>
        <p>Độ chính xác của bài kiểm tra màu phụ thuộc đáng kể vào nguồn sáng xung quanh. Chúng tôi khuyến nghị:</p>
        <div className="mt-space-xs grid grid-cols-1 gap-space-sm sm:grid-cols-3">
          <div className="flex flex-col items-center rounded-lg bg-surface-container-low p-space-sm text-center">
            <span className="material-symbols-outlined mb-space-xs text-[24px] text-primary">wb_sunny</span>
            <span className="text-label-md font-semibold text-on-surface">Ánh sáng tự nhiên</span>
            <span className="mt-1 text-body-sm text-outline">
              Chụp cạnh cửa sổ ban ngày, tránh đèn huỳnh quang vàng/trắng gắt.
            </span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-surface-container-low p-space-sm text-center">
            <span className="material-symbols-outlined mb-space-xs text-[24px] text-secondary">
              face_retouching_off
            </span>
            <span className="text-label-md font-semibold text-on-surface">Mặt mộc hoàn toàn</span>
            <span className="mt-1 text-body-sm text-outline">
              Tẩy trang sạch sẽ, không dùng kem chống nắng nâng tông hay kính áp tròng màu.
            </span>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-surface-container-low p-space-sm text-center">
            <span className="material-symbols-outlined mb-space-xs text-[24px] text-tertiary">
              center_focus_strong
            </span>
            <span className="text-label-md font-semibold text-on-surface">Góc mặt chính diện</span>
            <span className="mt-1 text-body-sm text-outline">
              Giữ camera ngang tầm mắt, vén tóc mái để lộ rõ trán và tai.
            </span>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'q3',
    number: '03',
    categories: ['fitting-room'],
    question: 'Tính năng Thử Đồ Ảo (AI Virtual Fitting) có giữ đúng tỷ lệ vóc dáng của tôi không?',
    answer: (
      <>
        <p>
          Hoàn toàn chính xác! Hệ thống Virtual Fitting của TwistFit sử dụng mạng nơ-ron{' '}
          <strong>DensePose kết hợp 3D Neural Mesh</strong> để tái cấu trúc hình thể người dùng từ ảnh toàn
          thân mà không làm biến dạng tỷ lệ chân thực.
        </p>
        <p>
          Vải của từng bộ trang phục được gán thông số vật lý riêng biệt (độ rũ của lụa, độ cứng của denim,
          độ bóng của da nhân tạo), giúp phản chiếu độ ôm sát và chuyển động theo đúng số đo eo, ngực và
          chiều dài tay chân của bạn.
        </p>
      </>
    ),
  },
  {
    id: 'q4',
    number: '04',
    categories: ['personal-color', 'account'],
    question: 'Nếu dùng máy tính (Laptop/PC) thì tôi làm bài test Personal Color như thế nào?',
    answer: (
      <>
        <p>
          Để đảm bảo chất lượng cảm biến camera tốt nhất (do webcam laptop thường có độ phân giải và cân
          bằng trắng thấp), TwistFit áp dụng công nghệ <strong>Đồng Bộ Liên Màn Hình (Cross-device Sync)</strong>:
        </p>
        <div className="flex items-center gap-space-md rounded-lg bg-surface-container-low p-space-md">
          <span className="material-symbols-outlined shrink-0 text-[32px] text-primary">
            qr_code_scanner
          </span>
          <div>
            <h4 className="text-title-md font-medium text-on-surface">Quét mã QR liền mạch</h4>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              Khi bắt đầu làm bài test trên màn hình lớn, một mã QR duy nhất sẽ xuất hiện. Bạn chỉ cần bật
              camera điện thoại quét mã để đo sắc tố, kết quả sẽ đồng bộ hiển thị ngay lập tức lên màn hình
              máy tính.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'q5',
    number: '05',
    categories: ['account'],
    question: 'Báo cáo Personal Color sau khi test có được lưu lại không và tải về ở đâu?',
    answer: (
      <>
        <p>Tất cả các lượt phân tích màu sắc và cấu trúc hình thể đều được lưu vĩnh viễn trong hồ sơ của bạn:</p>
        <ul className="list-inside list-disc space-y-1 text-on-surface-variant">
          <li>
            Truy cập menu góc phải: chọn <strong>&quot;Kết quả đánh giá&quot;</strong> để xem lại mọi bảng
            màu (Best Colors &amp; Worst Colors).
          </li>
          <li>
            Bạn có thể bấm nút <strong>&quot;Xuất Báo Cáo PDF&quot;</strong> để nhận cuốn cẩm nang phối đồ cá
            nhân hóa chuẩn tạp chí thời trang (định dạng sắc nét, dễ dàng lưu trên điện thoại khi đi mua
            sắm).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'q6',
    number: '06',
    categories: ['account', 'stylist'],
    question: 'Dữ liệu hình ảnh khuôn mặt của tôi có được bảo mật không?',
    answer: (
      <>
        <p>TwistFit đặt quyền riêng tư và an toàn dữ liệu của bạn lên ưu tiên hàng đầu. Chúng tôi cam kết:</p>
        <div className="flex flex-col gap-space-xs rounded-lg bg-surface-container-low p-space-md">
          <div className="flex items-center gap-space-xs text-label-md font-semibold text-primary">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>Chính sách không lưu trữ hình ảnh gốc thô (Raw Images)</span>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Ảnh chân dung chụp qua camera chỉ được trích xuất ma trận giá trị màu (RGB/Lab) ngay trên phiên
            làm việc và tự động hủy sau khi tạo báo cáo. Chúng tôi không bao giờ bán, chia sẻ hoặc dùng dữ
            liệu khuôn mặt cho bên thứ ba.
          </p>
        </div>
      </>
    ),
  },
]

export default function FaqSection() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openItemId, setOpenItemId] = useState<string | null>(null)

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.categories.includes(activeCategory)
      const matchesSearch = !query || item.question.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  return (
    <>
      <section className="relative w-full overflow-hidden bg-surface px-margin-desktop py-space-xl">
        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="inline-flex items-center gap-space-xs rounded-full bg-surface-container px-space-md py-space-xs shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">live_help</span>
            <span className="text-label-sm font-semibold uppercase tracking-wider text-primary">
              Trung Tâm Trợ Giúp &amp; Hỏi Đáp
            </span>
          </div>
          <h1 className="mt-space-md text-display-lg font-bold tracking-tight text-on-surface">
            Chúng Tôi Có Thể Giúp Gì Cho Bạn?
          </h1>
          <p className="mt-space-sm max-w-2xl text-body-lg leading-relaxed text-on-surface-variant">
            Tìm câu trả lời nhanh chóng cho các thắc mắc về phân tích Personal Color, phòng thử đồ ảo AI và
            tài khoản TwistFit.
          </p>
          <FaqSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onTagClick={(tagValue) => setSearchQuery(tagValue)}
          />
        </div>
      </section>
      <section className="w-full px-margin-desktop pb-space-xl">
        <div className="mx-auto max-w-4xl">
          <FaqCategoryTabs active={activeCategory} onChange={setActiveCategory} />
          <div className="mt-space-lg flex flex-col gap-space-md">
            {visibleItems.map((item) => (
              <FaqAccordionItem
                key={item.id}
                item={item}
                isOpen={openItemId === item.id}
                onToggle={(id) => setOpenItemId((current) => (current === id ? null : id))}
              />
            ))}
          </div>
          {visibleItems.length === 0 && (
            <div className="mt-space-md rounded-xl bg-surface-container-lowest py-space-xl text-center shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-outline">search_off</span>
              <h4 className="mt-space-xs text-headline-sm font-semibold text-on-surface">
                Không tìm thấy câu hỏi phù hợp
              </h4>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Hãy thử tìm kiếm với các từ khóa ngắn gọn hơn hoặc gửi yêu cầu trực tiếp bên dưới.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
