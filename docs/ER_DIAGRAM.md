# Entity-Relationship Diagram — Office Asset Tracker

```mermaid
erDiagram
    USERS ||--o{ ASSET_ASSIGNMENTS : "has"
    USERS ||--o{ SERVICE_REQUESTS : "creates"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "generates"
    USERS ||--o{ REQUEST_COMMENTS : "posts"

    ASSETS ||--o{ ASSET_ASSIGNMENTS : "assigned in"
    ASSETS }o--|| ASSET_CATEGORIES : "belongs to"
    ASSETS ||--o{ SERVICE_REQUESTS : "referenced in"

    SERVICE_REQUESTS ||--o{ REQUEST_COMMENTS : "has"

    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role "admin|employee"
        string department
        string phone
        int is_active
        datetime created_at
        datetime updated_at
    }

    ASSET_CATEGORIES {
        int id PK
        string name UK
        string description
        datetime created_at
    }

    ASSETS {
        int id PK
        string name
        int category_id FK
        string serial_number UK
        string model
        string manufacturer
        date purchase_date
        float purchase_cost
        date warranty_expiry
        string status "available|assigned|maintenance|retired"
        string location
        string notes
        datetime created_at
        datetime updated_at
    }

    ASSET_ASSIGNMENTS {
        int id PK
        int asset_id FK
        int user_id FK
        int assigned_by FK
        datetime assigned_at
        datetime returned_at
        string notes
    }

    SERVICE_REQUESTS {
        int id PK
        int user_id FK
        string type "asset_request|maintenance|service|other"
        string title
        string description
        string priority "low|medium|high|critical"
        string status "pending|approved|rejected|in_progress|completed|cancelled"
        int asset_id FK
        int assigned_to FK
        datetime resolved_at
        datetime created_at
        datetime updated_at
    }

    REQUEST_COMMENTS {
        int id PK
        int request_id FK
        int user_id FK
        string comment
        datetime created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string title
        string message
        string type "info|success|warning|error"
        int is_read
        int reference_id
        string reference_type
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        string action
        string entity_type
        int entity_id
        string old_values
        string new_values
        string ip_address
        string user_agent
        datetime created_at
    }
```

## Relationships

| Table A | Table B | Relationship | Description |
|---------|---------|-------------|-------------|
| users | asset_assignments | 1:N | A user can have many asset assignments |
| assets | asset_assignments | 1:N | An asset can be assigned many times |
| users | service_requests | 1:N | A user creates many service requests |
| assets | service_requests | 1:N | A request may reference an asset |
| service_requests | request_comments | 1:N | A request has many comments |
| users | request_comments | 1:N | A user posts many comments |
| users | notifications | 1:N | A user receives many notifications |
| users | audit_logs | 1:N | Actions are attributed to users |
| asset_categories | assets | 1:N | A category contains many assets |

## Indexes

- `idx_assets_status` on assets(status)
- `idx_assets_category` on assets(category_id)
- `idx_requests_user` on service_requests(user_id)
- `idx_requests_status` on service_requests(status)
- `idx_requests_type` on service_requests(type)
- `idx_notifications_user` on notifications(user_id, is_read)
- `idx_audit_entity` on audit_logs(entity_type, entity_id)
- `idx_assignments_asset` on asset_assignments(asset_id)
- `idx_assignments_user` on asset_assignments(user_id)
