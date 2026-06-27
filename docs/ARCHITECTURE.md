# Architecture Diagram — Office Asset Tracker

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   SPA (Single Page App)                    │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐ │  │
│  │  │ Auth.js │ │Dashboard │ │Assets  │ │Requests/Notifs   │ │  │
│  │  │(Login/  │ │  .js     │ │  .js   │ │Reports/Audit/    │ │  │
│  │  │Register)│ │(Stats,   │ │(CRUD,  │ │Employees/Profile │ │  │
│  │  │         │ │ Charts)  │ │Assign) │ │                  │ │  │
│  │  └────┬────┘ └────┬─────┘ └───┬────┘ └────────┬─────────┘ │  │
│  │       └───────────┴───────────┴───────────────┘            │  │
│  │                          │                                  │  │
│  │                    api.js (API Client)                      │  │
│  │              JWT Bearer Token in Headers                    │  │
│  └──────────────────────────┼──────────────────────────────────┘  │
│                             │                                     │
│                    Hash-based Router                              │
│                 (#dashboard, #assets, etc.)                       │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTP/REST
┌─────────────────────────────┼────────────────────────────────────┐
│                     EXPRESS SERVER (port 5000)                    │
│                             │                                     │
│  ┌──────────────────────────┼──────────────────────────────────┐ │
│  │                  MIDDLEWARE LAYER                            │ │
│  │  ┌────────┐ ┌──────┐ ┌────────┐ ┌──────────┐ ┌───────────┐ │ │
│  │  │ Helmet │→│ CORS │→│ Morgan │→│ JSON     │→│ Auth &    │ │ │
│  │  │ (Sec)  │ │      │ │(Logger)│ │ Parser   │ │ Validate  │ │ │
│  │  └────────┘ └──────┘ └────────┘ └──────────┘ └───────────┘ │ │
│  └──────────────────────────┼──────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────┼──────────────────────────────────┐ │
│  │                    ROUTES (/api/*)                           │ │
│  │                                                              │ │
│  │  /api/auth      ──────── AuthController                      │ │
│  │  /api/users     ──────── UserController (admin)              │ │
│  │  /api/assets    ──────── AssetController                     │ │
│  │  /api/requests  ──────── RequestController                   │ │
│  │  /api/dashboard ──────── DashboardController                 │ │
│  │  /api/reports   ──────── ReportController (admin)            │ │
│  │  /api/audit-logs ─────── AuditController (admin)             │ │
│  │  /api/notifications ──── NotificationController              │ │
│  └──────────────────────────┼──────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────┼──────────────────────────────────┐ │
│  │                   SERVICE LAYER                              │ │
│  │                                                              │ │
│  │  AuthService          AssetService        RequestService     │ │
│  │  ├─ login             ├─ getAll           ├─ getAll           │ │
│  │  ├─ register          ├─ getById          ├─ getById          │ │
│  │  ├─ changePassword    ├─ create/update    ├─ create           │ │
│  │  │                    ├─ delete           ├─ updateStatus     │ │
│  │  │                    ├─ assign           ├─ delete           │ │
│  │  │                    ├─ returnAsset      ├─ getComments      │ │
│  │  │                    ├─ getHistory       ├─ addComment       │ │
│  │  │                    ├─ getStats         ├─ getStats         │ │
│  │  │                    └─ getUserAssets    └─ getMonthlyTrend  │ │
│  │  │                                                           │ │
│  │  Business Logic: Validation, Notifications, Audit Trail      │ │
│  └──────────────────────────┼──────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────┼──────────────────────────────────┐ │
│  │                     MODEL LAYER                              │ │
│  │                                                              │ │
│  │  userModel.js    assetModel.js      requestModel.js          │ │
│  │  ├─ findByEmail  ├─ findById        ├─ findById              │ │
│  │  ├─ findById     ├─ findAll         ├─ findAll               │ │
│  │  ├─ findAll      ├─ create/update   ├─ create                │ │
│  │  ├─ create       ├─ delete          ├─ updateStatus          │ │
│  │  ├─ update       ├─ assign          ├─ delete                │ │
│  │  ├─ getStats     ├─ returnAsset     ├─ getComments           │ │
│  │  │               ├─ getHistory      ├─ addComment            │ │
│  │  │               ├─ getStats        ├─ getStats              │ │
│  │  │               └─ getUserAssets   └─ getMonthlyTrend       │ │
│  │  │                                                           │ │
│  │  categoryModel  notificationModel  auditModel                │ │
│  │  └─ CRUD         └─ CRUD + unread   └─ findAll               │ │
│  │                                                              │ │
│  │               db-helper.js (queryAll, queryOne, run)         │ │
│  └──────────────────────────┼──────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────┼──────────────────────────────────┐ │
│  │                   SQLITE DATABASE                            │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │  users  │ assets  │ asset_   │ service_  │ request_    │ │ │
│  │  │         │         │ categories│ requests │ comments    │ │ │
│  │  ├─────────┼─────────┼──────────┼──────────┼─────────────┤ │ │
│  │  │ asset_  │ notifi- │ audit_   │          │             │ │ │
│  │  │ assign- │ cations │ logs     │          │             │ │ │
│  │  │ ments   │         │          │          │             │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │               Persisted to disk every 30 seconds             │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Application Layers

```
┌─────────────────────┐
│   Routes (routes/)  │  ← HTTP method + path definitions
├─────────────────────┤
│ Controllers (ctrl/) │  ← Request/response handling
├─────────────────────┤
│  Services (services/)│  ← Business logic, validation, notifications
├─────────────────────┤
│   Models (models/)  │  ← Data access, SQL queries
├─────────────────────┤
│   Database (SQLite) │  ← Persistent storage
└─────────────────────┘
```

## Frontend Architecture

```
┌──────────────┐
│  index.html  │  ← SPA shell (auth pages + app layout)
├──────────────┤
│  style.css   │  ← Glassmorphism design system
├──────────────┤
│   api.js     │  ← API client, toasts, modals, formatters
├──────────────┤
│   auth.js    │  ← Login/Register forms, session management
├──────────────┤
│   app.js     │  ← SPA router, navigation, sidebar
├──────────────┤
│ dashboard.js │  ← Admin & Employee dashboard views
├──────────────┤
│  assets.js   │  ← Asset inventory & management
├──────────────┤
│ requests.js  │  ← Service request CRUD & comments
├──────────────┤
│ employees.js │  ← Employee directory (admin)
├──────────────┤
│  reports.js  │  ← Report generation & analytics
├──────────────┤
│notifications │  ← Notification list & badges
├──────────────┤
│  audit.js    │  ← Audit log viewer (admin)
├──────────────┤
│ profile.js   │  ← User profile & password change
└──────────────┘
```

## Data Flow

```
User Action → Frontend (JS) → apiFetch() → HTTP Request (JWT)
                                                │
                                                ▼
                                          Express Router
                                                │
                                                ▼
                                          Middleware (auth, validate)
                                                │
                                                ▼
                                          Controller
                                                │
                                                ▼
                                          Service (business logic)
                                                │
                                                ▼
                                          Model (SQL queries)
                                                │
                                                ▼
                                          SQLite Database
                                                │
                                                ▼
                                          Response ← JSON ← HTTP
```

## Security Flow

```
1. Request → Helmet (security headers)
2. Request → CORS (origin check)
3. Request → JWT verification (authenticate middleware)
4. Request → Role check (requireAdmin middleware)
5. Request → Input validation (express-validator)
6. Response → Audit log creation
7. Response ← JSON with appropriate status
```

## Request Status Workflow

```
                    employee               admin
                       │                     │
                       ▼                     │
 ┌─────────┐    ┌──────────┐         ┌──────┴──────┐    ┌────────────┐
 │ pending │───→│ approved │────────→│ in_progress │───→│ completed  │
 └────┬────┘    └────┬─────┘         └──────┬──────┘    └────────────┘
      │              │                     │
      ├──→ rejected  ├──→ cancelled       └──→ cancelled
      └──→ cancelled
```
