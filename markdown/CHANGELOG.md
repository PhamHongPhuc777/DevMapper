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
