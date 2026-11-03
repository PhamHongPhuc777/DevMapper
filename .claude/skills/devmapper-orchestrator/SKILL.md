---
name: devmapper-orchestrator
description: Điều phối đội ngũ Opus Architect / Haiku Router / Haiku Monitor / Sonnet Executor để phát triển DevMapper theo AGENTS.md. Dùng khi Chủ dự án yêu cầu khởi tạo ứng dụng, thêm/sửa tính năng hoặc module, sửa lỗi xuyên module, nghiệm thu code, hoặc hỏi tiến độ đội ngũ; cũng dùng cho các yêu cầu tiếp theo như làm lại, cập nhật, bổ sung, chạy lại một module hoặc một bước. Không dùng cho câu hỏi đơn giản hay sửa một dòng.
---

# DevMapper Orchestrator

**Chế độ chạy: hỗn hợp** (phiên chính là điều phối viên; không dùng TeamCreate hay cờ thử nghiệm).

| Bước | Chế độ | Agent (model, effort) | Lý do |
| :--- | :--- | :--- | :--- |
| 1. Kế hoạch | Subagent | `opus-architect` (opus, medium) | Một kết quả, cần suy luận sâu |
| 2. Cổng xác nhận | Phiên chính | — | Chỉ Chủ dự án quyết định |
| 3. Thực thi | Subagent lồng 2 tầng | `haiku-router` (haiku, low) → nhiều `sonnet-executor` (sonnet, high) song song | Module độc lập, cần triage lỗi rẻ |
| 4. Tier 2 | Subagent | `opus-architect` | Chỉ gọi khi cần |
| 5. Nghiệm thu | Subagent | `opus-architect` | Đối chiếu chéo |
| Bất kỳ lúc | Subagent | `haiku-monitor` (haiku, low) | Hỏi tiến độ |

## Quy trình

**0. Kiểm tra trạng thái.** Có `_workspace/review/STATUS` → đọc nó để biết đang ở bước nào (`[REVIEW_PENDING]` → vào bước 5, `[REJECTED]` → quay bước 3 với danh sách refactor). Có `markdown/PLAN.md` đã được Chủ dự án confirm → bỏ qua bước 1–2 với yêu cầu nhỏ. Không có gì → chạy từ bước 1. Yêu cầu "chạy lại module X" → chỉ spawn lại sonnet-executor của X.

**1. Kế hoạch.** Spawn `opus-architect` với yêu cầu của Chủ dự án. Nó ghi `markdown/PLAN.md` + `contracts/`.

**2. Cổng xác nhận (bắt buộc).** Trình bày tóm tắt kế hoạch cho Chủ dự án và dừng. Nếu `opus-architect` báo cần env var/secret thủ công, hỏi: "Bạn muốn thiết lập cấu hình này luôn bây giờ hay để sau khi viết code xong?". Không viết code khi chưa có xác nhận.

**3. Thực thi.** Spawn `haiku-router` với: danh sách module, đường dẫn hợp đồng, yêu cầu. Nó tự spawn sonnet-executor theo module và triage lỗi. Khi trả về:
- báo cáo Tier 2 → bước 4; báo cáo `[REVIEW_PENDING]` → bước 5.

**4. Tier 2.** Spawn `opus-architect` chỉ với báo cáo tối giản của haiku-router; nhận chỉ thị sửa; spawn lại `haiku-router` kèm chỉ thị. Tối đa 3 vòng cùng một lỗi, sau đó dừng và báo Chủ dự án.

**5. Nghiệm thu.** Spawn `opus-architect` đọc `_workspace/review/diff.patch`. `[REJECTED]` → bước 3 với danh sách refactor. `[REVIEW_PASSED]` → chạy skill `claude-security` (scan changes, effort high), E2E tích lũy, ghi `markdown/CHANGELOG.md` / `TESTING.md` theo `AGENTS.md` Mục 3–4. Chủ dự án tự merge/push; không thêm `Co-Authored-By`.

## Truyền dữ liệu

Qua file trong `_workspace/` (đã gitignore): `logs/events.jsonl` (hook ghi tự động, có timestamp), `logs/sonnet-executor-<module>.log`, `review/diff.patch`, `review/STATUS`. Kế hoạch và hợp đồng nằm trong `markdown/` và `contracts/` (được commit). Worktree của sonnet-executor do phiên chính gộp sau khi `[REVIEW_PASSED]`.

## Xử lý lỗi

| Tình huống | Xử lý |
| :--- | :--- |
| Một sonnet-executor lỗi/không trả kết quả | Thử lại 1 lần; vẫn lỗi → bỏ qua module đó, ghi rõ trong báo cáo |
| Hết hạn mức, hết phiên đăng nhập, bị từ chối quyền | Không thử lại; ghi phần đã xong vào `_workspace/`, báo Chủ dự án |
| > nửa số sonnet-executor lỗi | Dừng, hỏi Chủ dự án có tiếp tục không |
| Dữ liệu mâu thuẫn giữa module | Giữ cả hai kèm nguồn, để `opus-architect` quyết |

## Kịch bản kiểm thử

- **Thường:** "Khởi tạo scanner-service theo PRD" → opus-architect ghi PLAN.md → Chủ dự án confirm → haiku-router spawn 1 sonnet-executor → test qua → `[REVIEW_PENDING]` → `[REVIEW_PASSED]`.
- **Lỗi:** sonnet-executor báo lệch hợp đồng DTO → haiku-router phân loại Tier 2, trả báo cáo → opus-architect sửa hợp đồng → sonnet-executor chạy lại; lần 3 vẫn lỗi → dừng báo Chủ dự án.
