# contracts/ — Hợp đồng giao tiếp

Thư mục này chứa các bản mô tả bằng văn bản về dạng dữ liệu mà các phần của DevMapper trao đổi với nhau. Mỗi file nói rõ một thông điệp gồm những trường nào, kiểu gì, và gửi từ đâu đến đâu.

| File | Mô tả |
|---|---|
| `ast-manifest.schema.json` (+ `examples/`) | Schema JSON của bản quét kiến trúc mà `scanner-cli` gửi từ CI |
| `ingestion-api.openapi.yaml` | API nạp dữ liệu của `scanner-service` (nạp manifest, admin, nội bộ) |
| `kafka-events.md` | Sự kiện Kafka nội bộ từ `scanner-service` sang `topology-service` |
| `mcp-tools.md` | Các công cụ MCP cho AI Agent và định dạng `ai-architecture-context.json` |

## Mục đích

Để các service và agent làm việc song song mà không lệch nhau. Mỗi bên chỉ cần tuân theo hợp đồng, không cần đọc mã của bên kia.

## Quy tắc

- Chỉ `Opus Architect` được thêm hoặc sửa file trong thư mục này.
- `Sonnet Executor` không sửa. Nếu mã và hợp đồng không khớp, dừng lại và báo lên `Haiku Router` (lỗi Tier 2) để `Opus Architect` quyết định.
- Mọi thay đổi hợp đồng phải được ghi vào `markdown/CHANGELOG.md`.
