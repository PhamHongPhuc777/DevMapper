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
