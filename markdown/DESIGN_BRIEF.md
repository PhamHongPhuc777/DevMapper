# Bản mô tả thiết kế giao diện (Design Brief) cho Claude Design

Dùng khối bên dưới làm yêu cầu cho phiên thiết kế (Claude Design nay nằm trong Claude: bản thiết kế được tạo bằng loại Design artifact trong phiên, đọc kèm `PRD.md`, `SRS.md`, `ERD.md`). Khối này viết bằng tiếng Anh để model xử lý tốt nhất; nội dung hiển thị trên giao diện yêu cầu bằng tiếng Việt.

```text
You are designing the UI/UX for DevMapper: an internal web tool that maps microservice architecture automatically from source code (scanned by CI across many repos), shows who calls whom, and tells you what breaks if an API or Kafka topic changes. Users: new developers (onboarding), tech leads, platform admins; AI coding agents consume the same data via an MCP server.

SOURCES (attached): PRD.md (scope, personas, priorities M/S/C), SRS.md (functional requirements), ERD.md (entities and fields). Use their entity and field names for labels and sample data (SERVICE_NODE.node_type, DEPENDENCY_EDGE.interaction_type HTTP/KAFKA/DB, is_breaking_risk, call_site_file/line, SCAN_SNAPSHOT.commit_sha/branch/version_tag). The UI copy is Vietnamese (with full diacritics). Technical terms stay English.

SCREENS (design Must-have first, Should/Could after, on separate boards):
1. Group overview: system groups, repos count, last scan, architecture health summary, small stat cards, charts built only from graph data: edges by protocol (HTTP / Kafka / DB), breaking-risk and unresolved edges across snapshots, scan freshness per repo.
2. Interactive topology map (hero screen): service nodes and edges, filter chips by protocol (HTTP / Kafka / DB), search, zoom/pan/fit controls, minimap, drill-down group -> service. Click a node or edge opens a side panel: file path, line, request/response payload schema, which repos are affected.
3. Blast radius: pick an endpoint or Kafka topic, show upstream/downstream impact by depth (slider 1-5), highlighted path on the map, and a table of affected repos with call sites. Mark breaking-change risk clearly.
4. Repositories and scan snapshots: repo and group lists (small, stable, ordered by name: keyset next/previous paging with a limit of at most 200, no "jump to page N"), snapshot history table that is time-ordered and large: cursor-based paging with a time-window filter (from/to), never an unbounded list; ingestion token shown once with copy.
5. AI context page: MCP server connection snippet, download ai-architecture-context.json, scope selector.
6. (Should/Could) Architecture Diff between two versions: added / removed / breaking edges. Users, roles, access requests, audit log (time-ordered: cursor + time window). AI impact assistant.

NOT in the product (do not design): test-run or Playwright trace screens, security-scan report screens, vulnerability charts. Those are development-stage tools, not user features.

REQUIRED STATES for every data screen (they come from TanStack Query in the build): initial loading skeleton, background refetching indicator ("cập nhật lúc ..."), stale data banner, error with retry, empty state, "server unreachable", and "truncated" (graph and AI-context responses are capped, e.g. 500 nodes/edges or 512 KB: show a banner such as "showing the first 500, narrow the filter or depth", never cut silently).

VISUAL LANGUAGE: shadcn/ui style: neutral palette, 1 accent, 0.5rem radius, subtle borders, Inter or Geist, 4px spacing scale, lucide-style stroke icons. Light and dark themes. Desktop-first at 1440 wide, must still work at phone width. Name components as shadcn components (Button, Card, Table, Badge, Tabs, Sheet, Dialog, Tooltip, Command, Select, Slider, Skeleton) so they map 1:1 to the build.

CHARTS: Recharts look (area / bar / line, tooltip, legend, axis ticks, accessible colors that differ in lightness, not just hue).

MOTION (spec for Anime.js later; use CSS animation in the design): topology edges draw in with a 30-60 ms stagger on load; selected node pulses once; side panel slides in 200 ms ease-out; stat numbers count up once; blast-radius path animates outward by depth. Everything respects prefers-reduced-motion.

DELIVERABLES: one artboard per screen and per state group, plus a "tokens and components" board (colors, type scale, spacing, radius, motion durations/easings). Use clearly labeled sample data only (no invented real-world metrics). Ask me only what you can't decide yourself.
```

## Nếu đã dán bản cũ vào Claude Design

Chỉ cần yêu cầu bốn thay đổi: (1) bỏ màn hình "Test traces and security reports" và các biểu đồ số test tích lũy, lỗ hổng; (2) bảng lịch sử snapshot dùng phân trang con trỏ kèm bộ lọc khoảng thời gian (từ/đến); (3) danh sách repo và group dùng phân trang con trỏ theo tên (trước/sau, không có "nhảy tới trang N"); (4) thêm trạng thái "truncated" cho màn hình bản đồ, blast radius và AI context (kết quả bị giới hạn, hiện banner thay vì cắt im lặng).
