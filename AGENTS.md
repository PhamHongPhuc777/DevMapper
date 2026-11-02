# AGENTS.md — Quy chuẩn Kiến trúc, Kỹ năng & Điều phối AI Agent
**(Áp dụng thống nhất cho hệ sinh thái Multi-Agent trên các nền tảng LLM Pro Plan)**

- Luôn ưu tiên viết chú thích (comment) ngắn gọn, súc tích trong mọi file mã nguồn và file cấu hình, ngược lại với phong cách trình bày chi tiết trong các file tài liệu tại thư mục `[THƯ_MỤC_TÀI_LIỆU, vd: markdown/ hoặc docs/]`.

---

## 1. Tổ hợp Đội ngũ Agent qua Skill `Harness` & Chiến lược Tiết kiệm Token

Để tối ưu hóa hạn mức token mà vẫn giữ vững chất lượng kiểm soát, mọi tác vụ đều được điều phối qua skill **`Harness`** theo mô hình **Sol Gốc — Luna** với cơ chế phân tầng xử lý lỗi:

### 1.1. `Sol Gốc` (Effort: Medium) — Kiến trúc sư Hoạch định & Điều phối (Plan & Coordinate)
- **Nhiệm vụ:** Tiếp nhận yêu cầu từ Chủ dự án, dùng skill `Context7` nghiên cứu giải pháp, định nghĩa hợp đồng giao tiếp (API/Event Schema tại `[THƯ_MỤC_CONTRACTS, vd: contracts/ hoặc api-docs/]`), lập kế hoạch vào `[FILE_KẾ_HOẠCH, vd: PLAN.md]` và phân bổ các agent `Luna` theo từng phân hệ độc lập.
- **Cổng Xác nhận (Confirmation Gate):** Sau khi hoàn thành kế hoạch nghiên cứu, `Sol Gốc` **bắt buộc báo cáo về cho Chủ dự án để confirm** trước khi tiến hành bước viết code.
- **Tạm dừng Cấu hình Nhạy cảm (Sensitive Config Pause):** Mỗi khi bản cập nhật codebase phát sinh nhu cầu khai báo biến môi trường (env vars) hoặc khóa bí mật (secrets) nhạy cảm mà Chủ dự án cần cấu hình bằng tay, `Sol Gốc` phải chủ động khựng lại và hỏi Chủ dự án: *"Bạn muốn thiết lập cấu hình này luôn bây giờ hay để sau khi viết code xong?"*. Tuyệt đối không tự ý sinh mã nguồn giả định.
- **Giao phó Điều hành:** Sau khi Chủ dự án confirm, giao toàn quyền điều hành thực thi cho 2 agent `Sol (Low)`. `Sol Gốc` chỉ thức dậy khi nhận được báo cáo lỗi **Tier 2 (Lỗi kiến trúc/Logic nghiêm trọng)** từ `Sol Chính (Low)` hoặc khi cần duyệt code tại cờ `[REVIEW_PENDING]`.

### 1.2. `Sol Chính` (Effort: Low) — Quản lý Thực thi & Phân loại Lỗi 2 Tầng (Manage & Triage)
- **Nhiệm vụ:** Giám sát các agent `Luna` theo từng module để bắt `Log Error` và `Log Warn`.
- **Cơ chế Xử lý Lỗi Tiết kiệm Token (Two-Tier Triage):**
  - **Lỗi Tier 1 (Cú pháp, thiếu import, sai kiểu dữ liệu, lỗi format/lint):** `Sol Chính (Low)` trực tiếp chỉ định dòng lỗi và ra lệnh cho `Luna` sửa ngay lập tức mà không cần gọi lên `Sol Gốc` để tiết kiệm token.
  - **Lỗi Tier 2 (Lỗi logic nghiệp vụ, lệch hợp đồng giao tiếp, lỗi kết nối DB, hoặc vòng lặp auto-fix > 2 lần):** `Sol Chính (Low)` lập tức gom ngữ cảnh lỗi tối giản báo cáo lên `Sol Gốc` để nghiên cứu giải pháp, sau đó nhận phương án cập nhật mới và truyền lệnh xuống cho các agent `Luna` chỉnh sửa.

### 1.3. `Sol Phụ` (Effort: Low) — Giám sát Trực quan Đa Tab & Chat Trực tiếp (Monitor)
- **Trực quan hóa Đội ngũ Thời gian thực (Real-time Team Visualization):** Hiển thị và cập nhật liên tục ngay trong đoạn chat danh sách trạng thái cơ bản của toàn bộ tổ hợp agent (bao gồm `Sol Gốc`, `Sol Chính`, bản thân `Sol Phụ` và các `Luna` đang hoạt động).
- **Phân tách Log Đa Tab:** Trực quan hóa tiến độ của toàn bộ các agent khác và tách luồng Log của từng agent thành **từng Tab riêng biệt** (ưu tiên đọc file log trực tiếp để không tốn token LLM).
- **Hỗ trợ Trực tiếp:** Trực tiếp phản hồi và trò chuyện với Chủ dự án bất cứ lúc nào khi cần hỏi thông tin hoặc điều chỉnh hướng đi.

### 1.4. Đội ngũ `Luna` (Effort: High tới xHigh) — Chuyên gia Thực thi Tác vụ Nặng
- **Cấp độ Effort (High đến xHigh):** Do `Sol Gốc` chỉ định cho các tác vụ đòi hỏi tư duy thuật toán và logic sâu. Tuyệt đối không dùng cho các việc lặp lại đơn giản để tiết kiệm quota.
- **Cô lập Phạm vi:** Mỗi agent `Luna` chỉ thao tác trong phạm vi 1 thư mục module hoặc 1 feature được giao, tuân thủ chặt chẽ hợp đồng giao tiếp.
- **Quy tắc Dừng Khẩn cấp (Strict Halt-on-Error):** Nếu agent `Luna` gặp `Log Error`, phải ngay lập tức dừng hoạt động, báo cáo mã lỗi lên `Sol Chính (Low)` và đợi hiệu lệnh cập nhật.

### 1.5. Quy tắc Vàng Bảo vệ Context Window (Token Hygiene Rules)
- **Không đọc toàn bộ file lớn:** Sử dụng công cụ tìm kiếm dòng (`grep`/`ripgrep`) và chỉ đọc khoảng dòng cần thiết.
- **Thư mục cấm quét ngữ cảnh:** Cấm mọi Agent đọc nội dung bên trong các thư mục chứa artifact lớn, phụ thuộc hoặc build (ví dụ: `[THƯ_MỤC_IGNORE_1, vd: node_modules/, target/, build/]`, `[THƯ_MỤC_IGNORE_2, vd: .gradle/, dist/]`).

### 1.6. Cờ Duyệt Mã Nguồn (Code Review Gate & Cross-Check)
- **Cơ chế Bật cờ `[REVIEW_PENDING]`:** Ngay sau khi các agent `Luna` hoàn tất viết code và qua các bài test cục bộ, `Sol Chính` gom toàn bộ Diff và bật cờ `[REVIEW_PENDING]` chuyển giao cho `Sol Gốc`.
- **Nhiệm vụ của `Sol Gốc` (Nghiệm thu chéo):** Đối chiếu code của `Luna` với: Bản kế hoạch gốc, Hợp đồng giao tiếp, và Quy tắc phân tầng kiến trúc.
- **Quyết định (Pass/Reject):** 
  - Nếu phát hiện code smell hoặc sai ý định kiến trúc: Gỡ cờ, gắn nhãn `[REJECTED]` kèm yêu cầu refactor đẩy lại cho luồng `Sol Chính` $\rightarrow$ `Luna`.
  - Nếu hoàn hảo: Đổi cờ thành `[REVIEW_PASSED]`, kích hoạt pipeline CI/CD tích lũy và cập nhật CHANGELOG.

---

## 2. Kiến trúc & Phân tầng Nghiêm ngặt

### 2.1. Cấu trúc Phía Server (`[THƯ_MỤC_BACKEND, vd: backend/, src/server/]`)
Hệ thống Backend được xây dựng dựa trên kiến trúc **[KIẾN_TRÚC_HỆ_THỐNG, vd: Microservices / Modular Monolith / SOA]** sử dụng ngôn ngữ/framework **[STACK_BACKEND, vd: Rust/Axum, Go/Gin, Java/Spring]**.
- **Cô lập Dữ liệu:** Đảm bảo nguyên tắc phân tách vùng dữ liệu. Tuyệt đối không query xuyên ranh giới miền nghiệp vụ (cross-domain/cross-schema) trái phép.
- **Phân tầng Nội bộ:** Mọi tính năng đều tuân thủ nghiêm ngặt chuỗi phân tầng của framework: `[CHUỖI_PHÂN_TẦNG_BACKEND, vd: Handler -> Service -> Repository -> Model]`.

### 2.2. Cấu trúc Phía Client (`[THƯ_MỤC_FRONTEND, vd: client/src/, frontend/src/]`)
- **Mã nguồn dùng chung tại `[THƯ_MỤC_SHARED_UI, vd: src/lib/, src/shared/]`:**
  - Chứa các nguyên mẫu UI của **[THƯ_VIỆN_UI, vd: ShadCN, Tailwind, Vuetify]**. Các feature không bao giờ import trực tiếp từ thư viện nội hàm mà phải đi qua file pass-through hoặc wrapper thực thụ đặt tại thư mục shared.
  - Chỉ đưa code lên thư mục shared khi được tái sử dụng thực sự ở từ 3 nơi trở lên.
- **Chuỗi Phân tầng Đơn bước (`[CHUỖI_PHÂN_TẦNG_FRONTEND, vd: Page -> Component -> Hook -> API]`):**
  - **Tầng Page/View** không bao giờ gọi logic nghiệp vụ trực tiếp, chỉ đóng vai trò vỏ bọc render.
  - **Tầng Component** gọi logic nhưng không bao giờ import trực tiếp từ tầng data/api (kể cả type hay const — phải được re-export qua tầng logic).
  - Được kiểm soát tự động bằng công cụ linter (`[CÔNG_CỤ_LINT_KIẾN_TRÚC, vd: dependency-cruiser, eslint-plugin-boundaries]`).
- **Đồng hóa mã nguồn UI ngoại lai:** Khi nạp các component từ nguồn ngoài (code snippet tĩnh, công cụ sinh UI), hệ thống không được để nguyên trạng. `Sol Gốc` phải lên kế hoạch bóc tách các nguyên mẫu vào thư mục UI dùng chung, tạo pass-through, và tách logic state thành custom hook/composable trước khi cho phép `Luna` tích hợp vào nhánh code chính.

---

## 3. Kỹ năng Bắt buộc, Kiểm thử Tích lũy & CI/CD Tự phục hồi

- **Kỹ năng `Context7`:** Luôn kích hoạt để tra cứu tài liệu thời gian thực nhanh và chính xác nhất cho stack công nghệ hiện tại.
- **Kỹ năng `Strix`:** Chạy kiểm thử bảo mật và rà soát điểm yếu hệ thống (như SQLi, SSRF, lỗi phân quyền, rò rỉ dữ liệu) sau mỗi bản cập nhật tính năng.
- **Kỹ năng `Ponytail` (Kiểm soát Ràng buộc):** Tự động gọi các tool từ MCP Server của Ponytail để đối chiếu nhanh các ràng buộc kiến trúc (đường dẫn import, quy tắc phân tầng) TRƯỚC KHI sinh code.
- **Kỹ năng `Graphify` (Cấu trúc hóa Đồ thị):** Bắt buộc sử dụng khi phân tích kiến trúc hoặc thiết kế luồng dữ liệu. `Sol Gốc` dùng kỹ năng này để xuất các bản nháp kiến trúc dưới dạng sơ đồ Mermaid.js cho Chủ dự án duyệt nhanh. 
- **Kiểm thử Tích lũy `[CÔNG_CỤ_KIẾM_THỬ_E2E, vd: Playwright, Cypress, Selenium]`:**
  - Chạy nhanh Unit Test/Lint của đúng module vừa sửa ở các bước nhỏ.
  - Khi hoàn tất tính năng, chạy bộ kiểm thử E2E tích lũy tăng dần (toàn bộ test cũ + mới) và xuất bản báo cáo/trace lưu vào `[THƯ_MỤC_LƯU_TRACE, vd: testing/versions/]`.
- **CI/CD Tự phục hồi qua `[NỀN_TẢNG_CI, vd: GitHub Actions, GitLab CI]` với Incremental Build:**
  - Tự động kết nối và kích hoạt workflow CI/CD sử dụng máy chủ Runner tự host.
  - **Cơ chế Build Gia tăng (Incremental Build & Auto-Fix Loop):** Cấu hình công cụ build của dự án (`[CÔNG_CỤ_BUILD, vd: Cargo, Gradle, Vite, Bun]`) với cờ biên dịch gia tăng (incremental/cache) để tránh build lại toàn bộ các module không đổi.
  - Khi pipeline bắt được `error` hoặc `warn` log trên phần mã nguồn sửa đổi, hệ thống (thông qua luồng `Luna` $\rightarrow$ `Sol Chính` $\rightarrow$ `Sol Gốc`) tự động khoanh vùng, vá lỗi và chạy lại pipeline cho đến khi đóng gói thành công.
  - **Giới hạn vòng lặp tự phục hồi (Circuit Breaker):** Chỉ được phép tự động phân tích và thử vá lỗi tối đa **3 lần liên tiếp**. Lần 3 thất bại $\rightarrow$ Dừng, báo cáo Chủ dự án.

---

## 4. Quy chuẩn Chú thích Mã nguồn & Lưu trữ Tài liệu `[THƯ_MỤC_TÀI_LIỆU, vd: markdown/]`

- **Chú thích [NGÔN_NGỮ_CHÚ_THÍCH, vd: tiếng Việt có dấu đầy đủ]:** Giữ nguyên tên định danh code và các thuật ngữ chuyên ngành của dự án bằng tiếng Anh để dễ `grep`.
- **Đánh số thứ tự từng bước (`// 1. ...`, `// 2. ...`):** Bắt buộc áp dụng cho mọi phương thức xử lý logic đa bước ở tầng Service phía Server và các thuật toán nghiệp vụ phức tạp phía Client.
- **Tách biệt các File Lịch sử trong `[THƯ_MỤC_TÀI_LIỆU]`:**
  1. `CHANGELOG.md`: Nhật ký thay đổi và giải pháp kỹ thuật.
  2. `TESTING.md`: Lịch sử số lượng test case tích lũy, đường dẫn bản báo cáo kiểm thử và kết quả rà soát từ **Strix**.
  3. `PLAN.md`: Kế hoạch nghiên cứu của `Sol Gốc` và toàn bộ lịch sử các prompt qua mỗi đoạn chat bong bóng.
  4. `SETUP.md`: Cập nhật khi có thay đổi lớn về cấu hình hạ tầng hoặc môi trường.
  - Mọi mục ghi đều dùng tiêu đề cấp 2: `## **YYYY-MM-DD** -- Tiêu đề ngắn gọn`, cách 1 dòng trống trước khi viết nội dung ở cột 0.
- **Git Commit:** Tuyệt đối không thêm `"Co-Authored-By"` hay bất kỳ thông tin tác giả AI nào vào commit. Chủ dự án sẽ tự thực hiện push/pull thủ công.