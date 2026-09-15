# FAQ: Real Content, New Category Taxonomy, and Related Questions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the FAQ page's 6 demo Q&A items with the 33 real ones the user provided across a new 4-category taxonomy (account → personal-color → fitting-room → policy), and add an auto-derived "related questions" section under each expanded answer.

**Architecture:** Backend change is data-only (no schema/migration) — `FAQ_CATEGORIES` gets a new value set, and the seed data is fully replaced. Frontend propagates the new category set through every place that currently hardcodes the old one (`lib/faq.ts`, `faqCategoryVisuals.ts`, admin `FaqForm.tsx`, `vi.json`), then adds a new presentational `FaqRelatedQuestions` component wired in via `FaqAccordionItem` and `FaqSection` (which computes "related" as other items sharing a category, entirely client-side).

**Tech Stack:** FastAPI + SQLAlchemy (backend, data-only change), Next.js + TypeScript + Tailwind CSS + next-intl (frontend), pytest / Vitest + Testing Library.

**Spec:** `frontend/docs/superpowers/specs/2026-09-16-faq-real-content-and-related-questions-design.md`

## Global Constraints

- No database migration — `FaqItem.categories` already stores a plain string array; only the validated value set (`FAQ_CATEGORIES`) changes.
- No new backend endpoint or field for "related questions" — computed client-side from the already-fetched full item list.
- `FaqRelatedQuestions` is purely presentational (no `useTranslations` call of its own) so `FaqAccordionItem.test.tsx` can keep using plain `render` throughout, matching this codebase's existing convention that components with no direct translation hook are tested without `renderWithIntl`.
- All FAQ content is copied verbatim from the spec, including the 3 corrections already applied there (trimmed "mất phí" answer, corrected forum-delete answer, corrected saved-posts location answer).

---

## Task 1: Backend — new category taxonomy and real seed content

**Files:**
- Modify: `backend/app/domains/faq/schemas.py`
- Modify: `backend/app/domains/faq/seed.py`
- Modify: `backend/tests/domains/faq/test_seed.py`

**Interfaces:**
- Consumes: nothing new.
- Produces: `FAQ_CATEGORIES = ["account", "personal-color", "fitting-room", "policy"]` — Task 2's frontend files mirror this exact list and order.

- [ ] **Step 1: Write the failing test**

Replace `backend/tests/domains/faq/test_seed.py`:

```python
from app.domains.faq.models import FaqItem
from app.domains.faq.seed import seed_demo_faq_items


def test_seed_demo_faq_items_creates_thirty_three_items(db_session):
    seed_demo_faq_items(db_session)
    assert db_session.query(FaqItem).count() == 33


def test_seed_demo_faq_items_is_idempotent(db_session):
    seed_demo_faq_items(db_session)
    seed_demo_faq_items(db_session)
    assert db_session.query(FaqItem).count() == 33


def test_seed_demo_faq_items_covers_all_four_categories(db_session):
    seed_demo_faq_items(db_session)
    items = db_session.query(FaqItem).all()
    all_categories = {category for item in items for category in item.categories}
    assert all_categories == {"account", "personal-color", "fitting-room", "policy"}
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/faq/test_seed.py -v
```

Expected: FAIL — the current seed only creates 6 items and doesn't cover `policy`.

- [ ] **Step 3: Update `FAQ_CATEGORIES`**

In `backend/app/domains/faq/schemas.py`, change:

```python
FAQ_CATEGORIES = ["account", "personal-color", "fitting-room", "policy"]
```

- [ ] **Step 4: Replace the seed data**

Replace the full contents of `backend/app/domains/faq/seed.py`:

```python
from sqlalchemy.orm import Session

from app.domains.faq.models import FaqItem

DEMO_FAQ_ITEMS = [
    {
        "categories": ["account"],
        "question": "Tôi không nhận được mã xác thực (OTP) hoặc email kích hoạt thì phải làm sao?",
        "answer_markdown": (
            "Hãy kiểm tra kỹ hòm thư rác/spam. Nếu vẫn chưa nhận được sau 1–2 phút, bạn bấm nút "
            '"Gửi lại mã" hoặc kiểm tra lại độ chính xác của địa chỉ email/số điện thoại đã nhập.'
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["account"],
        "question": "Tôi quên mật khẩu thì lấy lại bằng cách nào?",
        "answer_markdown": (
            'Chọn "Quên mật khẩu" tại màn hình đăng nhập, điền email đăng ký tài khoản và làm theo '
            "hướng dẫn trong link vừa được gửi tới hộp thư của bạn."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["account"],
        "question": "Kết quả đánh giá màu sắc cá nhân và dữ liệu tủ đồ ảo có bị mất khi tôi đăng xuất không?",
        "answer_markdown": (
            "Không. Mọi dữ liệu về tủ đồ, kết quả trắc nghiệm và lịch sử phối đồ đều được tự động lưu "
            "trữ an toàn trên hệ thống máy chủ gắn liền với tài khoản của bạn."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["account"],
        "question": (
            "Điều gì sẽ xảy ra với hình ảnh trang phục và kết quả đánh giá màu sắc cá nhân khi tôi "
            "xóa tài khoản?"
        ),
        "answer_markdown": (
            "Toàn bộ ảnh tủ đồ, lịch sử phối đồ, bài viết trên diễn đàn và kết quả đánh giá màu sắc "
            "cá nhân của bạn sẽ bị xóa vĩnh viễn khỏi hệ thống máy chủ và không thể khôi phục lại."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["account"],
        "question": "Tôi có thể dùng website trên điện thoại (giao diện di động) mượt mà không?",
        "answer_markdown": (
            "Hoàn toàn được. Trang web được tối ưu hóa hiển thị trên mọi trình duyệt điện thoại "
            "(iOS và Android), giúp bạn chụp ảnh tải đồ lên và kiểm tra màu sắc cá nhân mọi lúc mọi nơi."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["account"],
        "question": "Tôi có thể đăng nhập cùng một tài khoản trên nhiều thiết bị (điện thoại, máy tính) không?",
        "answer_markdown": (
            "Có. Dữ liệu tủ đồ và kết quả đánh giá của bạn sẽ tự động đồng bộ hóa trên mọi thiết bị "
            "khi bạn đăng nhập cùng một tài khoản."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["account"],
        "question": (
            "Tôi có thể cập nhật lại các chỉ số cơ thể (chiều cao, cân nặng, dáng người) trong tài "
            "khoản không?"
        ),
        "answer_markdown": (
            "Có. Bạn vào mục Hồ sơ cá nhân > chọn Thông tin cá nhân, cập nhật lại số đo mới và bấm "
            "Lưu thay đổi."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["personal-color"],
        "question": "Màu sắc cá nhân là gì?",
        "answer_markdown": (
            "Màu sắc cá nhân (Personal Color) là phương pháp phân tích màu sắc dựa trên sắc độ da, "
            "màu tóc, màu mắt và độ tương phản tự nhiên của gương mặt để tìm ra những gam màu phù hợp "
            "nhất với mỗi người. Thay vì lựa chọn màu sắc chỉ theo xu hướng, màu sắc cá nhân giúp xác "
            "định bảng màu riêng có khả năng làm nổi bật diện mạo, từ trang phục, phụ kiện đến phong "
            "cách trang điểm."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["personal-color"],
        "question": "Màu sắc cá nhân có thay đổi theo thời gian không?",
        "answer_markdown": (
            "Undertone da thường không thay đổi, vì vậy nhóm màu sắc cá nhân cơ bản của mỗi người "
            "thường giữ nguyên. Tuy nhiên, cảm nhận về màu sắc phù hợp có thể thay đổi do màu tóc, "
            "phong cách trang điểm, độ rám nắng hoặc sự thay đổi trong cách xây dựng hình ảnh cá nhân."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["personal-color"],
        "question": "Biết màu sắc cá nhân mang lại lợi ích gì cho phong cách và diện mạo của tôi?",
        "answer_markdown": (
            "Thấu hiểu màu sắc cá nhân là chìa khóa giúp bạn dễ dàng chọn lựa trang phục tôn lên diện "
            "mạo, đồng thời tránh lãng phí vào những xu hướng không phù hợp. Đây không chỉ là nền "
            "tảng giúp bạn chọn trang phục tôn da và xây dựng tủ đồ bền vững, mà còn hỗ trợ chọn màu "
            "tóc, màu son trang điểm và phụ kiện hài hòa nhất với gương mặt."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["personal-color"],
        "question": "Bài đánh giá màu sắc cá nhân trên website hoạt động như thế nào?",
        "answer_markdown": (
            "Bài đánh giá được thiết kế liền mạch theo quy trình 3 bước:\n\n"
            "**Bước 1: Phân tích đặc điểm tự nhiên**\n"
            "Hệ thống sử dụng thuật toán thông minh để phân tích các yếu tố sắc tố da, mạch máu cổ "
            "tay, màu mắt và tóc thông qua bộ câu hỏi trắc nghiệm, từ đó xác định nhóm mùa chuyên sâu "
            "(Xuân - Hạ - Thu - Đông) của bạn.\n\n"
            "**Bước 2: Ướm thử trực quan với AR Draping**\n"
            "Ngay sau khi có kết quả, công nghệ thực tế ảo sẽ kích hoạt camera để bạn ướm trực tiếp "
            "các dải màu thuộc nhóm mùa đó lên gương mặt theo thời gian thực, giúp bạn tự kiểm chứng "
            "độ sáng và độ hòa hợp của làn da.\n\n"
            "**Bước 3: Đề xuất gợi ý ứng dụng**\n"
            "Dựa trên nhóm màu đã xác định, hệ thống cung cấp các gợi ý ứng dụng đa dạng giúp bạn dễ "
            "dàng khai thác tối đa bảng màu cá nhân vào trang phục, làm đẹp và định hình phong cách "
            "hàng ngày."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["personal-color"],
        "question": "Bài đánh giá màu sắc cá nhân có độ chính xác cao không?",
        "answer_markdown": (
            "Bài đánh giá cung cấp định hướng chính xác từ 70% - 80% dựa trên sự quan sát thực tế "
            "của bạn. Đây là công cụ hỗ trợ miễn phí để bạn bắt đầu định hình phong cách cá nhân "
            "trước khi quyết định tư vấn trực tiếp với chuyên gia."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["personal-color"],
        "question": "Làm sao để tôi phân biệt Undertone (sắc tố da) và Skintone (màu da)?",
        "answer_markdown": (
            "**Skintone**: Là màu da bề mặt mà bạn nhìn thấy bằng mắt thường (trắng, ngăm, trung "
            "tính...), có thể thay đổi theo thời gian, mùa trong năm hoặc chịu ảnh hưởng từ yếu tố "
            "môi trường và thói quen chăm sóc da.\n\n"
            "**Undertone**: Là sắc tố ẩn dưới bề mặt da, khác với skintone - màu da bạn nhìn thấy "
            "bằng mắt thường. Trong khi skintone có thể thay đổi theo thời tiết, ánh nắng hay chế độ "
            "chăm sóc da, Undertone lại ổn định và không thay đổi theo thời gian. Bài quiz sẽ tập "
            "trung xác định Undertone của bạn."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["personal-color"],
        "question": "Tôi có cần phải bỏ hết quần áo cũ không hợp với màu sắc cá nhân không?",
        "answer_markdown": (
            "Hoàn toàn không cần thiết. Bạn vẫn có thể mặc những màu mình yêu thích bằng các mẹo "
            "nhỏ:\n\n"
            "- Kết hợp màu không hợp ở phần thân dưới (quần, chân váy) xa khuôn mặt.\n"
            "- Sử dụng phụ kiện, khăn quàng hoặc tone trang điểm chuẩn Màu sắc cá nhân để cân bằng "
            "lại tổng thể."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["personal-color"],
        "question": "Bài đánh giá màu sắc cá nhân có mất phí không và tôi có thể thực hiện lại không?",
        "answer_markdown": (
            "Bài đánh giá màu sắc cá nhân trên website của chúng tôi hoàn toàn MIỄN PHÍ và KHÔNG "
            "GIỚI HẠN LƯỢT LÀM. Bạn có thể thực hiện bất cứ lúc nào và lưu lại kết quả."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["fitting-room"],
        "question": "Tính năng Phối đồ AI dựa trên tủ đồ cá nhân là gì?",
        "answer_markdown": (
            "Đây là trợ lý thời trang ảo sử dụng trí tuệ nhân tạo để phân tích các món đồ bạn đã tải "
            "lên (áo, quần, váy, giày, phụ kiện...) và tự động kết hợp chúng thành những outfit hoàn "
            "chỉnh, phù hợp với yêu cầu (dịp mặc, phong cách,...) của bạn."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["fitting-room"],
        "question": "Tôi cần tải ảnh trang phục như thế nào để AI nhận diện tốt nhất?",
        "answer_markdown": (
            "Để AI phân tích chính xác nhất, bạn nên:\n\n"
            "- Chụp riêng từng món đồ trên nền trơn (như sàn nhà, ga giường trắng) hoặc treo trên "
            "móc.\n"
            "- Chụp trong điều kiện đủ ánh sáng tự nhiên.\n"
            "- Tránh chụp chung nhiều món đồ trong một bức ảnh hoặc chụp người đang mặc đồ nếu có "
            "quá nhiều chi tiết rối mắt."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["fitting-room"],
        "question": "Có giới hạn số lượng món đồ tôi được phép tải lên không?",
        "answer_markdown": "Không, bạn có thể tải lên số lượng đồ tùy ý.",
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["fitting-room"],
        "question": "AI dựa vào những yếu tố nào để gợi ý outfit, và tôi có thể tùy chỉnh theo dịp không?",
        "answer_markdown": (
            "Hệ thống sẽ lấy toàn bộ trang phục sẵn có trong tủ đồ ảo của bạn làm dữ liệu gốc, kết "
            "hợp với các tiêu chí tùy chỉnh do bạn chọn:\n\n"
            "- **Bối cảnh & Phong cách**: Lọc theo dịp mặc cụ thể (đi làm, dạo phố, dự tiệc, thể "
            "thao...) và phong cách bạn mong muốn.\n"
            "- **Bảng màu cá nhân**: Tự động ưu tiên các món đồ chuẩn màu sắc cá nhân nếu bạn đã "
            "hoàn thành bài đánh giá trước đó.\n"
            "- **Gợi ý món đồ bổ sung**: Nếu outfit sẵn có cần thêm điểm nhấn, AI có thể gợi ý thêm "
            "1 món đồ ngoài (kèm link mua sản phẩm tham khảo) để hoàn thiện set đồ chỉn chu hơn."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["fitting-room"],
        "question": "Tính năng này có liên kết với kết quả đánh giá màu sắc cá nhân không?",
        "answer_markdown": (
            "Có. Nếu bạn đã thực hiện bài đánh giá màu sắc cá nhân trên trang website và chọn ô "
            '"Phối đồ theo kết quả đánh giá màu sắc cá nhân", AI sẽ ưu tiên chọn các món đồ có màu '
            "sắc chuẩn với bảng màu cá nhân để phối thành outfit hoàn chỉnh."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["fitting-room"],
        "question": "Hình ảnh tủ đồ cá nhân của tôi có được bảo mật không?",
        "answer_markdown": (
            "Tuyệt đối bảo mật. Toàn bộ hình ảnh và dữ liệu tủ đồ chỉ phục vụ cho tài khoản cá nhân "
            "của bạn. Chúng tôi cam kết không công khai hay sử dụng hình ảnh của bạn cho bất kỳ mục "
            "đích nào khác mà không có sự đồng ý."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["fitting-room"],
        "question": "Tôi có thể chỉnh sửa thông tin nếu AI phân loại sai món đồ không?",
        "answer_markdown": (
            "Có. Sau khi tải ảnh lên, AI sẽ tự động phân loại loại trang phục. Bạn hoàn toàn có thể "
            "chỉnh sửa lại các thông tin này thủ công bất cứ lúc nào để dữ liệu chính xác nhất."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["fitting-room"],
        "question": "Nếu không thích outfit được gợi ý, tôi phải làm gì?",
        "answer_markdown": (
            'Bạn chỉ cần nhấn nút "Đổi gợi ý khác". AI sẽ ngay lập tức tạo ra kết hợp mới. Dựa vào '
            "các lịch sử hoạt động của bạn, AI sẽ hiểu rõ hơn gu thẩm mỹ của bạn để đưa ra gợi ý "
            "chuẩn xác hơn trong tương lai."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["fitting-room"],
        "question": "Mất bao lâu để AI tạo xong các gợi ý phối đồ?",
        "answer_markdown": (
            "Tốc độ xử lý siêu nhanh. Hệ thống chỉ mất từ 3 đến 5 giây để quét toàn bộ tủ đồ của bạn "
            "và đưa ra hàng loạt công thức phối đồ sẵn sàng."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["policy"],
        "question": "Thông tin trong hồ sơ cá nhân của tôi có hiển thị với người dùng khác không?",
        "answer_markdown": (
            "Không. Mọi thông tin cơ bản trong hồ sơ cá nhân (email, số đo cơ thể, chiều cao, cân "
            "nặng và các dữ liệu tài khoản cá nhân khác) hoàn toàn bảo mật và không hiển thị công "
            "khai cho bất kỳ ai."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["policy"],
        "question": "Ai có thể xem bài viết và hình ảnh Cộng đồng của tôi?",
        "answer_markdown": (
            "Bất kỳ người dùng nào trên nền tảng TwistFit đều có thể xem các nội dung bạn công khai "
            "đăng tải lên bảng tin hoặc bình luận."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["policy"],
        "question": "TwistFit thu thập hình ảnh của tôi nhằm mục đích gì?",
        "answer_markdown": (
            "Hình ảnh từ camera AR được áp dụng trong bài đánh giá màu sắc cá nhân chỉ được xử lý "
            "theo thời gian thực nhằm phục vụ trải nghiệm ướm thử dải màu và lưu lại 01 ảnh kết quả "
            "vào Hồ sơ cá nhân khi bạn xác nhận. Đối với hình ảnh đăng tải trên Diễn đàn, hệ thống "
            "lưu trữ để hiển thị bài đăng/bình luận theo ý muốn của bạn."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["policy"],
        "question": "Hình ảnh từ camera AR khi đánh giá màu sắc cá nhân có bị lưu trữ lâu dài không?",
        "answer_markdown": (
            "Không. Trải nghiệm thử màu qua công nghệ thực tế ảo được xử lý trực tiếp theo thời gian "
            "thực ngay trên thiết bị của bạn:\n\n"
            "- **Không lưu luồng camera**: Hệ thống không ghi hình, không lưu trữ video trực tiếp và "
            "cam kết không sử dụng công nghệ nhận diện khuôn mặt để định danh hay theo dõi người "
            "dùng.\n"
            "- **Chỉ lưu kết quả khi bạn xác nhận**: Nền tảng chỉ lưu trữ duy nhất 01 hình ảnh kết "
            "quả đã ướm bảng màu cùng báo cáo phân tích vào Hồ sơ cá nhân tại thời điểm bạn hoàn tất "
            "bài đánh giá và chọn lưu.\n"
            "- **Quyền riêng tư tuyệt đối**: Hình ảnh kết quả được cài đặt ở chế độ riêng tư, chỉ "
            "hiển thị với chính bạn và sẽ bị xóa hoàn toàn khỏi hệ thống khi bạn chủ động gỡ bỏ hoặc "
            "xóa tài khoản."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["policy"],
        "question": "TwistFit có sử dụng ảnh của tôi để nhận diện danh tính hay theo dõi không?",
        "answer_markdown": (
            "Tuyệt đối không. Hệ thống chỉ bóc tách màu sắc và cam kết không sử dụng công nghệ để "
            "nhận diện danh tính, theo dõi hay đối chiếu khuôn mặt người dùng."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["policy"],
        "question": "Tôi có thể chỉnh sửa/xóa bài đăng không, và bài đã xóa có khôi phục lại được không?",
        "answer_markdown": (
            "Có. Bạn có toàn quyền chỉnh sửa hoặc xóa bài viết bất cứ lúc nào. Lưu ý: sau khi xóa, "
            "bài viết sẽ bị xóa vĩnh viễn khỏi hệ thống ngay lập tức và không thể khôi phục lại được."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["policy"],
        "question": "Tôi có thể xem bài viết đã lưu từ Diễn đàn ở đâu?",
        "answer_markdown": (
            'Truy cập trang Diễn đàn và chọn mục "Đã lưu" trên thanh điều hướng để xem lại toàn bộ '
            "các bài viết bạn đã lưu từ cộng đồng."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["policy"],
        "question": "Tôi có sở hữu các nội dung/ảnh mình đăng lên TwistFit không?",
        "answer_markdown": (
            "Có. Bạn giữ toàn bộ quyền sở hữu trí tuệ đối với nội dung do mình tạo ra. TwistFit chỉ "
            "nhận quyền hiển thị nội dung đó trên hệ thống."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
    {
        "categories": ["policy"],
        "question": "Những hành vi/nội dung nào bị cấm đăng tải trên TwistFit?",
        "answer_markdown": (
            "Bạn không được phép:\n\n"
            "- Đăng ảnh khuôn mặt hoặc thông tin cá nhân của người khác khi chưa được cho phép.\n"
            "- Chia sẻ nội dung phản cảm, bạo lực, phân biệt đối xử hoặc vi phạm pháp luật.\n"
            "- Phát tán đường link chứa mã độc, trang web lừa đảo hoặc rác/spam."
        ),
        "highlight_icon": None,
        "highlight_text": None,
    },
]


def seed_demo_faq_items(db: Session) -> None:
    if db.query(FaqItem).count() > 0:
        return
    for item in DEMO_FAQ_ITEMS:
        db.add(FaqItem(**item))
    db.commit()
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd backend && source venv/bin/activate && python3 -m pytest tests/domains/faq/ -v
```

Expected: PASS (all tests in `test_seed.py`, `test_service.py`, `test_router.py`).

- [ ] **Step 6: Clear the local dev database's old demo rows**

`seed_demo_faq_items` only inserts when the table is empty, so the 6 old demo rows already in the local dev database must be cleared once before the app can reseed the real 33:

```bash
cd backend && source venv/bin/activate
python3 <<'EOF'
import app.main  # noqa
from app.db.session import SessionLocal
from sqlalchemy import text

db = SessionLocal()
db.execute(text("DELETE FROM faq_items"))
db.commit()
print("Cleared faq_items.")
db.close()
EOF
```

(No Alembic migration is needed — `categories` is a plain string array column with no DB-level enum constraint; only the Pydantic-level validation in `FaqItemInput` changed.)

- [ ] **Step 7: Commit**

```bash
git add backend/app/domains/faq/schemas.py backend/app/domains/faq/seed.py backend/tests/domains/faq/test_seed.py
git commit -m "feat: replace FAQ demo content with the real 33-question set and new category taxonomy"
```

---

## Task 2: Frontend — propagate the new category taxonomy

**Files:**
- Modify: `frontend/lib/faq.ts`
- Modify: `frontend/components/faq/faqCategoryVisuals.ts`
- Modify: `frontend/components/admin/FaqForm.tsx`
- Modify: `frontend/messages/vi.json`
- Modify: `frontend/components/faq/FaqCategorySidebar.test.tsx`
- Modify: `frontend/components/home/FaqCategoryPreview.test.tsx`

**Interfaces:**
- Consumes: the `["account", "personal-color", "fitting-room", "policy"]` order from Task 1 (kept identical on the frontend).
- Produces: `FaqCategory` type and `FAQ_CATEGORIES`/`FAQ_CATEGORY_VISUALS` reflecting the new taxonomy — every other frontend file in this plan (and the untouched `FaqSection.tsx`, which doesn't hardcode categories) reads from these.

- [ ] **Step 1: Write the failing tests**

Replace `frontend/components/faq/FaqCategorySidebar.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqCategorySidebar from './FaqCategorySidebar'

describe('FaqCategorySidebar', () => {
  it('renders the "all" tile plus every FAQ category', () => {
    renderWithIntl(<FaqCategorySidebar active="all" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Tất cả' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tài khoản & Dữ liệu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trắc nghiệm Personal Color' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phòng thử đồ ảo (Fitting Room)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chính sách' })).toBeInTheDocument()
  })

  it('marks the active category as pressed', () => {
    renderWithIntl(<FaqCategorySidebar active="fitting-room" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Phòng thử đồ ảo (Fitting Room)' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onChange with the clicked category id', () => {
    const onChange = vi.fn()
    renderWithIntl(<FaqCategorySidebar active="all" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Chính sách' }))
    expect(onChange).toHaveBeenCalledWith('policy')
  })
})
```

Replace `frontend/components/home/FaqCategoryPreview.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import FaqCategoryPreview from './FaqCategoryPreview'

describe('FaqCategoryPreview', () => {
  it('renders exactly the four FAQ category tiles, each linking to the FAQ page', () => {
    renderWithIntl(<FaqCategoryPreview />)

    expect(screen.getByRole('link', { name: /Tài khoản & Dữ liệu/ })).toHaveAttribute(
      'href',
      '/faq?category=account'
    )
    expect(screen.getByRole('link', { name: /Trắc nghiệm Personal Color/ })).toHaveAttribute(
      'href',
      '/faq?category=personal-color'
    )
    expect(screen.getByRole('link', { name: /Phòng thử đồ ảo \(Fitting Room\)/ })).toHaveAttribute(
      'href',
      '/faq?category=fitting-room'
    )
    expect(screen.getByRole('link', { name: /Chính sách/ })).toHaveAttribute('href', '/faq?category=policy')
  })

  it('renders a link to view all FAQ questions', () => {
    renderWithIntl(<FaqCategoryPreview />)
    expect(screen.getByRole('link', { name: 'Xem tất cả câu hỏi' })).toHaveAttribute('href', '/faq')
  })

  it('renders the section heading', () => {
    renderWithIntl(<FaqCategoryPreview />)
    expect(screen.getByRole('heading', { name: 'Câu Hỏi Thường Gặp' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/faq/FaqCategorySidebar.test.tsx components/home/FaqCategoryPreview.test.tsx
```

Expected: FAIL — "Chính sách" doesn't exist yet, "Tư vấn Stylist & Mua sắm" still does.

- [ ] **Step 3: Update `lib/faq.ts`**

```ts
export type FaqCategory = 'account' | 'personal-color' | 'fitting-room' | 'policy'
export const FAQ_CATEGORIES: FaqCategory[] = ['account', 'personal-color', 'fitting-room', 'policy']
```

(`FaqHighlightIcon`/`FAQ_HIGHLIGHT_ICONS`/`FaqItem`/`FaqItemInput` stay exactly as they are — unaffected.)

- [ ] **Step 4: Update `faqCategoryVisuals.ts`**

Replace the full contents of `frontend/components/faq/faqCategoryVisuals.ts`:

```ts
import type { FaqCategory } from '@/lib/faq'

// Shared between the homepage FAQ teaser (components/home/FaqCategoryPreview.tsx)
// and the FAQ page's category sidebar (components/faq/FaqCategorySidebar.tsx), so
// both surfaces show the same icon/color per category. `key` matches the existing
// Faq.CategoryTabs.categories.* translation keys.
export type FaqCategoryVisual = {
  id: FaqCategory
  key: 'account' | 'personalColor' | 'fittingRoom' | 'policy'
  icon: string
  tint: string
}

export const FAQ_CATEGORY_VISUALS: FaqCategoryVisual[] = [
  { id: 'account', key: 'account', icon: 'manage_accounts', tint: 'bg-tertiary-fixed text-tertiary' },
  { id: 'personal-color', key: 'personalColor', icon: 'palette', tint: 'bg-primary-fixed text-primary' },
  { id: 'fitting-room', key: 'fittingRoom', icon: 'checkroom', tint: 'bg-secondary-fixed text-secondary' },
  {
    id: 'policy',
    key: 'policy',
    icon: 'gavel',
    tint: 'bg-secondary-container text-on-secondary-container',
  },
]
```

- [ ] **Step 5: Update `Faq.CategoryTabs.categories` and `Faq.SearchBar.tags` in `messages/vi.json`**

Replace:

```json
    "CategoryTabs": {
      "categories": {
        "all": "Tất cả",
        "personalColor": "Trắc nghiệm Personal Color",
        "fittingRoom": "Phòng thử đồ ảo (Fitting Room)",
        "account": "Tài khoản & Dữ liệu",
        "stylist": "Tư vấn Stylist & Mua sắm"
      }
    },
    "SearchBar": {
      "placeholder": "Tìm kiếm thắc mắc (ví dụ: chụp ảnh như thế nào, độ chính xác...)",
      "searchButton": "Tìm kiếm",
      "suggestedLabel": "Gợi ý tìm kiếm:",
      "tags": {
        "light": "#ÁnhSáng",
        "security": "#BảoMật",
        "tryOn": "#ThửĐồẢo",
        "exportPdf": "#XuấtPDF"
      }
    },
```

with:

```json
    "CategoryTabs": {
      "categories": {
        "all": "Tất cả",
        "account": "Tài khoản & Dữ liệu",
        "personalColor": "Trắc nghiệm Personal Color",
        "fittingRoom": "Phòng thử đồ ảo (Fitting Room)",
        "policy": "Chính sách"
      }
    },
    "SearchBar": {
      "placeholder": "Tìm kiếm thắc mắc (ví dụ: chụp ảnh như thế nào, độ chính xác...)",
      "searchButton": "Tìm kiếm",
      "suggestedLabel": "Gợi ý tìm kiếm:",
      "tags": {
        "otp": "#OTP",
        "security": "#BảoMật",
        "outfitAi": "#PhốiĐồAI",
        "deleteAccount": "#XóaTàiKhoản"
      }
    },
```

Also update the `SUGGESTED_TAGS` list in `frontend/components/faq/FaqSearchBar.tsx` to match the new keys:

```tsx
const SUGGESTED_TAGS = [
  { key: 'otp', value: 'OTP' },
  { key: 'security', value: 'bảo mật' },
  { key: 'outfitAi', value: 'phối đồ' },
  { key: 'deleteAccount', value: 'xóa tài khoản' },
] as const
```

- [ ] **Step 6: Update `admin/FaqForm.tsx`**

```tsx
type FaqCategoryTranslationKey = 'account' | 'personalColor' | 'fittingRoom' | 'policy'

const CATEGORY_LABEL_KEYS: Record<FaqCategory, FaqCategoryTranslationKey> = {
  account: 'account',
  'personal-color': 'personalColor',
  'fitting-room': 'fittingRoom',
  policy: 'policy',
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/faq/ components/home/FaqCategoryPreview.test.tsx components/admin/FaqForm.test.tsx
```

Expected: PASS (all tests — `FaqForm.test.tsx` doesn't reference `stylist` so it's unaffected; `FaqSection.test.tsx`'s existing fixtures use `personal-color`/`fitting-room`, both still valid, so it's unaffected too).

- [ ] **Step 8: Commit**

```bash
git add frontend/lib/faq.ts frontend/components/faq/faqCategoryVisuals.ts frontend/components/faq/FaqSearchBar.tsx frontend/components/admin/FaqForm.tsx frontend/messages/vi.json frontend/components/faq/FaqCategorySidebar.test.tsx frontend/components/home/FaqCategoryPreview.test.tsx
git commit -m "feat: adopt the new FAQ category taxonomy across the frontend"
```

---

## Task 3: `FaqRelatedQuestions` — shared related-questions list

**Files:**
- Create: `frontend/components/faq/FaqRelatedQuestions.tsx`
- Create: `frontend/components/faq/FaqRelatedQuestions.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `export default function FaqRelatedQuestions({ heading, items, onSelect }: FaqRelatedQuestionsProps)` where
  ```ts
  type FaqRelatedQuestionsProps = {
    heading: string
    items: { id: number; question: string }[]
    onSelect: (id: number) => void
  }
  ```
  Task 4 (`FaqAccordionItem`) renders this.

- [ ] **Step 1: Write the failing tests**

Create `frontend/components/faq/FaqRelatedQuestions.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FaqRelatedQuestions from './FaqRelatedQuestions'

describe('FaqRelatedQuestions', () => {
  it('renders nothing when there are no related items', () => {
    const { container } = render(
      <FaqRelatedQuestions heading="Câu hỏi liên quan" items={[]} onSelect={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a button per related item and calls onSelect with its id', () => {
    const onSelect = vi.fn()
    render(
      <FaqRelatedQuestions
        heading="Câu hỏi liên quan"
        items={[
          { id: 2, question: 'Câu hỏi liên quan A?' },
          { id: 3, question: 'Câu hỏi liên quan B?' },
        ]}
        onSelect={onSelect}
      />
    )
    expect(screen.getByText('Câu hỏi liên quan')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Câu hỏi liên quan A?' }))
    expect(onSelect).toHaveBeenCalledWith(2)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/faq/FaqRelatedQuestions.test.tsx
```

Expected: FAIL — `FaqRelatedQuestions.tsx` doesn't exist.

- [ ] **Step 3: Implement the component**

Create `frontend/components/faq/FaqRelatedQuestions.tsx`:

```tsx
type FaqRelatedQuestionsProps = {
  heading: string
  items: { id: number; question: string }[]
  onSelect: (id: number) => void
}

export default function FaqRelatedQuestions({ heading, items, onSelect }: FaqRelatedQuestionsProps) {
  if (items.length === 0) return null

  return (
    <div className="mt-space-md border-t border-outline-variant pt-space-md">
      <h5 className="text-label-md font-semibold text-on-surface">{heading}</h5>
      <ul className="mt-space-xs space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="text-left text-body-sm text-primary hover:underline"
            >
              {item.question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/faq/FaqRelatedQuestions.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/components/faq/FaqRelatedQuestions.tsx frontend/components/faq/FaqRelatedQuestions.test.tsx
git commit -m "feat: add FaqRelatedQuestions component"
```

---

## Task 4: Wire related questions into `FaqAccordionItem` and `FaqSection`

**Files:**
- Modify: `frontend/components/faq/FaqAccordionItem.tsx`
- Modify: `frontend/components/faq/FaqAccordionItem.test.tsx`
- Modify: `frontend/components/faq/FaqSection.tsx`
- Modify: `frontend/components/faq/FaqSection.test.tsx`
- Modify: `frontend/messages/vi.json`

**Interfaces:**
- Consumes: `FaqRelatedQuestions` from Task 3.
- Produces: nothing new consumed by later tasks (leaf of this feature).

- [ ] **Step 1: Write the failing `FaqAccordionItem` test**

Add this test to `frontend/components/faq/FaqAccordionItem.test.tsx`, inside the existing `describe` block:

```tsx
  it('renders related questions when open and passed some, and forwards the selected id', () => {
    const onSelectRelated = vi.fn()
    render(
      <FaqAccordionItem
        item={ITEM}
        number="01"
        isOpen={true}
        onToggle={vi.fn()}
        relatedItems={[{ id: 2, question: 'Câu hỏi liên quan?' }]}
        relatedHeading="Câu hỏi liên quan"
        onSelectRelated={onSelectRelated}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Câu hỏi liên quan?' }))
    expect(onSelectRelated).toHaveBeenCalledWith(2)
  })

  it('carries an id on its toggle button matching the item id', () => {
    render(<FaqAccordionItem item={ITEM} number="01" isOpen={false} onToggle={vi.fn()} />)
    expect(document.getElementById('faq-question-1')).toBe(screen.getByRole('button'))
  })
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

```bash
cd frontend && npx vitest run components/faq/FaqAccordionItem.test.tsx
```

Expected: FAIL on the 2 new tests — `FaqAccordionItem` doesn't accept `relatedItems`/`relatedHeading`/`onSelectRelated` yet and has no `id` on its button. The 4 pre-existing tests still pass.

- [ ] **Step 3: Update `FaqAccordionItem.tsx`**

Replace the full contents of `frontend/components/faq/FaqAccordionItem.tsx`:

```tsx
import type { FaqItem } from '@/lib/faq'
import { renderMarkdown } from '@/lib/markdown'
import FaqRelatedQuestions from './FaqRelatedQuestions'

type FaqAccordionItemProps = {
  item: FaqItem
  number: string
  isOpen: boolean
  onToggle: (id: number) => void
  relatedItems?: { id: number; question: string }[]
  relatedHeading?: string
  onSelectRelated?: (id: number) => void
}

export default function FaqAccordionItem({
  item,
  number,
  isOpen,
  onToggle,
  relatedItems = [],
  relatedHeading = '',
  onSelectRelated = () => {},
}: FaqAccordionItemProps) {
  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-300">
      <button
        type="button"
        id={`faq-question-${item.id}`}
        aria-expanded={isOpen}
        onClick={() => onToggle(item.id)}
        className="group flex w-full items-center justify-between p-space-lg text-left"
      >
        <div className="flex items-start gap-space-md pr-space-md">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-container text-label-md font-bold text-primary">
            {number}
          </span>
          <span className="text-headline-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
            {item.question}
          </span>
        </div>
        <span
          className={`material-symbols-outlined shrink-0 text-[24px] text-outline transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          keyboard_arrow_down
        </span>
      </button>
      {isOpen && (
        <div className="px-space-lg pb-space-lg pt-0">
          <div className="flex flex-col gap-space-sm pl-12 text-body-md leading-relaxed text-on-surface-variant">
            <div
              className="prose max-w-none text-body-md text-on-surface-variant"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(item.answerMarkdown) }}
            />
            {item.highlightIcon && item.highlightText && (
              <div className="mt-space-xs flex items-center gap-space-xs rounded-lg bg-surface-container-low p-space-md text-label-md font-semibold text-primary">
                <span className="material-symbols-outlined text-[18px]">{item.highlightIcon}</span>
                <span>{item.highlightText}</span>
              </div>
            )}
            <FaqRelatedQuestions heading={relatedHeading} items={relatedItems} onSelect={onSelectRelated} />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the `FaqAccordionItem` tests to verify they pass**

```bash
cd frontend && npx vitest run components/faq/FaqAccordionItem.test.tsx
```

Expected: PASS (all 6 tests).

- [ ] **Step 5: Write the failing `FaqSection` tests**

Add these tests to `frontend/components/faq/FaqSection.test.tsx`, inside the existing `describe` block (extend the `ITEMS` fixture first — add a third item so at least one pair shares a category):

```tsx
const ITEMS_WITH_RELATED: FaqItem[] = [
  ...ITEMS,
  {
    id: 3,
    categories: ['personal-color'],
    question: 'Một câu hỏi khác về Personal Color?',
    answerMarkdown: 'Câu trả lời thứ ba.',
    highlightIcon: null,
    highlightText: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
]
```

```tsx
  it('shows related questions sharing a category under an open answer', () => {
    renderWithIntl(<FaqSection items={ITEMS_WITH_RELATED} />)
    fireEvent.click(screen.getByText(/Personal Color Test trên TwistFit hoạt động/))
    expect(screen.getByRole('button', { name: 'Một câu hỏi khác về Personal Color?' })).toBeInTheDocument()
  })

  it('clicking a related question clears the search box, resets the category, and opens it', () => {
    renderWithIntl(<FaqSection items={ITEMS_WITH_RELATED} initialCategory="personal-color" />)
    fireEvent.change(screen.getByPlaceholderText(/Tìm kiếm thắc mắc/), { target: { value: 'hoạt động' } })
    fireEvent.click(screen.getByText(/Personal Color Test trên TwistFit hoạt động/))
    fireEvent.click(screen.getByRole('button', { name: 'Một câu hỏi khác về Personal Color?' }))

    expect(screen.getByPlaceholderText(/Tìm kiếm thắc mắc/)).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Tất cả' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Câu trả lời thứ ba.')).toBeInTheDocument()
  })
```

- [ ] **Step 6: Run the tests to verify they fail**

```bash
cd frontend && npx vitest run components/faq/FaqSection.test.tsx
```

Expected: FAIL on the 2 new tests — `FaqSection` doesn't compute or pass related items yet. The 5 pre-existing tests still pass.

- [ ] **Step 7: Add the `relatedQuestionsHeading` translation**

In `frontend/messages/vi.json`, add one key to `Faq.Section`:

```json
    "Section": {
      "badgeText": "Trung Tâm Trợ Giúp & Hỏi Đáp",
      "heading": "Chúng Tôi Có Thể Giúp Gì Cho Bạn?",
      "subheading": "Tìm câu trả lời nhanh chóng cho các thắc mắc về phân tích Personal Color, phòng thử đồ ảo AI và tài khoản TwistFit.",
      "noResultsTitle": "Không tìm thấy câu hỏi phù hợp",
      "noResultsBody": "Hãy thử tìm kiếm với các từ khóa ngắn gọn hơn hoặc gửi yêu cầu trực tiếp bên dưới.",
      "relatedQuestionsHeading": "Câu hỏi liên quan"
    },
```

- [ ] **Step 8: Update `FaqSection.tsx`**

Add the related-items computation and the select handler right after the existing `visibleItems` memo:

```tsx
  function relatedItemsFor(item: FaqItem) {
    return items
      .filter(
        (other) => other.id !== item.id && other.categories.some((category) => item.categories.includes(category))
      )
      .slice(0, 3)
      .map((other) => ({ id: other.id, question: other.question }))
  }

  function handleSelectRelated(id: number) {
    setSearchQuery('')
    setActiveCategory('all')
    setOpenItemId(id)
    requestAnimationFrame(() => {
      const target = document.getElementById(`faq-question-${id}`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target?.focus()
    })
  }
```

Update the `FaqAccordionItem` usage inside the `visibleItems.map(...)`:

```tsx
                {visibleItems.map((item, index) => (
                  <FaqAccordionItem
                    key={item.id}
                    item={item}
                    number={String(index + 1).padStart(2, '0')}
                    isOpen={openItemId === item.id}
                    onToggle={(id) => setOpenItemId((current) => (current === id ? null : id))}
                    relatedItems={relatedItemsFor(item)}
                    relatedHeading={t('relatedQuestionsHeading')}
                    onSelectRelated={handleSelectRelated}
                  />
                ))}
```

- [ ] **Step 9: Run the tests to verify they pass**

```bash
cd frontend && npx vitest run components/faq/FaqSection.test.tsx
```

Expected: PASS (all 7 tests).

- [ ] **Step 10: Commit**

```bash
git add frontend/components/faq/FaqAccordionItem.tsx frontend/components/faq/FaqAccordionItem.test.tsx frontend/components/faq/FaqSection.tsx frontend/components/faq/FaqSection.test.tsx frontend/messages/vi.json
git commit -m "feat: show related questions under each expanded FAQ answer"
```

---

## Task 5: Final integration

**Files:** none (verification only).

- [ ] **Step 1: Run the full backend test suite**

```bash
cd backend && source venv/bin/activate && python3 -m pytest -v
```

Expected: PASS, no regressions outside `tests/domains/faq/`.

- [ ] **Step 2: Run the full frontend test suite**

```bash
cd frontend && npx vitest run
```

Expected: PASS, no regressions outside the `faq`-related files.

- [ ] **Step 3: Run the TypeScript compiler as a final check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Manual visual check in a real browser**

With both dev servers running (backend `uvicorn app.main:app --host 0.0.0.0 --port 8000` — **restart it if it was already running before this plan's backend changes**, since it does not auto-reload; confirm with `curl -s http://localhost:8000/faq | python3 -m json.tool | grep -c '"id"'` returning `33` before proceeding — and frontend `npm run dev`), visit `/faq` and confirm:

1. The sidebar shows exactly 5 tiles: Tất cả, Tài khoản & Dữ liệu, Trắc nghiệm Personal Color, Phòng thử đồ ảo (Fitting Room), Chính sách — in that order, no "Tư vấn Stylist".
2. Clicking each category filters to the right questions and the counts look right (7 / 8 / 9 / 9 respectively, plus 33 under "Tất cả").
3. Opening a question shows its answer (including the 3-step markdown answer rendering with bold step headers) and, below it, up to 3 "Câu hỏi liên quan" links from the same category.
4. Clicking a related question: the search box clears, the sidebar jumps back to "Tất cả", the previous answer collapses, the target question's answer opens, and the page scrolls to it.
5. Visit `/` and confirm the homepage FAQ preview grid shows the same 4 real categories linking correctly into `/faq?category=...`.
6. Visit `/admin/faq/new` (as an admin) and confirm the category checkboxes show the 4 new labels (no "stylist").

Report the outcome; fix any issue found before considering this task done.

- [ ] **Step 5: Invoke `finishing-a-development-branch`**

Announce: "I'm using the finishing-a-development-branch skill to complete this work." and follow that skill (verify tests, present the merge/PR/keep-as-is menu, act on the choice) for both the `frontend` (branch `master`) and `backend` (branch `main`) repos.
