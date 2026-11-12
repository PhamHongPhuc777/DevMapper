@AGENTS.md

# CLAUDE.md — Bản tương đương AGENTS.md cho Claude Code (Team 100% Claude)

Mọi quy tắc kiến trúc, 18 tiêu chuẩn tối ưu, kỹ năng bắt buộc và quy chuẩn tài liệu ở `AGENTS.md` (Mục 2–4) được nạp qua dòng `@AGENTS.md`. File này **chỉ ghi đè Mục 1** (đội ngũ Harness) bằng model Claude cụ thể; khi mâu thuẫn, file này thắng.

## 1. Ánh xạ model cố định

| Vai trò | `@ModelTier` | `model:` | `effort:` | File định nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| `Opus Architect` | ARCHITECT | `opus` | `medium` | `.claude/agents/opus-architect.md` |
| `Haiku Router` | ROUTER | `haiku` | `low` | `.claude/agents/haiku-router.md` |
| `Haiku Monitor` | ROUTER | `haiku` | `low` | `.claude/agents/haiku-monitor.md` |
| `Sonnet Executor` | EXECUTOR | `sonnet` | `high` → `xhigh` | `.claude/agents/sonnet-executor.md` |

Khi Harness sinh/sửa đội ngũ, **bắt buộc** giữ `model:` và `effort:` đúng bảng trên (không để Harness tự chọn tier, không dùng `inherit`). Thất bại sau 2 lần → spawn lại đúng 1 `sonnet-executor` với `model: opus`; muốn `xhigh` thì chỉ định lúc spawn.

Luồng: phiên chính điều phối → `opus-architect` lập kế hoạch → **dừng chờ Chủ dự án confirm** → `haiku-router` (spawn `sonnet-executor` song song) → `[REVIEW_PENDING]` → `opus-architect` nghiệm thu. `opus-architect` chỉ chạy lúc lập kế hoạch, lỗi Tier 2 và nghiệm thu (tiết kiệm quota Opus). Chi tiết từng bước nằm trong skill `devmapper-orchestrator`.

## 2. Môi trường chạy

- **Local (CLI):** có đủ plugin/skill/MCP cá nhân (Harness, Headroom, Ponytail, Claude Security, Graphify, UI-UX-Pro-Max, Context7 qua connector).
- **Cloud session** nạp từ 3 nguồn:
  1. Những gì **commit trong repo** (`CLAUDE.md`, `.claude/agents|skills`, `.mcp.json`): đội ngũ trong `.claude/` luôn chạy.
  2. **Plugin cấp tài khoản claude.ai** đã bật: Harness, Ponytail, Claude Security.
  3. **Setup script của môi trường `Buffoon777`** cài ở user scope: Graphify, UI-UX-Pro-Max, Headroom (chỉ MCP, công cụ hoãn nạp: nạp schema bằng ToolSearch trước khi gọi). Chi tiết và nội dung script ở `markdown/SETUP.md`. Môi trường `Default` không có script này.
  Context7 dùng qua connector claude.ai (repo chưa có `.mcp.json`).
- Bun lỗi proxy khi cài gói trong cloud → dùng `npm` trong SessionStart hook.

## Harness: DevMapper

**Mục tiêu:** Phát triển DevMapper theo `AGENTS.md` bằng đội ngũ Opus Architect / Haiku Router / Haiku Monitor / Sonnet Executor chạy 100% model Claude.

**Hạ tầng bắt buộc:** không cần bật `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`.

**Điều kiện gọi:** khi được yêu cầu khởi tạo ứng dụng, thêm/sửa tính năng hay module, nghiệm thu code hoặc hỏi tiến độ đội ngũ, dùng skill `devmapper-orchestrator`. Câu hỏi đơn giản thì trả lời trực tiếp.

**Lịch sử thay đổi:**
| Ngày | Nội dung | Đối tượng | Lý do |
| :--- | :--- | :--- | :--- |
| 2026-11-03 | Dựng đội ngũ Harness v2 lần đầu | `.claude/agents/*`, `.claude/skills/devmapper-orchestrator` | Bản Claude-only của AGENTS.md |
| 2026-11-03 | Đổi tên agent theo model Claude (Opus Architect, Haiku Router, Haiku Monitor, Sonnet Executor) | `.claude/agents/*`, skill, `AGENTS.md` | Gần với môi trường Claude hiện dùng |
| 2026-11-12 | Sửa Mục 2: cloud nạp plugin tài khoản và kỹ năng do setup script cài | `CLAUDE.md`, `markdown/SETUP.md` | Mô tả cũ ("cloud không nạp plugin") không còn đúng |
