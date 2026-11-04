# Sơ đồ Quan hệ Thực thể (ERD) — Ứng dụng Bản đồ Kiến trúc Mã nguồn DevMapper

## Sơ đồ (Diagram)

Khối mã Mermaid dưới đây được **giữ nguyên bằng tiếng Anh** để tương thích tốt nhất với trình render trực tiếp của GitHub/GitLab mà không làm rối nhãn quan hệ. Do áp dụng kiến trúc Microservices, các bảng được phân chia theo từng Schema logic (xem chi tiết ở mục Thực thể bên dưới).

```mermaid
erDiagram
    SYSTEM_GROUP ||--o{ USER : scopes
    ROLE ||--o{ USER : grants
    ROLE ||--o{ ROLE_PERMISSION : has
    PERMISSION ||--o{ ROLE_PERMISSION : "granted via"
    SYSTEM_GROUP ||--o{ ACCESS_REQUEST : receives
    USER ||--o{ ACCESS_REQUEST : reviews
    USER ||--o| ACCESS_REQUEST : provisions

    SYSTEM_GROUP ||--o{ REPOSITORY : contains
    REPOSITORY ||--o{ SCAN_SNAPSHOT : produces
    SCAN_SNAPSHOT ||--o{ SERVICE_NODE : defines
    SCAN_SNAPSHOT ||--o{ DEPENDENCY_EDGE : maps
    SCAN_SNAPSHOT ||--o{ SECURITY_REPORT : generates

    SERVICE_NODE ||--o{ EXPOSED_CONTRACT : exposes
    SERVICE_NODE ||--o{ DEPENDENCY_EDGE : "originates (source)"
    SERVICE_NODE ||--o{ DEPENDENCY_EDGE : "terminates (target)"
    EXPOSED_CONTRACT ||--o{ DEPENDENCY_EDGE : "invoked by"
    MESSAGE_TOPIC ||--o{ DEPENDENCY_EDGE : "routes via"

    USER ||--o{ AI_IMPACT_SESSION : initiates
    SCAN_SNAPSHOT ||--o{ AI_IMPACT_SESSION : "provides context"
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ AUDIT_LOG : performs

    SYSTEM_GROUP {
        uuid group_id PK
        string name
        string description
        string keycloak_group_id
        string netbird_group_id
        timestamp created_at
    }
    ROLE {
        uuid role_id PK
        string name
    }
    USER {
        uuid user_id PK
        string full_name
        string email
        string username
        uuid group_id FK
        uuid role_id FK
        string keycloak_user_id
        string status
        string locked_reason
        string avatar_url
        boolean netbird_connected
        timestamp netbird_last_seen
    }
    ACCESS_REQUEST {
        uuid request_id PK
        string request_type
        string full_name
        string email
        string username
        uuid group_id FK
        uuid existing_user_id FK
        string status
        timestamp requested_at
        uuid reviewed_by FK
        timestamp reviewed_at
        uuid created_user_id FK
    }
    REPOSITORY {
        uuid repo_id PK
        uuid group_id FK
        string name
        string git_url
        string default_branch
        string language_stack
        string ci_webhook_secret_hash
        timestamp last_scanned_at
    }
    SCAN_SNAPSHOT {
        uuid snapshot_id PK
        uuid repo_id FK
        string branch_name
        string commit_sha
        string version_tag
        string ci_run_id
        string status
        string minio_ast_object_key
        timestamp created_at
    }
    SERVICE_NODE {
        uuid node_id PK
        uuid snapshot_id FK
        string service_key
        string display_name
        string node_type
        jsonb tech_metadata
    }
    EXPOSED_CONTRACT {
        uuid contract_id PK
        uuid node_id FK
        string protocol
        string http_method
        string endpoint_path
        jsonb request_schema
        jsonb response_schema
        string source_file_path
        int source_line_number
    }
    MESSAGE_TOPIC {
        uuid topic_id PK
        string topic_name
        string broker_type
        jsonb payload_schema
    }
    DEPENDENCY_EDGE {
        uuid edge_id PK
        uuid snapshot_id FK
        uuid source_node_id FK
        uuid target_node_id FK
        uuid target_contract_id FK
        uuid topic_id FK
        string interaction_type
        string call_site_file
        int call_site_line
        boolean is_breaking_risk
    }
    SECURITY_REPORT {
        uuid report_id PK
        uuid snapshot_id FK
        string highest_severity
        int vulnerability_count
        jsonb findings_summary
        string minio_report_object_key
        boolean is_remediated
        timestamp scanned_at
    }
    AI_IMPACT_SESSION {
        uuid session_id PK
        uuid user_id FK
        uuid snapshot_id FK
        string ai_provider
        text prompt_query
        jsonb affected_nodes
        text analysis_markdown
        timestamp created_at
    }
    NOTIFICATION {
        uuid notification_id PK
        uuid user_id FK
        string entity_type
        uuid entity_id
        boolean is_read
        timestamp created_at
    }
    AUDIT_LOG {
        uuid audit_id PK
        uuid actor_id FK
        string action
        string entity_type
        uuid entity_id
        timestamp created_at
    }
    PERMISSION {
        uuid permission_id PK
        string key
        string description
    }
    ROLE_PERMISSION {
        uuid role_id FK
        uuid permission_id FK
    }
```

## Thực thể theo Schema (đề xuất, chờ `Opus Architect` chốt trong `PLAN.md`)

| Schema (service) | Bảng |
|---|---|
| `scanner_db` (`scanner-service`) | `REPOSITORY`, `SCAN_SNAPSHOT` |
| `topology_db` (`topology-service`) | `SERVICE_NODE`, `EXPOSED_CONTRACT`, `MESSAGE_TOPIC`, `DEPENDENCY_EDGE` |
| `ai_db` (`ai-mcp-service`) | `AI_IMPACT_SESSION` |
| `gov_db` (`quality-gov-service`) | `SYSTEM_GROUP`, `ROLE`, `PERMISSION`, `ROLE_PERMISSION`, `USER`, `ACCESS_REQUEST`, `AUDIT_LOG`, `NOTIFICATION`, `SECURITY_REPORT` |

**Quy tắc tham chiếu chéo:** các cột `group_id`, `snapshot_id`, `user_id`, `actor_id` trỏ sang schema khác chỉ là khóa logic (không tạo `FOREIGN KEY`, không `JOIN`); service sở hữu tự kiểm tra tồn tại qua REST/gRPC/Kafka. Chỉ các quan hệ nằm trong cùng schema mới có ràng buộc FK ở mức DB.

**Hạ tầng không phải thực thể** (đã loại khỏi sơ đồ): Keycloak (định danh qua `keycloak_user_id`, `keycloak_group_id`), NetBird (`netbird_group_id`, `netbird_connected`), MinIO (các cột `minio_*_key`), Kafka (sự kiện hoàn tất quét), Redis (cache đồ thị `global-graph`).
