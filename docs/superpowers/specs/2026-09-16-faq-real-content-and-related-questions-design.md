# FAQ: Real Content, New Category Taxonomy, and Related Questions — Design

## Context

`/faq` is a fully backend-driven, admin-editable FAQ system (`backend/app/domains/faq/`, `frontend/components/faq/`) currently seeded with 6 demo Q&A items across 4 categories (`personal-color`, `fitting-room`, `account`, `stylist`). The user has provided real FAQ content — 33 Q&A pairs across 4 categories in a specific order (Thiết lập tài khoản → Màu sắc cá nhân → Phối đồ → Chính sách) — to replace the demo content entirely, plus wants the display redesigned so each expanded answer shows a "related questions" section underneath.

## Content (verbatim, as given by the user, with 3 corrections applied per brainstorming decisions — see Decisions table)

### Thiết lập tài khoản (category: `account`)

1. **Tôi không nhận được mã xác thực (OTP) hoặc email kích hoạt thì phải làm sao?**
   Hãy kiểm tra kỹ hòm thư rác/spam. Nếu vẫn chưa nhận được sau 1–2 phút, bạn bấm nút "Gửi lại mã" hoặc kiểm tra lại độ chính xác của địa chỉ email/số điện thoại đã nhập.
2. **Tôi quên mật khẩu thì lấy lại bằng cách nào?**
   Chọn "Quên mật khẩu" tại màn hình đăng nhập, điền email đăng ký tài khoản và làm theo hướng dẫn trong link vừa được gửi tới hộp thư của bạn.
3. **Kết quả đánh giá màu sắc cá nhân và dữ liệu tủ đồ ảo có bị mất khi tôi đăng xuất không?**
   Không. Mọi dữ liệu về tủ đồ, kết quả trắc nghiệm và lịch sử phối đồ đều được tự động lưu trữ an toàn trên hệ thống máy chủ gắn liền với tài khoản của bạn.
4. **Điều gì sẽ xảy ra với hình ảnh trang phục và kết quả đánh giá màu sắc cá nhân khi tôi xóa tài khoản?**
   Toàn bộ ảnh tủ đồ, lịch sử phối đồ, bài viết trên diễn đàn và kết quả đánh giá màu sắc cá nhân của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống máy chủ và không thể khôi phục lại.
5. **Tôi có thể dùng website trên điện thoại (giao diện di động) mượt mà không?**
   Hoàn toàn được. Trang web được tối ưu hóa hiển thị trên mọi trình duyệt điện thoại (iOS và Android), giúp bạn chụp ảnh tải đồ lên và kiểm tra màu sắc cá nhân mọi lúc mọi nơi.
6. **Tôi có thể đăng nhập cùng một tài khoản trên nhiều thiết bị (điện thoại, máy tính) không?**
   Có. Dữ liệu tủ đồ và kết quả đánh giá của bạn sẽ tự động đồng bộ hóa trên mọi thiết bị khi bạn đăng nhập cùng một tài khoản.
7. **Tôi có thể cập nhật lại các chỉ số cơ thể (chiều cao, cân nặng, dáng người) trong tài khoản không?**
   Có. Bạn vào mục Hồ sơ cá nhân > chọn Thông tin cá nhân, cập nhật lại số đo mới và bấm Lưu thay đổi.

### Đánh giá màu sắc cá nhân (category: `personal-color`)

1. **Màu sắc cá nhân là gì?**
   Màu sắc cá nhân (Personal Color) là phương pháp phân tích màu sắc dựa trên sắc độ da, màu tóc, màu mắt và độ tương phản tự nhiên của gương mặt để tìm ra những gam màu phù hợp nhất với mỗi người. Thay vì lựa chọn màu sắc chỉ theo xu hướng, màu sắc cá nhân giúp xác định bảng màu riêng có khả năng làm nổi bật diện mạo, từ trang phục, phụ kiện đến phong cách trang điểm.
2. **Màu sắc cá nhân có thay đổi theo thời gian không?**
   Undertone da thường không thay đổi, vì vậy nhóm màu sắc cá nhân cơ bản của mỗi người thường giữ nguyên. Tuy nhiên, cảm nhận về màu sắc phù hợp có thể thay đổi do màu tóc, phong cách trang điểm, độ rám nắng hoặc sự thay đổi trong cách xây dựng hình ảnh cá nhân.
3. **Biết màu sắc cá nhân mang lại lợi ích gì cho phong cách và diện mạo của tôi?**
   Thấu hiểu màu sắc cá nhân là chìa khóa giúp bạn dễ dàng chọn lựa trang phục tôn lên diện mạo, đồng thời tránh lãng phí vào những xu hướng không phù hợp. Đây không chỉ là nền tảng giúp bạn chọn trang phục tôn da và xây dựng tủ đồ bền vững, mà còn hỗ trợ chọn màu tóc, màu son trang điểm và phụ kiện hài hòa nhất với gương mặt.
4. **Bài đánh giá màu sắc cá nhân trên website hoạt động như thế nào?** (markdown answer with 3 bolded steps)
   Bài đánh giá được thiết kế liền mạch theo quy trình 3 bước:

   **Bước 1: Phân tích đặc điểm tự nhiên**
   Hệ thống sử dụng thuật toán thông minh để phân tích các yếu tố sắc tố da, mạch máu cổ tay, màu mắt và tóc thông qua bộ câu hỏi trắc nghiệm, từ đó xác định nhóm mùa chuyên sâu (Xuân - Hạ - Thu - Đông) của bạn.

   **Bước 2: Ướm thử trực quan với AR Draping**
   Ngay sau khi có kết quả, công nghệ thực tế ảo sẽ kích hoạt camera để bạn ướm trực tiếp các dải màu thuộc nhóm mùa đó lên gương mặt theo thời gian thực, giúp bạn tự kiểm chứng độ sáng và độ hòa hợp của làn da.

   **Bước 3: Đề xuất gợi ý ứng dụng**
   Dựa trên nhóm màu đã xác định, hệ thống cung cấp các gợi ý ứng dụng đa dạng giúp bạn dễ dàng khai thác tối đa bảng màu cá nhân vào trang phục, làm đẹp và định hình phong cách hàng ngày.
5. **Bài đánh giá màu sắc cá nhân có độ chính xác cao không?**
   Bài đánh giá cung cấp định hướng chính xác từ 70% - 80% dựa trên sự quan sát thực tế của bạn. Đây là công cụ hỗ trợ miễn phí để bạn bắt đầu định hình phong cách cá nhân trước khi quyết định tư vấn trực tiếp với chuyên gia.
6. **Làm sao để tôi phân biệt Undertone (sắc tố da) và Skintone (màu da)?**
   **Skintone**: Là màu da bề mặt mà bạn nhìn thấy bằng mắt thường (trắng, ngăm, trung tính...), có thể thay đổi theo thời gian, mùa trong năm hoặc chịu ảnh hưởng từ yếu tố môi trường và thói quen chăm sóc da.

   **Undertone**: Là sắc tố ẩn dưới bề mặt da, khác với skintone - màu da bạn nhìn thấy bằng mắt thường. Trong khi skintone có thể thay đổi theo thời tiết, ánh nắng hay chế độ chăm sóc da, Undertone lại ổn định và không thay đổi theo thời gian. Bài quiz sẽ tập trung xác định Undertone của bạn.
7. **Tôi có cần phải bỏ hết quần áo cũ không hợp với màu sắc cá nhân không?**
   Hoàn toàn không cần thiết. Bạn vẫn có thể mặc những màu mình yêu thích bằng các mẹo nhỏ:
   - Kết hợp màu không hợp ở phần thân dưới (quần, chân váy) xa khuôn mặt.
   - Sử dụng phụ kiện, khăn quàng hoặc tone trang điểm chuẩn Màu sắc cá nhân để cân bằng lại tổng thể.
8. **Bài đánh giá màu sắc cá nhân có mất phí không và tôi có thể thực hiện lại không?** *(corrected — original was cut off mid-sentence; trimmed to the complete thought per brainstorming decision)*
   Bài đánh giá màu sắc cá nhân trên website của chúng tôi hoàn toàn MIỄN PHÍ và KHÔNG GIỚI HẠN LƯỢT LÀM. Bạn có thể thực hiện bất cứ lúc nào và lưu lại kết quả.

### Phối đồ (category: `fitting-room`)

1. **Tính năng Phối đồ AI dựa trên tủ đồ cá nhân là gì?**
   Đây là trợ lý thời trang ảo sử dụng trí tuệ nhân tạo để phân tích các món đồ bạn đã tải lên (áo, quần, váy, giày, phụ kiện...) và tự động kết hợp chúng thành những outfit hoàn chỉnh, phù hợp với yêu cầu (dịp mặc, phong cách,...) của bạn.
2. **Tôi cần tải ảnh trang phục như thế nào để AI nhận diện tốt nhất?**
   Để AI phân tích chính xác nhất, bạn nên:
   - Chụp riêng từng món đồ trên nền trơn (như sàn nhà, ga giường trắng) hoặc treo trên móc.
   - Chụp trong điều kiện đủ ánh sáng tự nhiên.
   - Tránh chụp chung nhiều món đồ trong một bức ảnh hoặc chụp người đang mặc đồ nếu có quá nhiều chi tiết rối mắt.
3. **Có giới hạn số lượng món đồ tôi được phép tải lên không?**
   Không, bạn có thể tải lên số lượng đồ tùy ý.
4. **AI dựa vào những yếu tố nào để gợi ý outfit, và tôi có thể tùy chỉnh theo dịp không?**
   Hệ thống sẽ lấy toàn bộ trang phục sẵn có trong tủ đồ ảo của bạn làm dữ liệu gốc, kết hợp với các tiêu chí tùy chỉnh do bạn chọn:
   - **Bối cảnh & Phong cách**: Lọc theo dịp mặc cụ thể (đi làm, dạo phố, dự tiệc, thể thao...) và phong cách bạn mong muốn.
   - **Bảng màu cá nhân**: Tự động ưu tiên các món đồ chuẩn màu sắc cá nhân nếu bạn đã hoàn thành bài đánh giá trước đó.
   - **Gợi ý món đồ bổ sung**: Nếu outfit sẵn có cần thêm điểm nhấn, AI có thể gợi ý thêm 1 món đồ ngoài (kèm link mua sản phẩm tham khảo) để hoàn thiện set đồ chỉn chu hơn.
5. **Tính năng này có liên kết với kết quả đánh giá màu sắc cá nhân không?**
   Có. Nếu bạn đã thực hiện bài đánh giá màu sắc cá nhân trên trang website và chọn ô "Phối đồ theo kết quả đánh giá màu sắc cá nhân", AI sẽ ưu tiên chọn các món đồ có màu sắc chuẩn với bảng màu cá nhân để phối thành outfit hoàn chỉnh.
6. **Hình ảnh tủ đồ cá nhân của tôi có được bảo mật không?**
   Tuyệt đối bảo mật. Toàn bộ hình ảnh và dữ liệu tủ đồ chỉ phục vụ cho tài khoản cá nhân của bạn. Chúng tôi cam kết không công khai hay sử dụng hình ảnh của bạn cho bất kỳ mục đích nào khác mà không có sự đồng ý.
7. **Tôi có thể chỉnh sửa thông tin nếu AI phân loại sai món đồ không?**
   Có. Sau khi tải ảnh lên, AI sẽ tự động phân loại loại trang phục. Bạn hoàn toàn có thể chỉnh sửa lại các thông tin này thủ công bất cứ lúc nào để dữ liệu chính xác nhất.
8. **Nếu không thích outfit được gợi ý, tôi phải làm gì?**
   Bạn chỉ cần nhấn nút "Đổi gợi ý khác". AI sẽ ngay lập tức tạo ra kết hợp mới. Dựa vào các lịch sử hoạt động của bạn, AI sẽ hiểu rõ hơn gu thẩm mỹ của bạn để đưa ra gợi ý chuẩn xác hơn trong tương lai.
9. **Mất bao lâu để AI tạo xong các gợi ý phối đồ?**
   Tốc độ xử lý siêu nhanh. Hệ thống chỉ mất từ 3 đến 5 giây để quét toàn bộ tủ đồ của bạn và đưa ra hàng loạt công thức phối đồ sẵn sàng.

### Chính sách (category: `policy`, new)

1. **Thông tin trong hồ sơ cá nhân của tôi có hiển thị với người dùng khác không?**
   Không. Mọi thông tin cơ bản trong hồ sơ cá nhân (email, số đo cơ thể, chiều cao, cân nặng và các dữ liệu tài khoản cá nhân khác) hoàn toàn bảo mật và không hiển thị công khai cho bất kỳ ai.
2. **Ai có thể xem bài viết và hình ảnh Cộng đồng của tôi?**
   Bất kỳ người dùng nào trên nền tảng TwistFit đều có thể xem các nội dung bạn công khai đăng tải lên bảng tin hoặc bình luận.
3. **TwistFit thu thập hình ảnh của tôi nhằm mục đích gì?**
   Hình ảnh từ camera AR được áp dụng trong bài đánh giá màu sắc cá nhân chỉ được xử lý theo thời gian thực nhằm phục vụ trải nghiệm ướm thử dải màu và lưu lại 01 ảnh kết quả vào Hồ sơ cá nhân khi bạn xác nhận. Đối với hình ảnh đăng tải trên Diễn đàn, hệ thống lưu trữ để hiển thị bài đăng/bình luận theo ý muốn của bạn.
4. **Hình ảnh từ camera AR khi đánh giá màu sắc cá nhân có bị lưu trữ lâu dài không?**
   Không. Trải nghiệm thử màu qua công nghệ thực tế ảo được xử lý trực tiếp theo thời gian thực ngay trên thiết bị của bạn:
   - **Không lưu luồng camera**: Hệ thống không ghi hình, không lưu trữ video trực tiếp và cam kết không sử dụng công nghệ nhận diện khuôn mặt để định danh hay theo dõi người dùng.
   - **Chỉ lưu kết quả khi bạn xác nhận**: Nền tảng chỉ lưu trữ duy nhất 01 hình ảnh kết quả đã ướm bảng màu cùng báo cáo phân tích vào Hồ sơ cá nhân tại thời điểm bạn hoàn tất bài đánh giá và chọn lưu.
   - **Quyền riêng tư tuyệt đối**: Hình ảnh kết quả được cài đặt ở chế độ riêng tư, chỉ hiển thị với chính bạn và sẽ bị xóa hoàn toàn khỏi hệ thống khi bạn chủ động gỡ bỏ hoặc xóa tài khoản.
5. **TwistFit có sử dụng ảnh của tôi để nhận diện danh tính hay theo dõi không?**
   Tuyệt đối không. Hệ thống chỉ bóc tách màu sắc và cam kết không sử dụng công nghệ để nhận diện danh tính, theo dõi hay đối chiếu khuôn mặt người dùng.
6. **Tôi có thể chỉnh sửa/xóa bài đăng không, và bài đã xóa có khôi phục lại được không?** *(corrected to match the real forum's immediate hard-delete behavior, per brainstorming decision)*
   Có. Bạn có toàn quyền chỉnh sửa hoặc xóa bài viết bất cứ lúc nào. Lưu ý: sau khi xóa, bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống ngay lập tức và không thể khôi phục lại được.
7. **Tôi có thể xem bài viết đã lưu từ Diễn đàn ở đâu?** *(corrected to match the real `/forum/saved` page, per brainstorming decision)*
   Truy cập trang Diễn đàn và chọn mục "Đã lưu" trên thanh điều hướng để xem lại toàn bộ các bài viết bạn đã lưu từ cộng đồng.
8. **Tôi có sở hữu các nội dung/ảnh mình đăng lên TwistFit không?**
   Có. Bạn giữ toàn bộ quyền sở hữu trí tuệ đối với nội dung do mình tạo ra. TwistFit chỉ nhận quyền hiển thị nội dung đó trên hệ thống.
9. **Những hành vi/nội dung nào bị cấm đăng tải trên TwistFit?**
   Bạn không được phép:
   - Đăng ảnh khuôn mặt hoặc thông tin cá nhân của người khác khi chưa được cho phép.
   - Chia sẻ nội dung phản cảm, bạo lực, phân biệt đối xử hoặc vi phạm pháp luật.
   - Phát tán đường link chứa mã độc, trang web lừa đảo hoặc rác/spam.

## Decisions (confirmed during brainstorming)

| Decision | Choice |
|---|---|
| Category taxonomy | Replace `personal-color / fitting-room / account / stylist` with `account / personal-color / fitting-room / policy`, in that order. `stylist` is dropped entirely (no content for it in the new set); `policy` is new. |
| Related-questions source | Auto-derived from shared category membership — no schema change, no manual curation needed for the 33 new items. |
| Truncated "mất phí" answer | Trimmed to the last complete thought rather than left dangling or guessed at. |
| "Khôi phục bài viết trong 30 ngày" | Corrected to match the real forum's immediate, permanent delete (no soft-delete/restore exists). |
| "Xem bài đã lưu ở Hồ sơ cá nhân" | Corrected to the real location: the "Đã lưu" nav link on `/forum`, landing on `/forum/saved`. |

## Data model

No backend schema change. `FaqItem.categories: list[str]` already supports the new taxonomy — only the *set of valid values* changes (`FAQ_CATEGORIES` in `backend/app/domains/faq/schemas.py`). "Related questions" are computed at render time on the frontend from the already-fetched full item list — no new field, no new endpoint.

## Backend changes

- `backend/app/domains/faq/schemas.py`: `FAQ_CATEGORIES = ["account", "personal-color", "fitting-room", "policy"]` (order matches the taxonomy decision; validation in `FaqItemInput.categories_valid_and_non_empty` automatically enforces the new set since it already filters against this constant).
- `backend/app/domains/faq/seed.py`: replace `DEMO_FAQ_ITEMS` entirely with the 33 items above, one dict per item (`categories: ["account"]` etc., `answer_markdown` using `\n\n` between paragraphs and `- ` bullets / `**bold**` exactly as shown above for the multi-paragraph answers). No `highlight_icon`/`highlight_text` on any new item (the old demo data used them for decorative callouts; the real content doesn't call for that pattern — every item gets `None`/`None`).
- Since `seed_demo_faq_items` only runs `if db.query(FaqItem).count() > 0: return`, the existing 6 demo rows in the local dev database must be cleared once (a one-off `DELETE FROM faq_items` via a small script, not a migration — no schema changed) before the reseed can insert the real 33.

## Frontend changes

- `frontend/lib/faq.ts`: `FaqCategory` union and `FAQ_CATEGORIES` array updated to `'account' | 'personal-color' | 'fitting-room' | 'policy'`, same order as the backend list.
- `frontend/components/faq/faqCategoryVisuals.ts`: `FAQ_CATEGORY_VISUALS` updated — drop the `stylist` entry, reorder to `account, personal-color, fitting-room`, add a new `policy` entry (`key: 'policy'`, icon `gavel`, a tint following the same `bg-*-fixed text-*` pattern already used by the other three, e.g. `bg-tertiary-container text-on-tertiary-container` to stay visually distinct from the existing three tints).
- `frontend/components/admin/FaqForm.tsx`: `FaqCategoryTranslationKey` union and `CATEGORY_LABEL_KEYS` map updated to replace `stylist: 'stylist'` with `policy: 'policy'` (keys reordered to match).
- `frontend/messages/vi.json`:
  - `Faq.CategoryTabs.categories`: remove `stylist`, add `"policy": "Chính sách"`, reorder keys to `all, account, personalColor, fittingRoom, policy`.
  - `Faq.SearchBar.tags`: the existing 4 tags (`#ÁnhSáng`, `#BảoMật`, `#ThửĐồẢo`, `#XuấtPDF`) partly reference removed/fabricated concepts (no FAQ item mentions PDF export). Replace with tags that actually match terms appearing in the new content: `#OTP`, `#BảoMật`, `#PhốiĐồAI`, `#XóaTàiKhoản` (each is a substring of real question text, so clicking one via the existing search-by-question-text filter reliably surfaces a matching result).
  - `Home.FaqPreview`: no key changes needed — it already renders whatever `FAQ_CATEGORY_VISUALS` contains, so it automatically shows the new 4-category grid once that file changes.
- New `frontend/components/faq/FaqRelatedQuestions.tsx`: presentational component, props `{ items: { id: number; question: string }[]; onSelect: (id: number) => void }`. Renders nothing if `items` is empty; otherwise a small heading ("Câu hỏi liên quan") and a vertical list of `<button>`s (not `<a>`, since this navigates within client state, not to a new URL), each calling `onSelect(item.id)`.
- `frontend/components/faq/FaqAccordionItem.tsx`: gains an `id` attribute on the toggle `<button>` (`id={`faq-question-${item.id}`}`) so it can be scrolled to and focused; when open, renders `<FaqRelatedQuestions>` below the existing answer content, passing the related items and a `onSelectRelated` callback through from `FaqSection`.
- `frontend/components/faq/FaqSection.tsx`: for each rendered item, computes its related items as `items.filter(other => other.id !== item.id && other.categories.some(c => item.categories.includes(c))).slice(0, 3)` (first 3 by existing id-ascending order — no new sorting). Adds a `handleSelectRelated(id: number)` function that: clears `searchQuery` to `''`, sets `activeCategory` to `'all'` (guarantees the target is visible regardless of category/search state), sets `openItemId` to the target id, and — after the state update re-renders — scrolls the target's button into view (`document.getElementById('faq-question-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })`) and moves keyboard focus to it (`.focus()`), matching the `ui-ux-pro-max`-confirmed pattern of not leaving focus behind after an in-page navigation.

## Responsive behavior

No layout changes to the existing sidebar/accordion structure (already handles mobile via horizontal-scrolling category chips, unchanged). The new related-questions list is a simple vertical `<button>` stack with no grid, so it needs no breakpoint-specific handling — it reads identically at every width.

## Testing

Backend (pytest, real Postgres test DB):
- `backend/tests/domains/faq/` (existing test files, names TBD from actual repo — the plan enumerates them precisely): update any test asserting the old `FAQ_CATEGORIES` list or referencing `stylist` to use the new list; add/keep a seed test confirming `seed_demo_faq_items` inserts all 33 items with the right categories once the table is empty.

Frontend (vitest + testing-library):
- `FaqRelatedQuestions.test.tsx` (new): renders nothing when `items` is empty; renders a button per item and calls `onSelect` with the right id on click.
- `FaqAccordionItem.test.tsx` (existing, extended): when open, renders the related-questions block if related items are passed; the toggle button carries the expected `id`.
- `FaqSection.test.tsx` (existing, extended): clicking a related question clears the search box, resets the category filter to "Tất cả", and opens the target item (asserted via `aria-expanded` or visible answer text) — the scroll/focus side effects aren't asserted in jsdom (no real layout), only the resulting state (which item is open, category, search value).
- `FaqForm.test.tsx` / `FaqList.test.tsx` (existing, admin) and `FaqCategoryPreview.test.tsx` (home): update any fixture/assertion referencing `stylist` to the new category set.

Run `npx tsc --noEmit` and the full `npx vitest run` / backend `pytest` as a final check.

## Out of scope

- Manually curated related-questions (deferred; auto-derivation is the v1 approach).
- Any change to `FaqSupportBanner`, `FaqSearchBar`'s core search logic (still plain substring match on question text), or the sidebar's visual layout.
- Re-checking every other FAQ answer against real behavior beyond the 3 discrepancies already found and fixed above — if more are discovered during implementation, they'll be flagged the same way (never silently fabricated or silently left wrong).
