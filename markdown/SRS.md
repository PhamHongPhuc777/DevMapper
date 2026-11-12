# Đặc tả Yêu cầu Phần mềm (SRS)

**Tên dự án:** DevMapper — Hệ thống Tự động hóa Bản đồ Kiến trúc Mã nguồn & Ngữ cảnh AI
**Người soạn:** Phạm Hồng Phúc
**Ngày soạn:** 21/10/2026

> Tài liệu này đặc tả chi tiết các yêu cầu chức năng và phi chức năng cho nền tảng **DevMapper**, làm căn cứ kỹ thuật xuyên suốt cho đội ngũ phát triển và hệ thống đa tác tử AI (điều phối qua skill `Harness` với `Opus Architect` và `Sonnet Executor`).

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
   - [1.1 Mục đích](#11-mục-đích)
   - [1.2 Phạm vi](#12-phạm-vi)
   - [1.3 Đối tượng sử dụng](#13-đối-tượng-sử-dụng)
2. [Mô tả tổng quan](#2-mô-tả-tổng-quan)
   - [2.1 Bối cảnh sản phẩm](#21-bối-cảnh-sản-phẩm)
   - [2.2 Giả định và ràng buộc](#22-giả-định-và-ràng-buộc)
3. [Yêu cầu chức năng](#3-yêu-cầu-chức-năng)
   - [FR-1: Quản lý cụm hệ thống (System Group) và đồng bộ Polyrepo](#fr-1-quản-lý-cụm-hệ-thống-system-group-và-đồng-bộ-polyrepo)
   - [FR-2: Phân tích mã nguồn tĩnh và xây dựng đồ thị phụ thuộc](#fr-2-phân-tích-mã-nguồn-tĩnh-và-xây-dựng-đồ-thị-phụ-thuộc)
   - [FR-3: Bản đồ tương tác, phân tích tác động và cổng ngữ cảnh MCP](#fr-3-bản-đồ-tương-tác-phân-tích-tác-động-và-cổng-ngữ-cảnh-mcp)
   - [FR-4: (Đã loại bỏ)](#fr-4-đã-loại-bỏ)
   - [FR-5: Xác thực tập trung Keycloak và phân quyền RBAC](#fr-5-xác-thực-tập-trung-keycloak-và-phân-quyền-rbac)
   - [FR-6: Nhật ký Audit và điều phối sự kiện Kafka](#fr-6-nhật-ký-audit-và-điều-phối-sự-kiện-kafka)
4. [Yêu cầu phi chức năng](#4-yêu-cầu-phi-chức-năng)
   - [NFR-1: Bảo mật và cô lập mạng](#nfr-1-bảo-mật-và-cô-lập-mạng)
   - [NFR-2: Hiệu năng và tối ưu tài nguyên tự host](#nfr-2-hiệu-năng-và-tối-ưu-tài-nguyên-tự-host)
   - [NFR-3: Khả năng bảo trì và kiến trúc phân tầng](#nfr-3-khả-năng-bảo-trì-và-kiến-trúc-phân-tầng)
   - [NFR-4: Khả năng triển khai và CI/CD tự phục hồi](#nfr-4-khả-năng-triển-khai-và-cicd-tự-phục-hồi)
   - [NFR-5: Phạm vi kiểm thử E2E của client (Playwright)](#nfr-5-phạm-vi-kiểm-thử-e2e-của-client-playwright)

---

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu này quy định các yêu cầu chức năng và phi chức năng cho ứng dụng web **DevMapper** (Spring Boot Microservices, React.js frontend), đóng vai trò là hợp đồng kỹ thuật giữa Chủ dự án và tổ hợp AI Agent (`Opus Architect` & `Sonnet Executor`) trong quá trình xây dựng, kiểm thử và vận hành hệ thống.

### 1.2 Phạm vi

Hệ thống tự động thu thập siêu dữ liệu kiến trúc từ nhiều kho mã nguồn (polyrepo) thông qua CI pipeline, hợp nhất thành bản đồ phụ thuộc microservice trực quan, tính toán bán kính ảnh hưởng khi thay đổi API/Kafka topic, cung cấp ngữ cảnh chuẩn MCP cho AI Agent.

### 1.3 Đối tượng sử dụng

- **Lập trình viên (Developer / Fresher):** Tra cứu sơ đồ kiến trúc, điểm cuối API, luồng sự kiện Kafka và phụ thuộc dịch vụ.
- **Tác tử AI (AI Coding Agent):** Truy vấn ngữ cảnh kiến trúc đa repo qua giao thức MCP hoặc REST API để hỗ trợ viết code và sửa lỗi liên repo.
- **Trưởng nhóm kỹ thuật (Tech Lead / Architect):** Giám sát thay đổi kiến trúc giữa các phiên bản, thực hiện phân tích tác động cùng 4 mô hình AI (Claude, ChatGPT, Gemini, Grok).
- **Quản trị hệ thống (Platform Admin):** Quản lý người dùng/phân quyền qua Keycloak, giám sát truy cập mạng.

## 2. Mô tả tổng quan

### 2.1 Bối cảnh sản phẩm

DevMapper là công cụ nền tảng kỹ thuật nội bộ (Internal Developer Platform module), không mở truy cập trực tiếp ra internet công khai. Toàn bộ các dịch vụ dữ liệu và ứng dụng được tự vận hành (self-hosted) trên một máy chủ duy nhất là desktop (Windows 11 Pro, 32 GB RAM; MVP không dùng VPS), laptop chỉ là máy khách và phương án dự phòng, mọi cổng bind `127.0.0.1`; truy cập từ xa bằng NetBird là tùy chọn từ Phase 2.

### 2.2 Giả định và ràng buộc

- Hệ thống Backend ứng dụng kiến trúc **Microservices** (gồm Scanner Service, Topology Service, AI-MCP Service, User Service; API Gateway thêm từ Phase 2 cùng Keycloak/JWT) viết bằng Java (Spring Boot, MyBatis). Frontend phát triển bằng TypeScript/React.
- Toàn bộ các thành phần hạ tầng gồm **PostgreSQL, Redis, Apache Kafka, Keycloak, và MinIO** được đóng gói container và tự host trực tiếp trên PC.
- **NetBird** và **Traefik** là tùy chọn từ Phase 2, chỉ thêm khi cần truy cập từ xa; NetBird dùng **NetBird Cloud** (không cần VPS), MVP không phụ thuộc vào chúng.
- Quá trình phát triển tuân thủ nghiêm ngặt quy trình điều phối đa tác tử (`Harness`), tra cứu tài liệu thời gian thực (`Context7`), rà soát bảo mật (`Claude Security`) và kiểm thử hồi quy tích lũy (`Playwright`) quy định tại `AGENTS.md`.

## 3. Yêu cầu chức năng

### FR-1: Quản lý cụm hệ thống (System Group) và đồng bộ Polyrepo

- Cho phép tạo và quản lý các cụm hệ thống (`SYSTEM_GROUP`), mỗi cụm chứa danh sách nhiều kho mã nguồn (`REPOSITORY`) trên GitLab hoặc GitHub.
- Cung cấp khóa xác thực (Ingestion Token) cho phép các pipeline CI gửi kết quả quét mã nguồn của từng repo về DevMapper qua HTTPS Ingestion API (CI không truy cập trực tiếp Kafka/MinIO).
- Lưu trữ lịch sử từng lần quét dưới dạng bản chụp (`SCAN_SNAPSHOT`) gắn với mã commit SHA, nhánh git và nhãn phiên bản.

### FR-2: Phân tích mã nguồn tĩnh và xây dựng đồ thị phụ thuộc

- Bộ phân tích tĩnh (Tree-sitter AST, OpenAPI/AsyncAPI) của `scanner-service` tự động trích xuất:
  - Danh sách dịch vụ (`SERVICE_NODE`) và các tài nguyên hạ tầng liên quan (Database, Redis cache, External API).
  - Các hợp đồng giao tiếp (`EXPOSED_CONTRACT`): phương thức HTTP, đường dẫn URL, định dạng request/response DTO, tên file và dòng code.
  - Các điểm gọi ra bên ngoài (`DEPENDENCY_EDGE`): lệnh gọi HTTP đồng bộ, lệnh publish/subscribe vào `MESSAGE_TOPIC` (Kafka), kèm vị trí dòng code gọi.
- `topology-service` tự động đối chiếu và nối các đầu mối rời rạc giữa các repo thành luồng hoàn chỉnh.
- Lưu bản gốc AST JSON lên MinIO và nạp đồ thị đã tổng hợp vào PostgreSQL cùng bộ nhớ đệm Redis.

### FR-3: Bản đồ tương tác, phân tích tác động và cổng ngữ cảnh MCP

- Hiển thị đồ thị kiến trúc trên giao diện web bằng React Flow: hỗ trợ phóng to/thu nhỏ, lọc theo cụm repo, lọc theo loại kết nối (HTTP/Kafka/DB), và tìm kiếm nhanh.
- **Phân tích bán kính ảnh hưởng (Blast Radius / Impact Analysis):** Truy vấn đệ quy toàn bộ cây phụ thuộc để chỉ ra danh sách các repo và vị trí file code sẽ bị ảnh hưởng nếu thay đổi một `EXPOSED_CONTRACT` hoặc `MESSAGE_TOPIC`.
- **Tích hợp Đa mô hình AI (Claude, ChatGPT, Gemini, Grok) — Phase 3:** Gửi đồ thị tác động tới các mô hình AI qua interface `AiProvider` để nhận phân tích rủi ro và gợi ý sửa code chéo repo; MVP chỉ cần 1 provider.
- **Cổng giao thức MCP:** Cung cấp endpoint MCP chuẩn tại `ai-mcp-service` để Claude Code và OpenAI Codex tự động gọi và nạp ngữ cảnh kiến trúc liên repo.

### FR-4: (Đã loại bỏ)

Claude Security là công cụ trong giai đoạn lập trình (xem `AGENTS.md` Mục 3), không phải chức năng của ứng dụng. Số hiệu FR-4 được giữ lại để không đổi số các yêu cầu khác.

### FR-5: Xác thực tập trung Keycloak và phân quyền RBAC

- Đăng nhập tập trung qua **Keycloak** tự host trên PC (chuẩn OIDC/OAuth2 PKCE).
- Đồng bộ trạng thái người dùng giữa Keycloak, cơ sở dữ liệu nội bộ và (khi có) hệ thống VPN NetBird.
- Phân quyền theo vai trò (RBAC), kiểm tra bắt buộc tại tầng bộ lọc bảo mật của API Gateway và từng Microservice.
- Sử dụng dịch vụ SMTP của **Brevo** qua Keycloak để gửi email vòng đời tài khoản.

### FR-6: Nhật ký Audit và điều phối sự kiện Kafka

- Sử dụng **Apache Kafka (KRaft)** để giao tiếp bất đồng bộ giữa các microservices (ví dụ: `scanner-service` quét xong bắn sự kiện cho `topology-service`).
- Ghi nhật ký bất biến (`AUDIT_LOG`) cho mọi thao tác thay đổi cấu hình, kích hoạt quét lại, sửa ma trận phân quyền và khóa/xóa tài khoản.

## 4. Yêu cầu phi chức năng

### NFR-1: Bảo mật và cô lập mạng

- MVP chạy trên `localhost`; TLS qua reverse proxy **Traefik** (Let's Encrypt) chỉ cần khi mở truy cập từ xa (Phase 2).
- **Cô lập mạng:** Các dịch vụ không mở port public; mọi cổng bind `127.0.0.1` (MVP). Khi mở truy cập từ xa, mọi truy cập đi qua mạng ảo **NetBird** (100.64.0.0/10) và Traefik chỉ bind cổng `443` vào dải IP NetBird.
- Mã nguồn và cấu hình không chứa secret cứng; trong giai đoạn lập trình, mọi đợt cập nhật phải được rà soát bằng Claude Security (xem `AGENTS.md`).

### NFR-2: Hiệu năng và tối ưu tài nguyên tự host

- Đồ thị kiến trúc của các nhánh chính phải được lưu đệm trên **Redis** để đảm bảo tốc độ truy vấn < 200ms.
- Phân bổ `mem_limit` chặt chẽ trong Docker Compose cho Keycloak, Kafka KRaft và PostgreSQL để tránh tràn RAM trên máy PC cá nhân.

### NFR-3: Khả năng bảo trì và kiến trúc phân tầng

- Backend áp dụng kiến trúc **Microservices** nghiêm ngặt. **PostgreSQL được chia thành 4 schemas riêng biệt** (`scanner_db`, `topology_db`, `ai_db`, `users_db`). Nghiêm cấm `JOIN` xuyên schema và không tạo FOREIGN KEY xuyên schema (tham chiếu chéo như `group_id`, `snapshot_id`, `user_id` chỉ là khóa logic, service tự kiểm tra qua REST/gRPC/Kafka; xem phân bổ bảng trong `ERD.md`). Phân tầng nội bộ: `Controller -> Service -> Mapper -> Model`.
- Frontend tuân thủ chuỗi gọi đơn bước `Page -> Component -> Hook -> API` và quy tắc barrel `index.ts`, kiểm soát bằng `dependency-cruiser`.

### NFR-4: Khả năng triển khai và CI/CD tự phục hồi

- Tích hợp **GitHub Actions** dùng **Self-hosted Runner** cấu hình sẵn.
- Áp dụng **Incremental Build** (biên dịch gia tăng) trên Gradle và Vite để tối ưu thời gian build.
- **Cơ chế tự phục hồi (Self-healing Pipeline):** Khi phát hiện log `ERROR` hoặc `WARN`, tổ hợp Agent (`Sonnet Executor` -> `Haiku Router` -> `Opus Architect`) tự động phân tích vùng sửa đổi, áp dụng bản vá và chạy lại pipeline tới khi thành công.

### NFR-5: Phạm vi kiểm thử E2E của client (Playwright)

- Playwright chỉ kiểm thử **client frontend của chính DevMapper**. Không chạy lên các repo được quét và không phải chức năng dành cho nhà phát triển khi dùng ứng dụng.
- Bộ test tích lũy tăng dần sau mỗi đợt thay đổi client (toàn bộ test cũ + mới). Báo cáo HTML kèm Trace Viewer là artifact của quy trình phát triển, lưu ở `testing/versions/` (có thể sao lưu lên MinIO) và mở bằng `npx playwright show-report`; không phải màn hình trong ứng dụng.

---

*Xem thêm: [`PRD.md`](./PRD.md) cho bối cảnh sản phẩm, [`ERD.md`](./ERD.md) cho mô hình dữ liệu chi tiết, và [`../AGENTS.md`](../AGENTS.md) cho quy tắc vận hành đội ngũ Agent.*