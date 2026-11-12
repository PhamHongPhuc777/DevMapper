# Hợp đồng MCP Tools & ai-architecture-context.json (v1)

## Máy chủ MCP

- Service: `ai-mcp-service`, MCP Java SDK (`io.modelcontextprotocol.sdk:mcp`), transport Streamable HTTP (`HttpServletStreamableServerTransportProvider`) tại `/mcp`, server sync, chỉ đọc (không tool ghi).
- Xác thực: header `Authorization: Bearer <DEVMAPPER_MCP_TOKEN>` (filter servlet trước `/mcp`, so sánh constant-time). Phase 2 thay bằng JWT Keycloak.
- `serverInfo`: `devmapper` / phiên bản app.
- Mỗi tool gọi đúng 1 endpoint nội bộ của `topology-service` (bảng cuối), body phản hồi của endpoint **chính là** `structuredContent` của tool; `content` là 1 `TextContent` chứa cùng JSON đã minify. ai-mcp-service không có DB ở MVP.
- Lỗi nghiệp vụ (group/service/topic không tồn tại, input sai) trả `CallToolResult` với `isError: true` và text ngắn; không ném exception giao thức.
- Giới hạn: mọi danh sách có `limit` (mặc định 100, tối đa 500) và cờ `truncated`.

Ví dụ cấu hình Claude Code (`.mcp.json` của repo người dùng; MVP chỉ gọi được từ chính máy chủ desktop vì cổng bind `127.0.0.1`, phiên ngoài máy dùng `ai-architecture-context.json`):

```json
{ "mcpServers": { "devmapper": { "type": "http", "url": "http://localhost:8083/mcp",
  "headers": { "Authorization": "Bearer ${DEVMAPPER_MCP_TOKEN}" } } } }
```

## Kiểu dùng chung

```jsonc
// CallSite
{ "repo": "order-service", "commit_sha": "3f2a9c1...", "file": "src/main/java/.../PaymentClient.java", "line": 14 }

// ServiceRef
{ "service_key": "payment-service", "repo": "payment-service", "node_type": "SERVICE", "commit_sha": "a1b2..." }

// Contract
{ "contract_id": "uuid", "protocol": "HTTP", "http_method": "POST", "path": "/api/payments",
  "grpc_method": null, "request_schema": {}, "response_schema": {}, "source": { "file": "...", "line": 20 } }

// Edge
{ "edge_id": "uuid", "from": "order-service", "to": "payment-service" /* null nếu UNRESOLVED hoặc qua topic */,
  "interaction_type": "HTTP_CALL" /* GRPC_CALL | DB_ACCESS | KAFKA_PUBLISH | KAFKA_SUBSCRIBE */,
  "contract_id": "uuid|null", "topic": "string|null", "target_hint": "payment-service POST /api/payments",
  "resolution_status": "RESOLVED" /* UNRESOLVED | EXTERNAL */, "is_breaking_risk": false,
  "call_site": { /* CallSite */ } }
```

`is_breaking_risk = true` khi cạnh từng được nối (RESOLVED) nhưng sau lần quét mới nhất của repo đích không còn contract khớp.

Mọi output có `group`, `graph_version` (số nguyên tăng sau mỗi lần nạp snapshot) và chỉ phản ánh **head** (snapshot mới nhất nhánh mặc định) của từng repo.

## Tool 1: `get_service_topology`

Mô tả cho LLM: "Trả đồ thị phụ thuộc quanh một service (hoặc cả group): contract nó expose, service nó gọi/bị gọi, topic Kafka, kèm file/dòng code."

Input schema:

```json
{
  "type": "object", "additionalProperties": false, "required": ["group"],
  "properties": {
    "group": { "type": "string", "description": "Tên System Group" },
    "service_key": { "type": "string", "description": "Bỏ trống = toàn group" },
    "depth": { "type": "integer", "minimum": 1, "maximum": 3, "default": 1 },
    "direction": { "enum": ["upstream", "downstream", "both"], "default": "both" },
    "protocols": { "type": "array", "items": { "enum": ["HTTP", "GRPC", "KAFKA", "DB"] } },
    "include_contracts": { "type": "boolean", "default": true },
    "limit": { "type": "integer", "minimum": 1, "maximum": 500, "default": 100 }
  }
}
```

Output (`structuredContent`):

```json
{
  "group": "shop", "graph_version": 42, "root": "order-service", "depth": 1,
  "nodes": [ { "service_key": "order-service", "repo": "order-service", "node_type": "SERVICE", "commit_sha": "3f2a...",
               "contracts": [ /* Contract, rỗng nếu include_contracts=false */ ] } ],
  "edges": [ /* Edge */ ],
  "truncated": false
}
```

`limit` áp cho số node; edges chỉ gồm cạnh giữa các node trả về (cộng cạnh UNRESOLVED/EXTERNAL đi ra từ chúng).

## Tool 2: `analyze_breaking_change`

Mô tả cho LLM: "Trước khi sửa/xóa một API endpoint hoặc Kafka topic, liệt kê các service và vị trí code bị ảnh hưởng (bán kính ảnh hưởng nhiều tầng)."

Input schema (đúng 1 trong 3 cách chỉ định đích):

```json
{
  "type": "object", "additionalProperties": false, "required": ["group", "target"],
  "properties": {
    "group": { "type": "string" },
    "target": {
      "oneOf": [
        { "type": "object", "additionalProperties": false, "required": ["service_key", "http_method", "path"],
          "properties": { "service_key": { "type": "string" }, "http_method": { "type": "string" }, "path": { "type": "string" } } },
        { "type": "object", "additionalProperties": false, "required": ["contract_id"],
          "properties": { "contract_id": { "type": "string", "format": "uuid" } } },
        { "type": "object", "additionalProperties": false, "required": ["topic"],
          "properties": { "topic": { "type": "string" } } }
      ]
    },
    "change_kind": { "enum": ["REMOVE", "MODIFY_SCHEMA", "RENAME"], "default": "MODIFY_SCHEMA", "description": "Chỉ để ghi kèm trong output ở MVP" },
    "max_depth": { "type": "integer", "minimum": 1, "maximum": 5, "default": 3 },
    "limit": { "type": "integer", "minimum": 1, "maximum": 500, "default": 100 }
  }
}
```

`path` được chuẩn hóa như lúc nạp (`{id}`, `:id` → `{}`) rồi so khớp.

Output:

```json
{
  "group": "shop", "graph_version": 42, "change_kind": "MODIFY_SCHEMA",
  "target": { "kind": "HTTP", "owner": "payment-service", "contract": { /* Contract */ }, "topic": null },
  "impacted": [
    { "service_key": "order-service", "repo": "order-service", "depth": 1,
      "via": [ { "edge_id": "uuid", "interaction_type": "HTTP_CALL", "call_site": { /* CallSite */ } } ] },
    { "service_key": "checkout-bff", "repo": "checkout-bff", "depth": 2,
      "via": [ { "edge_id": "uuid", "interaction_type": "HTTP_CALL", "call_site": { /* CallSite */ } } ] }
  ],
  "impacted_repos": ["order-service", "checkout-bff"],
  "currently_broken_edges": [ /* Edge có is_breaking_risk=true trỏ tới owner */ ],
  "truncated": false
}
```

Ngữ nghĩa độ sâu: depth 1 = service gọi trực tiếp contract (hoặc subscribe topic). depth n+1 = service gọi bất kỳ contract nào của một service ở depth n (xấp xỉ theo service, chấp nhận dương tính giả). Duyệt bằng `WITH RECURSIVE` trên head snapshots, có chống vòng (mảng path), dừng ở `max_depth`. Với topic: depth 1 = subscribers (publishers khác được liệt kê ở `target`, không tính là bị ảnh hưởng).

## Tool 3: `get_topic_subscribers`

Mô tả cho LLM: "Ai đang publish và subscribe một Kafka topic, kèm file/dòng code."

Input schema:

```json
{
  "type": "object", "additionalProperties": false, "required": ["group", "topic"],
  "properties": {
    "group": { "type": "string" },
    "topic": { "type": "string", "pattern": "^[A-Za-z0-9._-]{1,249}$" },
    "include_publishers": { "type": "boolean", "default": true },
    "limit": { "type": "integer", "minimum": 1, "maximum": 500, "default": 100 }
  }
}
```

Output:

```json
{
  "group": "shop", "graph_version": 42, "topic": "order.created", "broker": "KAFKA",
  "payload_schema": null,
  "subscribers": [ { "service_key": "notification-service", "repo": "notification-service", "call_site": { /* CallSite */ } } ],
  "publishers": [ { "service_key": "order-service", "repo": "order-service", "payload_type": "shop.order.OrderCreatedEvent", "call_site": { /* CallSite */ } } ],
  "truncated": false
}
```

## `ai-architecture-context.json`

Sinh bởi topology-service; CI tải qua `GET /api/v1/ingest/ai-context` (scanner-service proxy, xác thực Ingestion Token) bằng lệnh `scanner-cli export-context`, rồi đính kèm làm artifact CI. Mục tiêu: AI Agent ngoài mạng nội bộ đọc file thay cho MCP. Kích thước mục tiêu < 512 KB; vượt thì cắt `contracts[].request_schema/response_schema` trước, rồi đặt `truncated: true`.

```json
{
  "schema_version": "1.0",
  "generated_at": "2026-11-03T08:01:00Z",
  "group": "shop",
  "graph_version": 42,
  "scope": { "service_key": "order-service", "depth": 1 },
  "services": [
    {
      "service_key": "order-service", "repo": "order-service", "branch": "main", "commit_sha": "3f2a...",
      "node_type": "SERVICE",
      "contracts": [ /* Contract */ ],
      "publishes": ["order.created"],
      "subscribes": []
    }
  ],
  "edges": [ /* Edge, bỏ edge_id */ ],
  "topics": [ { "topic": "order.created", "publishers": ["order-service"], "subscribers": ["notification-service"] } ],
  "unresolved_edges": [ /* Edge có resolution_status=UNRESOLVED */ ],
  "truncated": false
}
```

`scope.service_key = null` nghĩa là toàn group.

## Endpoint nội bộ topology-service (ai-mcp-service và scanner-service gọi)

Header bắt buộc `X-Internal-Token`. Body phản hồi = output tương ứng ở trên. Mọi GET trả `ETag: "g<graph_version>"` và `Cache-Control: no-cache` (bắt revalidate), hỗ trợ `If-None-Match` → 304. Lỗi RFC 9457 (404 group/service/topic không tồn tại, 400 input sai).

| Tool / mục đích | Endpoint |
| :--- | :--- |
| `get_service_topology` | `GET /internal/v1/topology?group=&service_key=&depth=&direction=&protocols=HTTP,KAFKA&include_contracts=&limit=` |
| `analyze_breaking_change` | `POST /internal/v1/impact` (body = input của tool) |
| `get_topic_subscribers` | `GET /internal/v1/topics/{topic}/subscribers?group=&include_publishers=&limit=` |
| ai-architecture-context.json | `GET /internal/v1/ai-context?group=` hoặc `?group_id=` `&service_key=&depth=` |
