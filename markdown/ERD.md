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
    SCAN_SNAPSHOT ||--o{ TEST_TRACE_ARTIFACT : attaches
    SCAN_SNAPSHOT ||--o{ STRIX_SECURITY_REPORT : generates

    SERVICE_NODE ||--o{ EXPOSED_CONTRACT : exposes
    SERVICE_NODE ||--o{ DEPENDENCY_EDGE : "originates (source)"
    SERVICE_NODE ||--o{ DEPENDENCY_EDGE : "terminates (target)"
    EXPOSED_CONTRACT ||--o{ DEPENDENCY_EDGE : "invoked by"
    MESSAGE_TOPIC ||--o{ DEPENDENCY_EDGE : "routes via"

    USER ||--o{ AI_IMPACT_SESSION : initiates
    SCAN_SNAPSHOT ||--o{ AI_IMPACT_SESSION : "provides context"
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ AUDIT_LOG : performs

    KEYCLOAK ||--o{ SYSTEM_GROUP : federates
    KEYCLOAK ||--o{ USER : authenticates
    NETBIRD ||--o{ USER : "gates access"
    MINIO ||--o{ SCAN_SNAPSHOT : "stores raw AST"
    MINIO ||--o{ TEST_TRACE_ARTIFACT : "stores HTML trace"
    MINIO ||--o{ STRIX_SECURITY_REPORT : "stores full report"
    KAFKA ||--o{ SCAN_SNAPSHOT : "ingests via event"
    REDIS ||--o{ SCAN_SNAPSHOT : "caches active graph"

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
    TEST_TRACE_ARTIFACT {
        uuid artifact_id PK
        uuid snapshot_id FK
        string version_label
        int cumulative_test_count
        int passed_count
        int failed_count
        string local_trace_dir
        string minio_trace_html_key
        timestamp executed_at
    }
    STRIX_SECURITY_REPORT {
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