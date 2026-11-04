# Tài liệu Yêu cầu Dự án (PRD)

**Tên dự án:** DevMapper — Hệ thống Tự động hóa Bản đồ Kiến trúc Mã nguồn & Ngữ cảnh AI
**Người soạn:** Phạm Hồng Phúc
**Ngày soạn:** 21/10/2026

## Mục lục

1. [Vấn đề](#1-vấn-đề)
2. [Mục tiêu](#2-mục-tiêu)
3. [Đối tượng người dùng](#3-đối-tượng-người-dùng)
4. [Công cụ tương đồng](#4-công-cụ-tương-đồng)
5. [Phạm vi tính năng](#5-phạm-vi-tính-năng)
   - [5.1 Quét mã nguồn tĩnh qua CI & Quản lý cụm Polyrepo](#51-quét-mã-nguồn-tĩnh-qua-ci--quản-lý-cụm-polyrepo)
   - [5.2 Bản đồ kiến trúc tương tác & So sánh phiên bản](#52-bản-đồ-kiến-trúc-tương-tác--so-sánh-phiên-bản)
   - [5.3 Phân tích tác động & Cổng ngữ cảnh MCP cho AI Agent](#53-phân-tích-tác-động--cổng-ngữ-cảnh-mcp-cho-ai-agent)
   - [5.4 Kiểm thử tích lũy Playwright Trace & Bảo mật Claude Security](#54-kiểm-thử-tích-lũy-playwright-trace--bảo-mật-claude-security)
   - [5.5 Tính năng thông minh Đa mô hình AI — đề xuất khác biệt](#55-tính-năng-thông-minh-đa-mô-hình-ai--đề-xuất-khác-biệt)
6. [User Stories tiêu biểu](#6-user-stories-tiêu-biểu)
7. [Đề xuất công nghệ](#7-đề-xuất-công-nghệ)
8. [Rủi ro và Giả định](#8-rủi-ro-và-giả-định)

---

## 1. Vấn đề

**Bối cảnh hiện tại:** Hệ thống của đội ngũ phát triển bao gồm nhiều microservice, trong đó mỗi service nằm ở một kho lưu trữ riêng biệt (polyrepo) trên GitLab/GitHub. Khi số lượng service tăng lên, cả lập trình viên lẫn các AI coding agent (Claude Code, OpenAI Codex, ...) đều gặp khó khăn khi trả lời những câu hỏi cơ bản: *Service này gọi tới service nào? Ai đang subscribe vào Kafka topic này? Sửa một trường trong API này thì ảnh hưởng dây chuyền tới những repo nào?* Trong khi đó, tài liệu kiến trúc vẽ tay trên Wiki/Draw.io nhanh chóng bị lỗi thời chỉ sau vài đợt release.

**Hệ quả:**

- **Mù ngữ cảnh liên repo (Cross-repo blindness):** AI Agent khi chạy trong một repo đơn lẻ không biết sự tồn tại và hợp đồng giao tiếp (API/Event contract) của các repo lân cận, dễ sinh ra code gây lỗi tích hợp (breaking changes).
- **Tốn thời gian onboarding:** Lập trình viên mới (fresher/junior) mất nhiều tuần đọc từng file cấu hình để tự hình dung luồng chạy của hệ thống.
- **Không có nguồn sự thật duy nhất (Single Source of Truth):** Sơ đồ kiến trúc hiện tại không phản ánh đúng trạng thái thực tế của nhánh code đang chạy.
- **Rủi ro triển khai cao:** Khó khoanh vùng bán kính ảnh hưởng (blast radius) trước khi merge Pull Request hoặc nâng cấp cấu trúc dữ liệu.

**Người gặp vấn đề:** Lập trình viên mới (tra cứu luồng hệ thống), AI Coding Agent (cần ngữ cảnh đa repo để sửa code), Tech Lead/Architect (kiểm soát phụ thuộc và điểm nghẽn), DevSecOps/Admin (giám sát chất lượng kiểm thử và lỗ hổng bảo mật).

**Vì sao cần phải giải quyết:** Tốc độ phát triển phần mềm bằng AI phụ thuộc trực tiếp vào độ chính xác của ngữ cảnh đầu vào; nếu không tự động hóa bản đồ kiến trúc từ mã nguồn, số lượng lỗi tích hợp liên repo sẽ tăng theo cấp số nhân.

## 2. Mục tiêu

- Tự động hóa 100% việc sinh bản đồ kiến trúc hệ thống trực tiếp từ mã nguồn (Static Code Analysis) và cập nhật liên tục qua pipeline CI/CD.
- Cung cấp giao diện đồ thị tương tác trực quan giúp lập trình viên mới nắm bắt kiến trúc, luồng gọi API và luồng sự kiện Kafka nhanh chóng.
- Cung cấp chuẩn ngữ cảnh có cấu trúc (thông qua Model Context Protocol - MCP và JSON Graph) làm đầu vào thời gian thực cho các AI Agent (Claude Code, Codex) khi phát triển hoặc sửa lỗi xuyên qua nhiều repo.
- Tích hợp quy trình kiểm thử E2E tích lũy (Playwright Trace Viewer) và rà soát lỗ hổng bảo mật tự động (Claude Security) gắn liền với từng phiên bản kiến trúc.

## 3. Đối tượng người dùng

| Persona | Nhu cầu chính |
|---|---|
| Lập trình viên / Developer (Fresher) | Xem sơ đồ kết nối giữa các microservice, tra cứu nhanh API contract, Kafka topic và luồng dữ liệu mà không cần mở từng repo |
| Tác tử AI / AI Coding Agent (Claude, Codex) | Truy vấn đồ thị phụ thuộc và hợp đồng API qua giao thức MCP để hiểu ngữ cảnh đa repo trước khi thêm tính năng hoặc sửa lỗi |
| Kiến trúc sư / Tech Lead | Phân tích bán kính ảnh hưởng (Impact Analysis) khi thay đổi API, phát hiện phụ thuộc vòng (circular dependencies) và đánh giá kiến trúc với sự hỗ trợ của 4 mô hình AI |
| Quản trị hệ thống / Platform Admin | Quản lý cụm repo, cấu hình Keycloak IAM, kiểm soát truy cập mạng (localhost; NetBird khi mở truy cập từ xa), theo dõi lịch sử Playwright Trace HTML và báo cáo bảo mật Claude Security |

## 4. Công cụ tương đồng

So sánh nhanh các công cụ quản lý kiến trúc và danh bạ dịch vụ phổ biến hiện nay để rút ra bài học thiết kế cho **DevMapper**:

| Công cụ | Điểm mạnh nổi bật | Bài học áp dụng cho DevMapper |
|---|---|---|
| Spotify Backstage | Cổng thông tin IDP toàn diện, quản lý danh bạ dịch vụ (Service Catalog) và tài liệu rất mạnh | Tự động hóa việc sinh metadata từ CI thay vì bắt dev phải viết và cập nhật file `catalog-info.yaml` thủ công |
| Kiali / Jaeger | Vẽ bản đồ topo dịch vụ (Service Mesh / Distributed Tracing) chính xác dựa trên lưu lượng runtime | Chuyển dịch việc vẽ bản đồ về giai đoạn Compile/CI time (quét mã tĩnh AST) để phát hiện lỗi phụ thuộc ngay trước khi code được chạy thật |
| Sourcegraph | Tìm kiếm mã nguồn và tham chiếu chéo (code intelligence) cực nhanh trên nhiều repository | Trích xuất mối quan hệ cấp cao (Service $\rightarrow$ Endpoint / Topic) thành đồ thị gọn nhẹ thay vì trả về hàng nghìn dòng kết quả tìm kiếm thô |
| Structurizr (C4) | Chuẩn hóa mô hình hóa kiến trúc phần mềm theo các tầng phóng đại (System $\rightarrow$ Container $\rightarrow$ Component) | Áp dụng tư duy phóng đại đa cấp (Drill-down) lên giao diện React Flow để bản đồ không bị rối khi số lượng microservice lớn |
| Repomix / Context7 | Đóng gói ngữ cảnh mã nguồn và tài liệu thư viện tốc độ cao cho các mô hình ngôn ngữ lớn (LLM) | Cung cấp MCP Server chuyên biệt chỉ trả về đúng nhánh đồ thị liên quan tới task đang làm để tiết kiệm token cho AI Agent |

## 5. Phạm vi tính năng

Ký hiệu ưu tiên: **M** = Must-have (MVP) · **S** = Should-have (Phase 2) · **C** = Could-have (Phase 3)

### 5.1 Quét mã nguồn tĩnh qua CI & Quản lý cụm Polyrepo

- [x] **[M]** Đăng ký và gom nhóm các repository thuộc cùng một hệ thống (System Group)
- [x] **[M]** Bộ công cụ CLI/Scanner chạy trên CI tự động phân tích cây cú pháp (AST) để bóc tách: REST Controllers, HTTP Clients (`FeignClient`, `RestClient`, `Axios`), gRPC và Kafka Producers/Consumers
- [x] **[M]** Đẩy kết quả quét (AST Manifest JSON) từ CI về máy chủ DevMapper qua HTTPS Ingestion API (xác thực bằng Ingestion Token); sau khi nhận, `scanner-service` lưu bản chụp gốc lên MinIO tự host và phát sự kiện nội bộ qua Apache Kafka (runner GitLab bên ngoài không cần truy cập broker Kafka)
- [x] **[S]** Tự động sửa lỗi pipeline và đóng gói lại qua GitHub Actions Self-hosted Runner kết hợp cơ chế Incremental Build khi phát hiện error/warn log

### 5.2 Bản đồ kiến trúc tương tác & So sánh phiên bản

- [x] **[M]** Hiển thị bản đồ topo kiến trúc dạng Node-Edge tương tác (zoom, pan, lọc theo giao thức HTTP/Kafka/DB) bằng React Flow và tự động căn chỉnh bố cục bằng ELKjs
- [x] **[M]** Tra cứu chi tiết trên từng đỉnh (Service Node) và cạnh nối (Dependency Edge): hiển thị đường dẫn file, số dòng code gọi API và cấu trúc payload
- [x] **[S]** So sánh kiến trúc giữa 2 phiên bản commit/tag (Architecture Diff): tô màu các kết nối mới thêm, bị xóa hoặc có nguy cơ gây lỗi tương thích ngược (breaking changes)
- [x] **[C]** Xuất bản đồ kiến trúc ra định dạng Mermaid.js hoặc hình ảnh để đính kèm tự động vào mô tả Pull Request

### 5.3 Phân tích tác động & Cổng ngữ cảnh MCP cho AI Agent

- [x] **[M]** Truy vấn bán kính ảnh hưởng (Blast Radius): chọn một API endpoint hoặc Kafka topic để liệt kê toàn bộ các upstream/downstream services bị tác động qua nhiều tầng
- [x] **[M]** Cung cấp MCP Server (Model Context Protocol) tích hợp sẵn các tool (`get_service_topology`, `analyze_breaking_change`, `get_topic_subscribers`) cho Claude Code và Codex
- [x] **[M]** Xuất gói ngữ cảnh kiến trúc rút gọn (`ai-architecture-context.json`) theo từng phạm vi tính năng, đính kèm làm artifact của CI để AI Agent ngoài máy local (vd: phiên cloud) vẫn đọc được mà không cần gọi MCP Server

### 5.4 Kiểm thử tích lũy Playwright Trace & Bảo mật Claude Security

- [x] **[M]** Thực thi kiểm thử E2E tích lũy bằng Playwright sau mỗi đợt cập nhật codebase (cộng dồn toàn bộ test case cũ và mới)
- [x] **[M]** Đóng gói báo cáo HTML kèm dữ liệu Playwright Trace Viewer theo từng version vào thư mục `testing/versions/` và MinIO, cho phép xem lại trực tiếp trên giao diện web
- [x] **[M]** Quét lỗ hổng bảo mật và điểm yếu hệ thống tự động bằng Claude Security sau mỗi lần thay đổi code, lưu báo cáo và theo dõi trạng thái vá lỗi

### 5.5 Tính năng thông minh Đa mô hình AI — đề xuất khác biệt

- [x] **[C]** Trợ lý phân tích kiến trúc hỗ trợ chuyển đổi linh hoạt giữa 4 mô hình AI: **Claude, ChatGPT, Gemini, và Grok** (triển khai theo lộ trình: bắt đầu 1 provider qua interface `AiProvider`, thêm các provider còn lại sau MVP)
- [x] **[C]** Tự động sinh giải pháp tái cấu trúc (refactoring) khi phát hiện phụ thuộc vòng (circular dependency) hoặc nghẽn cổ chai giữa các microservice

## 6. User Stories tiêu biểu

- Là **lập trình viên mới (fresher)**, tôi muốn nhìn thấy sơ đồ tổng thể các microservice và luồng Kafka topic được cập nhật theo đúng nhánh `main` hiện tại để hiểu hệ thống ngay trong ngày đầu nhận việc.
- Là **kỹ sư phát triển sử dụng AI Agent (Claude Code / Codex)**, tôi muốn AI tự động truy vấn MCP Server của DevMapper để biết rõ những repo nào đang gọi API tôi sắp sửa, nhằm tránh làm hỏng các service khác.
- Là **Tech Lead**, tôi muốn đối chiếu sự thay đổi kiến trúc giữa các phiên bản và nhờ các mô hình AI (Claude/ChatGPT/Gemini/Grok) đánh giá rủi ro trước khi phê duyệt thiết kế.
- Là **Quản trị viên hệ thống (Platform Admin)**, tôi muốn xem lại bản preview HTML từ Trace Viewer của Playwright và báo cáo lỗ hổng Claude Security của từng bản build để đảm bảo hệ thống luôn an toàn, ổn định.

## 7. Đề xuất công nghệ

| Lớp | Công nghệ | Lý do / Ghi chú | Triển khai (Local / Cloud) |
|---|---|---|---|
| Frontend | React + Vite | SPA nội bộ tốc độ cao, kết hợp TypeScript đảm bảo an toàn kiểu dữ liệu khi xử lý cấu trúc đồ thị phức tạp | Client (trình duyệt); dev server chạy local |
| Đồ thị kiến trúc | React Flow (`@xyflow/react`) + ELKjs | Vẽ bản đồ kiến trúc node-edge tương tác đa tầng; kết hợp thuật toán ELKjs để tự động tính toán tọa độ bố cục đồ thị không bị chồng chéo | Client (trình duyệt) |
| Biểu đồ thống kê | Recharts + Mermaid.js | Recharts vẽ biểu đồ thống kê sức khỏe kiến trúc, số lượng test case tích lũy và lỗ hổng Claude Security; Mermaid.js xuất sơ đồ văn bản cho tài liệu Markdown | Client (trình duyệt) |
| Form & State | React Hook Form + Zustand | Quản lý trạng thái bộ lọc đồ thị (theo nhánh, giao thức, mức độ rủi ro) và các biểu mẫu cấu hình hệ thống | Client (trình duyệt) |
| Styling | TailwindCSS + ShadCN | Thiết kế giao diện hiện đại, nhẹ, hỗ trợ TypeScript thuần và tuân thủ quy tắc đóng gói component dùng chung tại `client/src/lib/` | Client; build chạy local |
| Package manager & Runtime | Bun | Công cụ chính của toàn bộ frontend: cài gói (`bun install`, lockfile `bun.lock`), chạy dev server và script (`bun run dev`, `bunx --bun vite`), thay npm/Node cho thao tác hằng ngày. Giữ Node LTS (máy hiện có v24) cài sẵn làm phương án dự phòng cho công cụ chưa chạy ổn trên Bun (kiểm tra khi khởi tạo client, vd: Playwright, Dependency-Cruiser) | Local (công cụ phát triển) |
| Linter kiến trúc | Dependency-Cruiser | Khóa cứng kiến trúc phân tầng đơn bước ở client (`Page -> Component -> Hook -> API`), chạy qua `bunx` trong bước lint | Local (lint, CI) |
| Cache trạng thái UI | TanStack Query | Tự động hóa việc tải dữ liệu đồ thị, lưu bộ nhớ đệm phía client và đồng bộ trạng thái bản đồ từ API máy chủ | Client (trình duyệt) |
| Kiểm thử E2E | Playwright (kèm Trace Viewer) | Chạy kiểm thử E2E tích lũy tăng dần trên trình duyệt thật sau mỗi thay đổi code; trích xuất gói HTML Trace Viewer lưu theo từng version trong thư mục `testing/` | Local (laptop/runner); báo cáo có thể sao lưu lên cloud |
| Bảo mật & Rà soát | Claude Security (plugin `claude-security`) | Quét lỗ hổng tĩnh trong phiên Claude Code ở mức effort chọn trước, mỗi phát hiện được kiểm chứng chéo trước khi vào báo cáo (`CLAUDE-SECURITY-RESULTS.md/.jsonl/.sarif`); chạy sau mỗi đợt cập nhật mã nguồn | Cloud (model Claude chạy qua Claude Code, mã nguồn được gửi tới API Anthropic); công cụ chạy trong phiên local |
| Backend | Spring Boot (Microservices) | Tách thành 4 Core Microservices (`scanner-service`, `topology-service`, `ai-mcp-service`, `quality-gov-service`) và 1 API Gateway, giúp tối ưu cô lập lỗi và quản lý bởi đội ngũ AI Agent | Local (container trên laptop) |
| Phân tích mã tĩnh | Tree-sitter + OpenAPI/AsyncAPI Parser | Phân tích cây cú pháp trừu tượng (AST) đa ngôn ngữ và đọc các file đặc tả để tự động phát hiện điểm gọi API/Kafka từ source code | Local (scanner-cli trên runner CI tự host) |
| Bảo mật tầng API | Spring Security | Xác thực JWT do Keycloak phát hành cho mọi request; kiểm soát phân quyền RBAC chặt chẽ ngay tại tầng API của API Gateway và các microservices | Local (trong từng service) |
| Build tool & CI/CD | Gradle + GitHub Actions (tự host trên PC) | Hỗ trợ Incremental Build (biên dịch gia tăng) kết hợp Runner tự host, giúp AI Agent tự động vá lỗi (auto-fix) và build lại cực nhanh | Local (runner tự host); điều phối workflow trên GitHub (cloud) |
| Database | PostgreSQL (4 Schemas riêng biệt) | Tự host 1 container PostgreSQL trên PC nhưng chia 4 schema (`scanner_db`, `topology_db`, `ai_db`, `gov_db`) đảm bảo quy tắc Database-per-Service của Microservices | Local (dữ liệu nhạy cảm); sao lưu mã hóa lên cloud |
| ORM & Migration | MyBatis + Flyway | Kiểm soát tối ưu các câu truy vấn SQL đệ quy phức tạp (`WITH RECURSIVE`) trên đồ thị thông qua MyBatis; quản lý migration độc lập cho từng schema | Local (thư viện trong service) |
| Cache hệ thống | Redis (tự host trên PC) | Lưu bộ nhớ đệm cho đồ thị tổng (`global-graph`), kết quả truy vấn MCP và quản lý giới hạn tần suất gọi API (Rate Limiting) | Local (cache tái tạo được) |
| Luồng sự kiện | Apache Kafka KRaft (tự host trên PC) | Giao tiếp bất đồng bộ giữa các microservices nội bộ (vd: `scanner-service` quét xong → `topology-service`); CI bên ngoài chỉ gọi Ingestion API, không truy cập Kafka trực tiếp | Local (không đưa lên cloud; cân nhắc bỏ/thay ở MVP để tiết kiệm RAM) |
| IAM / SSO | Keycloak (tự host trên PC) | Quản lý định danh tập trung, Realm, phân quyền người dùng và phát hành token chuẩn OIDC/OAuth2 cho cả Web App lẫn VPN | Local; hoặc dịch vụ định danh cloud nếu RAM không đủ (Phase 2) |
| Truy cập từ xa (tùy chọn, Phase 2+) | NetBird Cloud | Máy chủ điều phối do NetBird vận hành nên không cần VPS; laptop là một thiết bị trong mạng và người kiểm thử cài NetBird client để truy cập. MVP vẫn bind `127.0.0.1`; khi bật truy cập từ xa thì xuất bản thêm cổng trên địa chỉ NetBird (WireGuard Zero-Trust). Gói miễn phí giới hạn số người dùng, kiểm tra lại khi triển khai | Cloud (NetBird Cloud) |
| Lưu trữ đối tượng | MinIO (tự host trên PC) | Lưu trữ qua giao thức S3 các file kết quả quét AST JSON, báo cáo chi tiết của Claude Security và toàn bộ gói tài nguyên HTML Trace Viewer của Playwright | Local (dữ liệu nhạy cảm); sao lưu mã hóa lên cloud |
| Email / SMTP | Brevo | Kết nối với Keycloak và Backend qua SMTP để gửi email xác thực tài khoản và cảnh báo khi phát hiện thay đổi kiến trúc gây lỗi | Cloud (dịch vụ SMTP bên ngoài) |
| Đa mô hình AI & MCP | Claude, ChatGPT, Gemini, Grok + MCP SDK | Kết nối cả 4 nền tảng AI lớn phục vụ phân tích tác động kiến trúc; cung cấp MCP Server chuẩn hóa ngữ cảnh cho AI Coding Agent | Cloud (API của các nhà cung cấp AI); MCP Server chạy local |
| Reverse Proxy / TLS (tùy chọn, Phase 2+) | Traefik | Chỉ cần khi mở truy cập từ xa: định tuyến theo tên miền, chứng chỉ TLS tự động; MVP gọi thẳng `localhost` | Local, chỉ khi cần (Phase 2+) |

_Local = container/công cụ chạy trên laptop; Cloud = dịch vụ bên ngoài; Client = chạy trong trình duyệt của người dùng._

## 8. Rủi ro và Giả định

- **Giả định:** Các microservice trong hệ thống tuân thủ các mẫu giao tiếp tiêu chuẩn (REST/HTTP, gRPC, Kafka) hoặc khai báo biến môi trường nhất quán trong cấu hình repo.
- **Rủi ro tài nguyên phần cứng trên PC:** Máy chủ là laptop Razer Blade 14 (2016: i7-6700HQ 4 nhân, 16 GB RAM, không nâng cấp được) nên phải giới hạn bộ nhớ vùng Docker (~6 GB qua `.wslconfig`), tắt chế độ ngủ khi cắm điện và không chạy E2E khi toàn bộ stack đang bật. Việc tự host đồng thời PostgreSQL, Redis, Kafka, Keycloak, MinIO và chạy Playwright trên cùng một PC có thể gây quá tải RAM → thiết lập giới hạn bộ nhớ (`mem_limit`) chặt chẽ cho từng container, dùng Kafka ở chế độ KRaft và chia nhỏ hệ thống thành Microservices để tối ưu.
- **Rủi ro định tuyến đường truyền động (Dynamic URL resolution):** Một số lệnh gọi HTTP ghép chuỗi động lúc runtime có thể khó bóc tách 100% bằng phân tích tĩnh → cần kết hợp đọc cả file cấu hình (`application.yml`, `.env`) để nội suy đích đến.
- **Rủi ro AI Agent ngoài mạng NetBird:** MCP Server chạy trên laptop (localhost) nên các phiên AI Agent chạy ngoài máy (vd: phiên cloud) không gọi được → phát hành `ai-architecture-context.json` làm artifact CI (mục 5.3) như đường dự phòng.
- **Giới hạn kiểm thử bảo mật:** Claude Security là phân tích tĩnh mã nguồn, không tấn công ứng dụng đang chạy → chưa có kiểm thử xâm nhập động; bù bằng Playwright E2E ở các luồng xác thực/phân quyền, và xem xét công cụ pentest động (vd: Strix, cần khóa LLM trả phí) ở giai đoạn sau.
- **Rủi ro bảo mật mã nguồn:** Dữ liệu cấu trúc mã nguồn và báo cáo lỗ hổng từ Claude Security rất nhạy cảm → bắt buộc chỉ bind `127.0.0.1` (MVP), thêm NetBird khi mở truy cập từ xa, và kiểm soát quyền qua Keycloak.