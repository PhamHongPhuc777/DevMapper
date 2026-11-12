## **2026-11-03** -- Cài đặt công cụ cho đội ngũ Agent (máy local)

Đã cài (user scope, `~/.claude`):

- `harness@harness-marketplace` 2.1.0 — sinh đội ngũ agent/skill (marketplace `revfactory/harness`).
- `headroom@headroom-marketplace` 0.42.0 — nén ngữ cảnh; MCP `headroom` đã cấu hình sẵn trong `~/.claude/settings.json`.
- `claude-security@claude-plugins-official` 0.12.0 — quét lỗ hổng tĩnh trong phiên Claude Code, thay cho Strix. Chạy `/claude-security`; nên dùng Opus 5.5 hoặc Fable 5.1; mỗi lần quét tốn hạn mức phiên và hỏi xác nhận chi phí trước.
- Skill `ui-ux-pro-max` đã có sẵn trong `~/.agents/skills`; Context7 dùng qua connector claude.ai.

Plugin chỉ nạp sau khi khởi động lại phiên Claude Code. Phiên cloud không nạp plugin nên không có Claude Security/Harness/Headroom.

## **2026-11-03** -- Headroom và Remote Control

Remote Control yêu cầu phiên nói chuyện trực tiếp với `api.anthropic.com`; đặt `ANTHROPIC_BASE_URL` sang host khác (kể cả proxy Headroom chạy trong Docker) sẽ tắt Remote Control. Do đó:

- Dùng Headroom ở chế độ MCP/plugin (hiện tại), KHÔNG chạy `headroom wrap claude`, `headroom init` cho Claude hay `headroom install` cho Claude trên máy dùng Remote Control.
- Kiểm tra định kỳ bằng `headroom doctor`: dòng `claude` phải là `not routed`.
- Nếu muốn nén sâu bằng proxy, chạy phiên đó tách riêng (không bật Remote Control) hoặc chuyển việc dài sang phiên cloud (`claude --cloud`).

## **2026-11-03** -- Hoãn Strix

Strix (pentest động, cần Docker + khóa LLM trả phí qua `STRIX_LLM`/`LLM_API_KEY`) tạm hoãn đến khi có service chạy được; CLI `strix` 1.7.0 vẫn còn cài trên máy (`uv tool uninstall strix-agent` để gỡ). Khóa API chưa được tạo.

Chưa hoàn tất: Docker Desktop chưa chạy (cần cho Postgres/Redis/Kafka/MinIO khi bắt đầu code); `gradle` chưa có trên PATH (dùng Gradle wrapper khi khởi tạo service).

## **2026-11-04** -- Chạy toàn bộ trên laptop (không VPS)

Máy chủ: Razer Blade 14 (2016), i7-6700HQ 4 nhân/8 luồng, 16 GB RAM (không nâng cấp được), khoảng 430 GB ổ trống trên C: và D:.

Cần làm một lần (do Chủ dự án, chưa được thực hiện hộ):

- Giới hạn bộ nhớ vùng Docker/WSL2: tạo `C:\Users\Admin\.wslconfig` với `[wsl2]` và `memory=6GB`, rồi chạy `wsl --shutdown`.
- Tắt chế độ ngủ khi cắm điện và đặt "đóng nắp = không làm gì" (Remote Control và runner CI cần máy luôn thức).
- Khởi động Docker Desktop trước khi chạy compose hoặc Testcontainers.
- Luôn cắm sạc khi build dài để tránh giảm xung nhịp.

Windows 10 đã hết hỗ trợ tiêu chuẩn từ tháng 10/2025: giữ mọi dịch vụ bind `127.0.0.1`, không mở cổng ra ngoài.

## **2026-11-12** -- Phiên cloud: setup script cài Graphify, UI-UX-Pro-Max, Headroom

Môi trường cloud `Buffoon777` (môi trường cá nhân, không gắn repo) có setup script chạy mỗi khi container được dựng mới. Mọi repo mở trong môi trường này đều thấy ba kỹ năng ở user scope (`~/.claude/skills/`), không cần commit vào repo. Phần cài trên máy local (mục 2026-11-03) giữ nguyên.

- Graphify 0.9.106 (gói `graphifyy` trên PyPI): CLI `graphify` và skill `/graphify`. Lệnh `graphify install --platform claude` cũng tạo `~/.claude/CLAUDE.md` mức người dùng, chỉ chứa dòng kích hoạt `/graphify`.
- Headroom 0.44.0: chỉ chế độ MCP (`headroom mcp install --agent claude`, cần extra `[mcp]`). Không chạy `headroom wrap` hay `headroom init claude`, không đặt `ANTHROPIC_BASE_URL`, cùng lý do Remote Control ở mục "Headroom và Remote Control". Công cụ MCP là công cụ hoãn nạp: phải nạp schema bằng ToolSearch trước khi gọi.
- UI-UX-Pro-Max 2.2.3 (`uipro-cli`): chạy installer trong thư mục tạm rồi chép `ui-ux-pro-max` vào `~/.claude/skills/` (dữ liệu CSV và 3 script Python, đã đọc, không gọi mạng).
- Claude Security: plugin cấp tài khoản claude.ai (đã bật), không nằm trong setup script.

Giới hạn:

- Chỉ phiên chạy trên môi trường `Buffoon777` có ba kỹ năng này; môi trường `Default` không có script.
- Script chạy khi container dựng mới, không chạy khi resume. Mỗi bước lỗi chỉ in `setup warn:` để không chặn việc khởi động phiên, nên thiếu công cụ thì đọc output của script.
- Đã kiểm chứng: script chạy trọn vẹn (exit 0) trong phiên đã có và một phiên mới liệt kê được công cụ Headroom. Chưa kiểm chứng: gọi thử từng công cụ trong phiên mới (`headroom_compress`, `/graphify`, `ui-ux-pro-max`).
- Phiên bản được ghim; muốn nâng cấp thì sửa script trong cài đặt môi trường (menu môi trường ở thanh tiêu đề phiên, chọn Edit).

Nội dung script:

```bash
#!/bin/bash
# Cài kỹ năng dùng chung cho mọi repo: Graphify, UI-UX-Pro-Max, Headroom (chỉ MCP).
# Idempotent; mỗi bước lỗi chỉ cảnh báo để không chặn việc khởi động phiên.
export PATH="$HOME/.local/bin:$PATH"
step() { "$@" || echo "setup warn: '$*' failed"; }

# 1. Graphify: CLI + skill ở ~/.claude/skills/graphify (mọi repo đều thấy)
step uv tool install --force graphifyy==0.9.106
step graphify install --platform claude

# 2. Headroom: chỉ chế độ MCP, KHÔNG wrap/init claude (tránh đặt ANTHROPIC_BASE_URL)
step uv tool install --force 'headroom-ai[mcp]==0.44.0'
step headroom mcp install --agent claude

# 3. UI-UX-Pro-Max: chạy installer trong thư mục tạm rồi chép skill vào user scope
t=$(mktemp -d)
if (cd "$t" && npx --yes uipro-cli@2.2.3 init --ai claude) \
  && [ -d "$t/.claude/skills/ui-ux-pro-max" ]; then
  mkdir -p "$HOME/.claude/skills"
  rm -rf "$HOME/.claude/skills/ui-ux-pro-max"
  cp -r "$t/.claude/skills/ui-ux-pro-max" "$HOME/.claude/skills/"
  find "$HOME/.claude/skills/ui-ux-pro-max" -name __pycache__ -prune -exec rm -rf {} +
else
  echo "setup warn: uipro-cli failed"
fi
rm -rf "$t"
exit 0
```
