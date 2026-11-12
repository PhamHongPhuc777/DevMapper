## **2026-11-03** -- Dựng đội ngũ Claude-only và rà soát tài liệu

Thêm `CLAUDE.md` (import `AGENTS.md`, ánh xạ cố định Opus/Haiku/Sonnet), `.claude/agents/{sol-goc,sol-chinh,sol-phu,luna}.md`, skill `devmapper-orchestrator`, `.gitignore`.

`AGENTS.md`: điền toàn bộ placeholder theo stack trong PRD; cho phép đánh dấu `N/A + lý do` với các tiêu chí tối ưu không phù hợp công cụ nội bộ 1 PC; sửa mô tả Ponytail (plugin, không có MCP Server).

`PRD.md`/`SRS.md`: CI gửi kết quả quét qua HTTPS Ingestion API thay vì Kafka trực tiếp; `ai-architecture-context.json` nâng lên Must-have; đa mô hình AI chuyển sang Phase 3 (Could-have); thêm rủi ro AI Agent ngoài mạng NetBird; cấm FK xuyên schema.

`ERD.md`: đóng khối mermaid bị thiếu; bỏ thực thể hạ tầng khỏi sơ đồ; thêm bảng phân bổ bảng theo schema (đề xuất).

`README.md`: chuyển từ UTF-16 sang UTF-8 và thêm liên kết tài liệu.

## **2026-11-03** -- Đổi tên đội ngũ theo model Claude

Đổi tên agent: `Sol Gốc` → `Opus Architect` (`opus-architect`), `Sol Chính` → `Haiku Router` (`haiku-router`), `Sol Phụ` → `Haiku Monitor` (`haiku-monitor`), `Luna` → `Sonnet Executor` (`sonnet-executor`). Đổi tên file trong `.claude/agents/`, cập nhật `AGENTS.md`, `CLAUDE.md`, skill `devmapper-orchestrator`, `SRS.md`, `ERD.md`, `PLAN.md`.

`AGENTS.md` Mục 1.0: bỏ các cột Codex/OpenAI và Gemini, chỉ còn model Claude. Các mục lịch sử phía trên giữ nguyên tên cũ.

## **2026-11-03** -- Hook ghi sự kiện agent và sửa mô tả Haiku Monitor

Thêm `.claude/settings.json` (hook `SubagentStart`/`SubagentStop`), `.claude/hooks/subagent-event.mjs` (ghi `_workspace/logs/events.jsonl` kèm timestamp) và `.claude/hooks/timeline.mjs` (in bảng trạng thái + dòng thời gian). Đã chạy thử với một subagent thật: ghi đủ START/STOP.

`Haiku Monitor` chạy script thay vì tự tính thời gian. `AGENTS.md` Mục 1.3 đổi từ "thời gian thực, cập nhật liên tục, tab riêng" sang "ảnh chụp theo yêu cầu + log theo mục riêng".

## **2026-11-03** -- Thay Strix bằng Claude Security

Cài `claude-security@claude-plugins-official`. `AGENTS.md` Mục 3–4, `CLAUDE.md`, skill `devmapper-orchestrator`, `PRD.md`, `SRS.md`, `ERD.md` đổi từ Strix sang Claude Security; bảng `STRIX_SECURITY_REPORT` đổi thành `SECURITY_REPORT`. Thêm rủi ro "chưa có pentest động" vào `PRD.md` Mục 8. `SETUP.md` ghi rõ Headroom không được đặt `ANTHROPIC_BASE_URL` để giữ Remote Control.

## **2026-11-03** -- PRD: Bun là package manager và runtime chính của frontend

`PRD.md` Mục 7: tách dòng "Runtime & Linter" thành "Package manager & Runtime (frontend)" (Bun, Node LTS dự phòng) và "Linter kiến trúc" (Dependency-Cruiser).

## **2026-11-04** -- Bỏ Lighthouse khỏi cổng bắt buộc; chạy local không VPS

`AGENTS.md`: tiêu chí 18 đổi thành Accessibility & bundle budget (`axe` + ngân sách bundle), Lighthouse chỉ thủ công; bỏ Lighthouse khỏi Mục 3 và `TESTING.md`; bối cảnh dự án đổi từ "qua VPN NetBird" sang "qua localhost". `PRD.md`/`SRS.md`: bỏ VPS, NetBird và Traefik thành tùy chọn Phase 2, mọi cổng bind `127.0.0.1`, thêm rủi ro phần cứng laptop. `PLAN.md` và `SETUP.md` ghi các mục cần chỉnh và việc cần làm trên máy.

## **2026-11-04** -- PRD: đổi nhãn dòng Bun

`PRD.md` Mục 7: dòng "Package manager & Runtime (frontend)" đổi thành "Package manager & Runtime"; nội dung dòng vẫn nói Bun dùng cho frontend.

## **2026-11-04** -- PRD: cột Triển khai (Local / Cloud) và NetBird Cloud

`PRD.md` Mục 7: thêm cột "Triển khai (Local / Cloud)" cho từng dòng công nghệ; dòng NetBird đổi sang NetBird Cloud (không cần VPS). `SRS.md` Mục 2.2 cập nhật tương ứng.

## **2026-11-04** -- Thêm contracts/README.md

Thêm `contracts/README.md` mô tả mục đích, danh sách file và quy tắc thay đổi của thư mục hợp đồng giao tiếp.

## **2026-11-04** -- Giám sát agent: màu, phân cấp, việc đang làm, tương tác

`.claude/agents/*.md` thêm `color:` theo vai trò (tím, xanh dương, lục lam, cam). `.claude/settings.json` thêm hook `PreToolUse` (Edit|Write|Agent|Bash|PowerShell) và `subagent-event.mjs` ghi tên công cụ + đường dẫn file hoặc agent được gọi (không ghi lệnh Bash). `timeline.mjs` thêm bảng phân cấp có thanh thời gian, cột việc đang làm, danh sách ai gọi ai, cờ `--color` và `--watch`. Đã kiểm thử với một subagent thật. `AGENTS.md` Mục 1.3 và `haiku-monitor.md` cập nhật tương ứng.

## **2026-11-04** -- SRS: phạm vi Playwright chỉ là kiểm thử client của DevMapper

`SRS.md`: bỏ Playwright khỏi phạm vi sản phẩm, vai trò Platform Admin và FR-4 (FR-4 chỉ còn báo cáo bảo mật Claude Security); thêm NFR-5 nêu rõ Playwright chỉ kiểm thử client frontend của DevMapper, báo cáo là artifact quy trình phát triển, không phải màn hình trong ứng dụng.

## **2026-11-04** -- Căn chỉnh Playwright thành công cụ phát triển

`PRD.md`: bỏ các tính năng, vai trò và user story xem Playwright Trace trong ứng dụng; mục 5.4 chỉ còn Bảo mật Claude Security; dòng Playwright và MinIO ở Mục 7 chỉnh lại. `ERD.md`: bỏ bảng `TEST_TRACE_ARTIFACT` khỏi sơ đồ và bảng phân bổ schema. `AGENTS.md` Mục 3: Playwright dùng `trace: 'retain-on-failure'`, báo cáo của test lỗi lưu ở `testing/versions/`.

## **2026-11-05** -- Phân trang theo kiểu dữ liệu; Platform Admin không dùng Claude Security

`AGENTS.md` tiêu chí 10: chọn kỹ thuật phân trang theo kiểu dữ liệu cần liệt kê rồi render; danh sách lớn có thứ tự thời gian hoặc chỉ-thêm ưu tiên `Cursor-based` (keyset) kết hợp `Time-windowed`, `Offset-based` chỉ cho danh sách nhỏ ổn định, kỹ thuật từng kiểu dữ liệu ghi trong `PLAN.md`. `PRD.md` và `SRS.md`: Platform Admin không còn dùng Claude Security (Claude Security là công cụ giai đoạn lập trình); user story của Platform Admin đổi sang quản lý cụm repo và phân quyền.

## **2026-11-05** -- Loại chuỗi Claude Security khỏi sản phẩm

`PRD.md`: bỏ mục 5.4 Bảo mật Claude Security (Đa mô hình AI thành 5.4), bỏ khỏi biểu đồ thống kê, MinIO và rủi ro dữ liệu; dòng công cụ ghi rõ là công cụ giai đoạn lập trình. `SRS.md`: FR-4 đánh dấu đã loại bỏ (giữ số hiệu), NFR-1 chỉ còn rà soát khi lập trình. `ERD.md`: bỏ bảng `SECURITY_REPORT`.

## **2026-11-05** -- Đổi tên governance-service; thêm DESIGN_BRIEF.md

`quality-gov-service` đổi thành `governance-service` (schema vẫn là `gov_db`) trong `PRD.md`, `SRS.md`, `ERD.md`, `PLAN.md`, vì dịch vụ chỉ còn quản trị truy cập (vai trò, quyền, yêu cầu truy cập, audit, thông báo). Thêm `markdown/DESIGN_BRIEF.md`: bản mô tả cho Claude Design đã bỏ màn hình test trace/báo cáo bảo mật và biểu đồ liên quan, thêm phân trang con trỏ kèm cửa sổ thời gian cho bảng snapshot.

## **2026-11-12** -- Đổi tên gov_db thành users_db, governance-service thành user-service

`gov_db` đổi thành `users_db` và `governance-service` thành `user-service` trong `PRD.md`, `SRS.md`, `ERD.md`, `PLAN.md`, vì schema chủ yếu chứa dữ liệu người dùng (người dùng, vai trò, quyền, yêu cầu truy cập) kèm audit log và thông báo gắn với `user_id`. Bảng `USER` là hồ sơ ứng dụng đồng bộ từ Keycloak; thông tin đăng nhập vẫn do Keycloak giữ. Các mục lịch sử trong `CHANGELOG.md` giữ tên cũ.

## **2026-11-12** -- Quy tắc Git cho phiên cloud

`AGENTS.md` Mục 4 (Git Commit): phiên local giữ nguyên (Chủ dự án tự push/pull, trừ khi yêu cầu agent push); phiên cloud chỉ push lên nhánh làm việc, không push thẳng `main`, Chủ dự án merge.
