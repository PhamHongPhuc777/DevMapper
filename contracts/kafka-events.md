# Hợp đồng sự kiện Kafka nội bộ (v1)

Chỉ dùng giữa các service trong mạng docker. CI bên ngoài không chạm Kafka.

## Quy ước chung

- Tên topic: `devmapper.<service-phát>.<sự-kiện>.v<major>`. Đổi phá vỡ tương thích thì tạo topic `.v2`, không sửa `.v1`.
- Value: JSON UTF-8 (`JacksonJsonSerializer`, tắt type header `spring.json.add.type.headers=false`; consumer đặt `spring.json.value.default.type` về record trong `libs/devmapper-contracts`).
- Trường chung bắt buộc: `event_id` (uuid, khóa khử trùng), `event_type`, `schema_version`, `occurred_at` (ISO-8601 UTC).
- Consumer phải idempotent; thêm trường mới là tương thích (consumer bỏ qua trường lạ: `FAIL_ON_UNKNOWN_PROPERTIES=false`).
- Lỗi xử lý: `DefaultErrorHandler` thử lại 3 lần (backoff 1s, 2s, 4s) rồi đẩy sang `<topic>.DLT` qua `DeadLetterPublishingRecoverer`. Lỗi validate (manifest hỏng, 404) là non-retryable, vào DLT ngay.

## `devmapper.scanner.snapshot-received.v1`

| Thuộc tính | Giá trị |
| :--- | :--- |
| Producer | `scanner-service` |
| Consumer | `topology-service` (group id `topology-service`) |
| Key | `repo_id` (giữ thứ tự theo repo) |
| Partitions / Retention | 3 / 7 ngày |
| DLT | `devmapper.scanner.snapshot-received.v1.DLT` (1 partition, 14 ngày) |

Phát khi: scanner-service đã lưu `scan_snapshot` (status `RECEIVED`) và object manifest trên MinIO. Phát thành công thì đổi status thành `PUBLISHED`. Job `@Scheduled` mỗi 60s phát lại các snapshot `RECEIVED` cũ hơn 60s (outbox tối giản dùng chính bảng `scan_snapshot`), nên consumer có thể nhận trùng.

```json
{
  "event_id": "0b6f6c7e-2c1a-4b7f-9a51-1f0f7e1c2d3a",
  "event_type": "SNAPSHOT_RECEIVED",
  "schema_version": "1",
  "occurred_at": "2026-11-03T08:00:02Z",
  "snapshot_id": "5d1e0c55-4a1b-4f7e-8f0a-6b2c9d8e7f10",
  "group_id": "9a0b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d",
  "group_name": "shop",
  "repo_id": "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
  "repo_name": "order-service",
  "branch": "main",
  "is_default_branch": true,
  "commit_sha": "3f2a9c1d4e5b6a7980c1d2e3f4a5b6c7d8e9f0a1",
  "received_at": "2026-11-03T08:00:01Z",
  "manifest_object_key": "manifests/1c2d3e4f-.../5d1e0c55-....json",
  "manifest_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "manifest_size_bytes": 18234
}
```

| Trường | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| `snapshot_id` | uuid | Khóa logic sang `scanner_db.scan_snapshot`, topology dùng làm PK `topology_snapshot` |
| `group_id`, `group_name` | uuid, string | topology lưu vào `group_view` để MCP tra theo tên |
| `repo_id`, `repo_name` | uuid, string | |
| `branch`, `is_default_branch` | string, bool | Chỉ snapshot nhánh mặc định mới được làm head của đồ thị |
| `received_at` | date-time | Chống đảo thứ tự: chỉ thay head khi `received_at` mới hơn head hiện tại |
| `manifest_object_key` | string | Chỉ để truy vết; topology KHÔNG đọc MinIO trực tiếp |
| `manifest_sha256` | hex | topology kiểm tra sau khi tải manifest |

### Xử lý ở topology-service

1. Đã có `topology_snapshot.snapshot_id` → bỏ qua (idempotent).
2. Gọi `GET {SCANNER_BASE_URL}/internal/v1/snapshots/{snapshot_id}/manifest` với header `X-Internal-Token` (đúng 1 lần gọi). 404 → DLT.
3. Kiểm tra `sha256` khớp `manifest_sha256`, lệch → DLT.
4. Trong 1 transaction: insert snapshot, batch insert node/contract/topic/edge, cập nhật head, chạy 1 câu `UPDATE ... FROM` nối cạnh cho toàn group, tăng `group_view.graph_version`.
5. Sau commit: không cần xóa cache (khóa cache chứa `graph_version`).

Không có sự kiện phản hồi topology → scanner trong MVP (YAGNI); trạng thái xử lý xem ở topology.
