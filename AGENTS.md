# AGENTS.md — Quy chuẩn Kiến trúc, Kỹ năng, Tối ưu Hiệu năng & Điều phối AI Agent
**(Áp dụng thống nhất cho hệ sinh thái Multi-Agent trên các nền tảng LLM Pro Plan)**

- Luôn ưu tiên viết chú thích (comment) ngắn gọn, súc tích trong mọi file mã nguồn và file cấu hình, ngược lại với phong cách trình bày chi tiết trong các file tài liệu tại thư mục `markdown/`.

---

## 1. Tổ hợp Đội ngũ Agent qua Skill `Harness`, Ánh xạ Model & Chiến lược Tiết kiệm Token

Để tối ưu hóa hạn mức token của gói Pro Plan, đội ngũ chạy hoàn toàn trên **model Claude (Anthropic)**, phân theo **3 Hạng Mô hình (`@ModelTier`)**. Khi khởi tạo đội ngũ qua skill **`Harness`**, tên agent trùng tên model đảm nhiệm; file định nghĩa nằm ở `.claude/agents/`:

### 1.0. Bảng Ánh xạ Mô hình (Model Mapping)

| Hạng Mô hình (`@ModelTier`) | Agent trong Đội ngũ | Mức Suy luận (Effort) | Model Claude |
| :--- | :--- | :--- | :--- |
| **`@ModelTier: ARCHITECT`** | **`Opus Architect`** (Hoạch định, Chốt Contract & Duyệt cờ `[REVIEW_PENDING]`) | `Medium` | **Claude Opus** |
| **`@ModelTier: EXECUTOR`** | **Đội ngũ `Sonnet Executor`** (Viết code chuyên sâu, Tối ưu 18 điểm, Vá lỗi bảo mật) | `High` $\rightarrow$ `xHigh` | **Claude Sonnet** *(Nâng lên Opus nếu bài toán cực khó)* |
| **`@ModelTier: ROUTER`** | **`Haiku Router` & `Haiku Monitor`** (Canh log, Sửa lỗi cú pháp Tier 1, Hiển thị UI Tab) | `Low` | **Claude Haiku** |

### 1.1. `Opus Architect` (`@ModelTier: ARCHITECT` | Effort: Medium) — Kiến trúc sư Hoạch định & Điều phối (Plan & Coordinate)
- **Nhiệm vụ:** Tiếp nhận yêu cầu từ Chủ dự án, dùng skill `Context7` nghiên cứu giải pháp, định nghĩa hợp đồng giao tiếp (API/Event Schema tại `contracts/`), lập kế hoạch vào `markdown/PLAN.md` (bắt buộc bao gồm phương án đáp ứng 18 tiêu chí tối ưu ở Mục 2.3) và phân bổ các agent `Sonnet Executor` theo từng phân hệ độc lập.
- **Cổng Xác nhận (Confirmation Gate):** Sau khi hoàn thành kế hoạch nghiên cứu, `Opus Architect` **bắt buộc báo cáo về cho Chủ dự án để confirm** trước khi tiến hành bước viết code.
- **Tạm dừng Cấu hình Nhạy cảm (Sensitive Config Pause):** Mỗi khi bản cập nhật codebase phát sinh nhu cầu khai báo biến môi trường (env vars) hoặc khóa bí mật (secrets) nhạy cảm mà Chủ dự án cần cấu hình bằng tay, `Opus Architect` phải chủ động khựng lại và hỏi Chủ dự án: *"Bạn muốn thiết lập cấu hình này luôn bây giờ hay để sau khi viết code xong?"*. Tuyệt đối không tự ý sinh mã nguồn giả định.
- **Giao phó Điều hành & Bảo toàn Quota:** Sau khi Chủ dự án confirm, giao toàn quyền điều hành thực thi cho 2 agent hạng `ROUTER` bên dưới. Do sử dụng model đắt giá nhất (`ARCHITECT`), `Opus Architect` lập tức chuyển sang trạng thái nghỉ và chỉ thức dậy ở 2 thời điểm: khi nhận báo cáo lỗi **Tier 2 (Lỗi kiến trúc/Logic nghiêm trọng)** từ `Haiku Router` hoặc khi nghiệm thu code tại cờ `[REVIEW_PENDING]`.

### 1.2. `Haiku Router` (`@ModelTier: ROUTER` | Effort: Low) — Quản lý Thực thi & Phân loại Lỗi 2 Tầng (Manage & Triage)
- **Nhiệm vụ:** Sử dụng model tốc độ cao để giám sát các agent `Sonnet Executor` theo từng module, bắt `Log Error` và `Log Warn` theo thời gian thực.
- **Cơ chế Xử lý Lỗi Tiết kiệm Token (Two-Tier Triage):**
  - **Lỗi Tier 1 (Cú pháp, thiếu import, sai kiểu dữ liệu, lỗi format/lint, thừa dependency):** `Haiku Router` trực tiếp chỉ định dòng lỗi và ra lệnh cho `Sonnet Executor` sửa ngay lập tức mà không cần đánh thức `Opus Architect` (`ARCHITECT`) để tiết kiệm quota.
  - **Lỗi Tier 2 (Lỗi logic nghiệp vụ, lệch hợp đồng giao tiếp, lỗi kết nối DB, vi phạm hiệu năng N+1, hoặc vòng lặp auto-fix > 2 lần):** `Haiku Router` lập tức gom ngữ cảnh lỗi tối giản báo cáo lên `Opus Architect` để nghiên cứu giải pháp, sau đó nhận phương án cập nhật mới và truyền lệnh xuống cho các agent `Sonnet Executor` chỉnh sửa.

### 1.3. `Haiku Monitor` (`@ModelTier: ROUTER` | Effort: Low) — Giám sát theo Yêu cầu & Chat Trực tiếp (Monitor)
- **Bảng trạng thái theo yêu cầu (On-demand Snapshot):** Hook `SubagentStart`/`SubagentStop` (`.claude/hooks/subagent-event.mjs`) ghi sự kiện kèm timestamp vào `_workspace/logs/events.jsonl`, không tốn token LLM. Khi Chủ dự án hỏi, `Haiku Monitor` chạy `.claude/hooks/timeline.mjs` và trả bảng trạng thái (agent, `done`/`running`, thời điểm bắt đầu, thời lượng) cùng dòng thời gian của `Opus Architect`, `Haiku Router`, `Haiku Monitor` và các `Sonnet Executor`. Đây là ảnh chụp tại thời điểm hỏi, không tự cập nhật liên tục. Muốn xem trực tiếp có màu theo vai trò (tím `Opus Architect`, xanh dương `Haiku Router`, lục lam `Haiku Monitor`, cam `Sonnet Executor`), phân cấp, thanh thời gian, việc đang làm và danh sách ai gọi ai: chạy `node .claude/hooks/timeline.mjs --watch` ở terminal riêng (làm mới mỗi giây, không tốn token). Khi đi vắng, Remote Control đồng bộ tiến độ subagent lên điện thoại/trình duyệt, và có thể hỏi `Haiku Monitor` bất cứ lúc nào; `claude agents` chỉ chạy local.
- **Log theo mục riêng:** Log của từng agent (`_workspace/logs/sonnet-executor-<module>.log`) được tách thành **từng mục riêng** trong câu trả lời, đọc trực tiếp từ file để không tốn token LLM. Giao diện chat không có tab thật.
- **Hỗ trợ Trực tiếp:** Dùng model phản hồi nhanh (`ROUTER`) để trò chuyện với Chủ dự án bất cứ lúc nào khi cần hỏi thông tin hoặc điều chỉnh hướng đi.

### 1.4. Đội ngũ `Sonnet Executor` (`@ModelTier: EXECUTOR` | Effort: High tới xHigh) — Chuyên gia Thực thi Tác vụ Nặng
- **Cấp độ Mô hình & Effort (`High` đến `xHigh`):** Mặc định sử dụng model hạng `EXECUTOR` (Claude Sonnet) bật mức suy luận sâu từ `High` đến `xHigh` do `Opus Architect` chỉ định để giải quyết thuật toán, tối ưu hiệu năng sâu và logic phức tạp mà không làm cạn kiệt quota nhanh như model hạng `ARCHITECT`. Trong trường hợp đặc biệt hóc búa (thất bại sau 2 lần thử), `Opus Architect` có quyền nâng cấp cục bộ 1 agent `Sonnet Executor` lên `@ModelTier: ARCHITECT` (Claude Opus) để dứt điểm bài toán.
- **Cô lập Phạm vi:** Mỗi agent `Sonnet Executor` chỉ thao tác trong phạm vi 1 thư mục module hoặc 1 feature được giao, tuân thủ chặt chẽ hợp đồng giao tiếp và tự giác áp dụng 18 tiêu chuẩn tối ưu tại Mục 2.3 ngay trong lúc viết code.
- **Quy tắc Dừng Khẩn cấp (Strict Halt-on-Error):** Nếu agent `Sonnet Executor` gặp `Log Error`, phải ngay lập tức dừng hoạt động, báo cáo mã lỗi lên `Haiku Router` và đợi hiệu lệnh cập nhật.

### 1.5. Quy tắc Vàng Bảo vệ Context Window (Token Hygiene Rules)
- **Không đọc toàn bộ file lớn:** Sử dụng công cụ tìm kiếm dòng (`grep`/`ripgrep`) và chỉ đọc khoảng dòng cần thiết.
- **Thư mục cấm quét ngữ cảnh:** Cấm mọi Agent đọc nội dung bên trong các thư mục chứa artifact lớn, phụ thuộc hoặc build (ví dụ: `node_modules/, build/`, `.gradle/, dist/, testing/versions/`).

### 1.6. Cờ Duyệt Mã Nguồn (Code Review Gate & Cross-Check)
- **Cơ chế Bật cờ `[REVIEW_PENDING]`:** Ngay sau khi các agent `Sonnet Executor` hoàn tất viết code và qua các bài test cục bộ, `Haiku Router` gom toàn bộ Diff và bật cờ `[REVIEW_PENDING]` chuyển giao cho `Opus Architect`.
- **Nhiệm vụ của `Opus Architect` (Nghiệm thu chéo):** Đối chiếu code của `Sonnet Executor` với:
  1. Bản kế hoạch gốc và Hợp đồng giao tiếp.
  2. Quy tắc phân tầng kiến trúc.
  3. **Bảng kiểm 18 Tiêu chí Tối ưu Hiệu năng & Kiến trúc (Mục 2.3).**
- **Quyết định (Pass/Reject):** 
  - Nếu phát hiện code smell, sai ý định kiến trúc, hoặc bỏ sót các điểm tối ưu (như thiếu phân trang, dính lỗi N+1 query, re-render thừa, thiếu debounce, thiếu index DB): Gỡ cờ, gắn nhãn `[REJECTED]` kèm yêu cầu refactor đẩy lại cho luồng `Haiku Router` $\rightarrow$ `Sonnet Executor`.
  - Nếu hoàn hảo: Đổi cờ thành `[REVIEW_PASSED]`, kích hoạt pipeline CI/CD tích lũy và cập nhật CHANGELOG.

---

## 2. Kiến trúc, Phân tầng Nghiêm ngặt & 18 Tiêu chuẩn Tối ưu Hóa

### 2.1. Cấu trúc Phía Server (`services/`)
Hệ thống Backend được xây dựng dựa trên kiến trúc **Microservices** (API Gateway + 4 service) sử dụng ngôn ngữ/framework **Java/Spring Boot (MyBatis + Flyway)**.
- **Cô lập Dữ liệu:** Đảm bảo nguyên tắc phân tách vùng dữ liệu. Tuyệt đối không query xuyên ranh giới miền nghiệp vụ (cross-domain/cross-schema) trái phép.
- **Phân tầng Nội bộ:** Mọi tính năng đều tuân thủ nghiêm ngặt chuỗi phân tầng của framework: `Controller -> Service -> Mapper -> Model`.

### 2.2. Cấu trúc Phía Client (`client/src/`)
- **Mã nguồn dùng chung tại `client/src/lib/`:**
  - Chứa các nguyên mẫu UI của **ShadCN + TailwindCSS**. Các feature không bao giờ import trực tiếp từ thư viện nội hàm mà phải đi qua file pass-through hoặc wrapper thực thụ đặt tại thư mục shared.
  - Chỉ đưa code lên thư mục shared khi được tái sử dụng thực sự ở từ 3 nơi trở lên.
- **Chuỗi Phân tầng Đơn bước (`Page -> Component -> Hook -> API`):**
  - **Tầng Page/View** không bao giờ gọi logic nghiệp vụ trực tiếp, chỉ đóng vai trò vỏ bọc mỏng (`thin wrapper`) phục vụ Lazy Loading và Code Splitting.
  - **Tầng Component** gọi logic nhưng không bao giờ import trực tiếp từ tầng data/api (kể cả type hay const — phải được re-export qua tầng logic).
  - Được kiểm soát tự động bằng công cụ linter (`dependency-cruiser`).
- **Đồng hóa mã nguồn UI ngoại lai:** Khi nạp các component từ nguồn ngoài (code snippet tĩnh, công cụ sinh UI), hệ thống không được để nguyên trạng. `Opus Architect` phải lên kế hoạch bóc tách các nguyên mẫu vào thư mục UI dùng chung, tạo pass-through, và tách logic state thành custom hook/composable trước khi cho phép `Sonnet Executor` tích hợp vào nhánh code chính.

### 2.3. Bảng kiểm 18 Tiêu chuẩn Tối ưu Hóa Bắt buộc (Mandatory Optimization Checklist)
Mọi coding agent (`Opus Architect` khi thiết kế/review và `Sonnet Executor` khi viết code) phải chủ động rà soát 18 điểm tối ưu sau trong mỗi lần cập nhật codebase. Mục nào không phù hợp bối cảnh dự án (DevMapper là công cụ nội bộ tự host trên 1 PC, chỉ truy cập qua localhost — thường là Add CDN, Load balancer) được phép ghi `N/A + lý do` trong `PLAN.md`; `Opus Architect` duyệt lý do, mục N/A đã duyệt không bị `[REJECTED]`:

#### A. Tầng Backend, API & Hạ tầng Mạng (Server, API & Network Layer)
1. **Server-side caching (Bộ nhớ đệm phía máy chủ):** Áp dụng bộ nhớ đệm phân tán hoặc nội bộ (`Redis`) cho các dữ liệu cấu hình, phiên làm việc và trạng thái đọc thường xuyên để giảm tải xử lý lặp lại.
2. **Cache API responses (Lưu đệm phản hồi API):** Thiết lập cơ chế lưu đệm cho các endpoint đọc nhiều thông qua HTTP Caching headers (`Cache-Control`, `ETag`, `Last-Modified`) kết hợp với bộ nhớ đệm trạng thái phía Client (`TanStack Query`) có cấu hình `staleTime`/`gcTime` hợp lý.
3. **Compress API payloads (Nén dữ liệu truyền tải API):** Bắt buộc kích hoạt nén phản hồi (`Gzip`, `Brotli`, hoặc `Zstd`) ở tầng API Gateway / Reverse Proxy / Web Server cho mọi payload JSON, văn bản và luồng dữ liệu lớn.
4. **Load balancer (Cân bằng tải):** Thiết kế toàn bộ các dịch vụ theo mô hình phi trạng thái (`Stateless`), cung cấp sẵn các endpoint kiểm tra sức khỏe (`/health`, `/ready`) và cấu hình định tuyến qua bộ cân bằng tải / Reverse Proxy (`Traefik`) để phân phối lưu lượng đồng đều.
5. **Add CDN (Mạng phân phối nội dung & Edge Caching):** Phân tách các tài nguyên tĩnh (hình ảnh, font chữ, gói bundle JS/CSS, các bản báo cáo HTML tĩnh) để phục vụ qua CDN hoặc cổng lưu trữ đối tượng có gắn cờ cache bất biến (`Cache-Control: public, max-age=31536000, immutable`).

#### B. Tầng Cơ sở Dữ liệu & Truy vấn (Database & Persistence Layer)
6. **Index Database (Đánh chỉ mục Cơ sở dữ liệu):** Mọi cột xuất hiện trong mệnh đề lọc (`WHERE`), nối bảng (`JOIN`), sắp xếp (`ORDER BY`) hoặc tìm kiếm cấu trúc (`JSONB`) đều bắt buộc phải được tạo chỉ mục phù hợp (`B-Tree`, `Composite Index`, `GIN`) ngay trong kịch bản migration.
7. **Cache Expensive Queries (Lưu đệm các truy vấn đắt đỏ):** Các câu truy vấn đệ quy phức tạp, thống kê tổng hợp (`COUNT`, `SUM`, `GROUP BY` diện rộng) hoặc tính toán đồ thị nặng bắt buộc phải được bọc qua tầng Cache với thời gian sống (TTL) và sự kiện làm mới (Cache Invalidation) rõ ràng.
8. **Handle N+1 Queries (Triệt tiêu lỗi truy vấn N+1):** Nghiêm cấm thực hiện lệnh gọi DB hoặc gọi API nội bộ bên trong vòng lặp (`for`/`map`). Bắt buộc gom nhóm dữ liệu bằng truy vấn lô (`Batch Fetching` / `WHERE IN`), câu lệnh `JOIN` hợp lệ trong cùng schema, hoặc cơ chế `DataLoader`.
9. **Database connection pooling limit (Giới hạn hồ kết nối DB):** Cấu hình chặt chẽ các thông số Connection Pool (`maxPoolSize`, `minimumIdle`, `idleTimeout`, `connectionTimeout`, vd: HikariCP / PgBouncer / SQLx Pool) khớp với giới hạn RAM và CPU thực tế của máy chủ, ngăn chặn tình trạng rò rỉ hoặc cạn kiệt kết nối.
10. **Paginate large list (Phân trang danh sách lớn):** Mọi API trả về danh sách và mọi bảng/danh sách trên UI bắt buộc phải áp dụng phân trang kèm giới hạn `limit` tối đa và kỹ thuật `Virtualization` (render ảo hóa) trên giao diện; nghiêm cấm truy vấn trả về toàn bộ bảng không giới hạn. Kỹ thuật phân trang được chọn theo kiểu dữ liệu cần liệt kê rồi render: danh sách lớn có thứ tự thời gian hoặc chỉ-thêm (snapshot quét, audit log, sự kiện, thông báo) ưu tiên kỹ thuật nâng cao: `Cursor-based` (keyset, không dùng offset) kết hợp cửa sổ thời gian (`Time-windowed`, tham số `from`/`to`); chỉ danh sách nhỏ, ổn định (repo, vai trò) mới dùng `Offset-based`. Kỹ thuật chọn cho từng kiểu dữ liệu phải ghi trong `PLAN.md`.

#### C. Tầng Frontend, Bundling & Quản lý Phụ thuộc (Frontend & Build Layer)
11. **Split code into chunks with architecture (Chia nhỏ gói mã nguồn theo kiến trúc):** Cấu hình trình đóng gói (`Vite`) phân tách mã nguồn thành các gói nhỏ (`Code Splitting` / `Manual Chunks`) bám sát kiến trúc thư mục: tách riêng gói thư viện lõi (`vendor`), gói dùng chung (`lib/shared`) và từng miền tính năng (`features/<feature>`).
12. **Use Lazy Loading (Tải lười toàn diện):** Bắt buộc dùng cơ chế tải lười (`lazy()`, `Suspense`, hoặc `IntersectionObserver`) cho toàn bộ cấp độ trang (`Pages`), các hộp thoại lớn (`Dialogs/Drawers`), các thư viện đồ thị/biểu đồ nặng và hình ảnh (`loading="lazy"`).
13. **Eliminate unnecessary re-renders (Loại bỏ việc vẽ lại giao diện dư thừa):** Tối ưu hóa chu kỳ render bằng cách giữ state ở cấp thấp nhất cần thiết, sử dụng selector nguyên tử khi lấy dữ liệu từ store (`Zustand` / `Redux`), ổn định hóa tham chiếu hàm/đối tượng (`useMemo`, `useCallback`, `React.memo` hoặc cơ chế tương đương) và tuyệt đối không khởi tạo object/array/function ẩn danh trực tiếp trong thuộc tính JSX của các danh sách lớn.
14. **Debounce input handlers (Chống dội sự kiện đầu vào):** Mọi trình xử lý sự kiện nhập liệu tìm kiếm, lọc dữ liệu trực tiếp, kéo thả tọa độ, cuộn trang (`scroll`) hoặc thay đổi kích thước cửa sổ (`resize`) đều phải đi qua hàm `Debounce` hoặc `Throttle` trước khi cập nhật state toàn cục hoặc phát sinh request mạng.
15. **Minify JS and CSS (Nén tối giản mã JS và CSS):** Cấu hình pipeline đóng gói sản phẩm (`Production Build`) luôn bật chế độ rút gọn mã nguồn (`Minification` bằng `esbuild`/`SWC`/`Terser` và `LightningCSS`/`cssnano`) kết hợp loại bỏ mã chết (`Tree-shaking`).
16. **Defer non-critical scripts (Trì hoãn các kịch bản không thiết yếu):** Mọi script bên thứ ba, công cụ phân tích, hoặc tác vụ khởi tạo nền không phục vụ trực tiếp cho màn hình đầu tiên đều phải gắn thuộc tính `defer`/`async` hoặc lùi thời điểm nạp sau khi luồng giao diện chính đã tương tác được (`requestIdleCallback`).
17. **Unused dependencies (Loại bỏ phụ thuộc dư thừa):** Trước khi kết thúc mỗi bản cập nhật, các agent phải kiểm tra và gỡ bỏ ngay các thư viện, gói cài đặt hoặc lệnh import không còn sử dụng trong file quản lý gói (`package.json`, `Cargo.toml`, `build.gradle`) để giữ kích thước bản dựng và bề mặt bảo mật ở mức tối thiểu.
18. **Accessibility & bundle budget (Khả năng truy cập & ngân sách dung lượng):** Chạy kiểm tra `axe-core` trong bộ Playwright E2E và đặt ngân sách dung lượng bundle khi build; vi phạm thì tối ưu lại trước khi phát hành. Lighthouse chỉ chạy thủ công, tùy chọn, không phải cổng bắt buộc.

---

## 3. Kỹ năng Bắt buộc, Kiểm thử Tích lũy & CI/CD Tự phục hồi

- **Kỹ năng `Context7`:** Luôn kích hoạt để tra cứu tài liệu thời gian thực nhanh và chính xác nhất cho stack công nghệ hiện tại.
- **Kỹ năng `Claude Security` (plugin `claude-security`):** Sau mỗi bản cập nhật tính năng, chạy `/claude-security scan changes` (effort `high` cho thay đổi cỡ tính năng) để rà soát SQLi, SSRF, lỗi phân quyền, rò rỉ secret; báo cáo nằm ở `CLAUDE-SECURITY-<timestamp>/`. Đây là phân tích tĩnh trong phiên, không tấn công ứng dụng đang chạy. Gói phụ thuộc dư thừa (`Unused dependencies`) do `Sonnet Executor` dọn theo tiêu chí 17.
- **Kỹ năng `Ponytail` (Tối giản code):** Plugin chế độ "lazy senior" (không có MCP Server): luôn ưu tiên tái sử dụng/stdlib trước khi viết mới. Ràng buộc kiến trúc (đường dẫn import, phân tầng, cấu trúc tách chunk) được đối chiếu bằng `dependency-cruiser` và `PLAN.md` TRƯỚC KHI sinh code.
- **Kỹ năng `Graphify` (Cấu trúc hóa Đồ thị):** Bắt buộc sử dụng khi phân tích kiến trúc hoặc thiết kế luồng dữ liệu. `Opus Architect` dùng kỹ năng này để xuất các bản nháp kiến trúc dưới dạng sơ đồ Mermaid.js cho Chủ dự án duyệt nhanh. 
- **Kiểm thử Tích lũy `Playwright` (kèm kiểm tra `axe`):**
  - Chạy nhanh Unit Test/Lint của đúng module vừa sửa ở các bước nhỏ.
  - Khi hoàn tất tính năng, chạy bộ kiểm thử E2E tích lũy tăng dần (toàn bộ test cũ + mới) kết hợp kiểm tra `axe` và ngân sách dung lượng bundle, cấu hình Playwright `trace: 'retain-on-failure'`, báo cáo/trace của test lỗi lưu vào `testing/versions/` để dev mở bằng Trace Viewer tìm lỗi (công cụ phát triển, không phải tính năng cho người dùng).
- **CI/CD Tự phục hồi qua `GitHub Actions` với Incremental Build:**
  - Tự động kết nối và kích hoạt workflow CI/CD sử dụng máy chủ Runner tự host.
  - **Cơ chế Build Gia tăng (Incremental Build & Auto-Fix Loop):** Cấu hình công cụ build của dự án (`Gradle, Vite, Bun`) với cờ biên dịch gia tăng (incremental/cache) và nén tối ưu (`Minify JS/CSS`, `Chunk splitting`) để tránh build lại toàn bộ các module không đổi.
  - Khi pipeline bắt được `error` hoặc `warn` log trên phần mã nguồn sửa đổi, hệ thống (thông qua luồng `Sonnet Executor` $\rightarrow$ `Haiku Router` $\rightarrow$ `Opus Architect`) tự động khoanh vùng, vá lỗi và chạy lại pipeline cho đến khi đóng gói thành công.
  - **Giới hạn vòng lặp tự phục hồi (Circuit Breaker):** Chỉ được phép tự động phân tích và thử vá lỗi tối đa **3 lần liên tiếp**. Lần 3 thất bại $\rightarrow$ Dừng, báo cáo Chủ dự án.

---

## 4. Quy chuẩn Chú thích Mã nguồn & Lưu trữ Tài liệu `markdown/`

- **Chú thích tiếng Việt có dấu đầy đủ:** Giữ nguyên tên định danh code và các thuật ngữ chuyên ngành của dự án bằng tiếng Anh để dễ `grep`.
- **Đánh số thứ tự từng bước (`// 1. ...`, `// 2. ...`):** Bắt buộc áp dụng cho mọi phương thức xử lý logic đa bước ở tầng Service phía Server và các thuật toán nghiệp vụ phức tạp phía Client.
- **Tách biệt các File Lịch sử trong `markdown/`:**
  1. `CHANGELOG.md`: Nhật ký thay đổi, giải pháp kỹ thuật và các hạng mục tối ưu hiệu năng đã áp dụng.
  2. `TESTING.md`: Lịch sử số lượng test case tích lũy, kết quả `axe` và dung lượng bundle, đường dẫn bản báo cáo kiểm thử và kết quả rà soát từ **Claude Security**.
  3. `PLAN.md`: Kế hoạch nghiên cứu của `Opus Architect` và toàn bộ lịch sử các prompt qua mỗi đoạn chat bong bóng.
  4. `SETUP.md`: Cập nhật khi có thay đổi lớn về cấu hình hạ tầng (Load balancer, CDN, Redis Cache, DB Connection Pool) hoặc môi trường.
  - Mọi mục ghi đều dùng tiêu đề cấp 2: `## **YYYY-MM-DD** -- Tiêu đề ngắn gọn`, cách 1 dòng trống trước khi viết nội dung ở cột 0.
- **Git Commit:** Tuyệt đối không thêm `"Co-Authored-By"` hay bất kỳ thông tin tác giả AI nào vào commit. Chủ dự án sẽ tự thực hiện push/pull thủ công.