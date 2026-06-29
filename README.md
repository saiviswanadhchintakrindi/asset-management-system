# AssetFlow — Office Asset Management System

A full-stack web application for digitizing office asset tracking and employee service request management. Employees raise requests for IT assets and office services while administrators manage inventory, approvals, assignments, and reporting.

---

## Live Demo

🌐 **Deployed at:** [https://asset-management-system.onrender.com](https://asset-management-system.onrender.com)

## Features

### Authentication & Authorization
- JWT-based login/register with bcrypt password hashing (12 rounds)
- Role-based access control (Admin / Employee)
- Session-based token storage (clears on page refresh for security)

### Admin Portal
- **Dashboard** — Total assets, active employees, pending requests, total value, recent activity
- **Asset Inventory** — Full CRUD with serial numbers, categories, cost tracking
- **Asset Assignment** — Assign/return assets to employees with history
- **Employee Directory** — Manage users, roles, departments, activate/deactivate accounts
- **Service Requests** — Approve/reject/process employee requests with status workflow
- **Reports & Analytics** — Bar charts, doughnut charts, CSV export for assets and requests
- **Audit Logs** — Track all system activity with human-readable details
- **Notifications** — Real-time notification badges for all users

### Employee Portal
- **My Dashboard** — Assigned assets, open requests, notifications overview
- **My Assets** — View equipment currently assigned
- **Service Requests** — Submit and track support tickets with comments
- **Notifications** — View and manage alerts

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (sql.js — in-memory, file-persisted) |
| **Authentication** | JWT + bcryptjs |
| **Frontend** | Vanilla JavaScript SPA |
| **Styling** | Custom CSS (white professional theme) |
| **Charts** | Chart.js |
| **API Docs** | Swagger / OpenAPI 3.0 |
| **Logging** | Winston + Morgan |
| **Validation** | express-validator |
| **Testing** | Jest + Supertest |

---

## Quick Start

### Prerequisites
- Node.js v16+
- npm v7+

### Installation

```bash
git clone https://github.com/saiviswanadhchintakrindi/asset-management-system.git
cd asset-management-system/backend
npm install
npm start
```

Open **http://localhost:5000**

### Run Tests

```bash
cd backend
npm test
```

65 tests across 4 suites — all passing.

---

## API Documentation

Full Swagger docs available at **http://localhost:5000/api-docs**

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/register` | Public | Register |
| GET | `/api/auth/me` | User | Get profile |
| POST | `/api/auth/change-password` | User | Change password |
| GET | `/api/users` | Admin | List users |
| POST | `/api/users` | Admin | Create user |
| GET | `/api/users/:id` | Admin | Get user |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Deactivate user |
| GET | `/api/users/:id/assets` | User | User's assets |
| GET | `/api/assets` | User | List assets |
| POST | `/api/assets` | Admin | Create asset |
| GET | `/api/assets/:id` | User | Get asset |
| PUT | `/api/assets/:id` | Admin | Update asset |
| DELETE | `/api/assets/:id` | Admin | Delete asset |
| POST | `/api/assets/:id/assign` | Admin | Assign to user |
| POST | `/api/assets/:id/return` | Admin | Return asset |
| GET | `/api/assets/:id/history` | User | Assignment history |
| GET/POST | `/api/assets/categories` | — | Category CRUD |
| PUT/DELETE | `/api/assets/categories/:id` | Admin | Category update/delete |
| GET | `/api/requests` | User | List requests |
| POST | `/api/requests` | User | Create request |
| GET | `/api/requests/:id` | User | Get request |
| DELETE | `/api/requests/:id` | User | Cancel request |
| PUT | `/api/requests/:id/status` | Admin | Update status |
| GET/POST | `/api/requests/:id/comments` | User | Comments |
| GET | `/api/dashboard/stats` | User | Dashboard |
| GET | `/api/reports/assets` | Admin | Asset report |
| GET | `/api/reports/requests` | Admin | Request report |
| GET | `/api/audit-logs` | Admin | Audit logs |
| GET | `/api/notifications` | User | Notifications |
| PUT | `/api/notifications/read-all` | User | Mark all read |
| PUT | `/api/notifications/:id/read` | User | Mark read |

---

## Project Structure

```
asset-management-system/
├── backend/
│   ├── server.js                    # Entry point
│   ├── package.json
│   ├── database/
│   │   ├── schema.sql               # Full database schema (8 tables)
│   │   └── office_assets.db         # SQLite database file
│   └── src/
│       ├── app.js                   # Express setup
│       ├── config/
│       │   ├── database.js          # SQLite init
│       │   ├── seed.js              # Demo data seeder
│       │   └── swagger.js           # Swagger spec
│       ├── middleware/
│       │   ├── auth.js              # JWT authentication
│       │   ├── errorHandler.js      # Global error handler
│       │   └── validate.js          # Input validation
│       ├── models/                  # Data access layer
│       ├── services/                # Business logic layer
│       ├── controllers/             # Request handling
│       ├── routes/                  # Route definitions
│       └── utils/                   # Helpers & logger
├── frontend/
│   ├── index.html                   # SPA shell
│   ├── css/
│   │   └── style.css                # Professional UI design
│   └── js/
│       ├── api.js                   # API client & utilities
│       ├── auth.js                  # Authentication
│       ├── app.js                   # SPA router
│       ├── dashboard.js             # Dashboard views
│       ├── assets.js                # Asset management
│       ├── requests.js              # Service requests
│       ├── employees.js             # Employee directory
│       ├── reports.js               # Reports & charts
│       ├── notifications.js         # Notifications
│       ├── audit.js                 # Audit logs
│       └── profile.js               # Profile & settings
├── tests/                           # Jest test suites (65 tests)
├── docs/                            # Architecture & ER diagrams
├── render.yaml                      # Render deployment config
└── README.md
```

---

## Database Schema

8 tables with foreign keys and performance indexes:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles |
| `asset_categories` | Category grouping |
| `assets` | Trackable equipment |
| `asset_assignments` | Assignment history |
| `service_requests` | Support tickets |
| `request_comments` | Discussion threads |
| `notifications` | User alerts |
| `audit_logs` | System activity tracking |

---

## Request Status Workflow

```
pending → approved → in_progress → completed
  ↓          ↓            ↓
rejected   cancelled   cancelled
```

---

## Architecture

**Layered Architecture:** Routes → Controllers → Services → Models → Database

**Architecture Diagram:** See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

**ER Diagram:** See [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md)

---

## Deployment

### Render (Free)

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repository
4. Build Command: `cd backend && npm install`
5. Start Command: `cd backend && node server.js`
6. Add env vars: `JWT_SECRET`, `JWT_EXPIRES_IN`

The `render.yaml` file in the repo handles auto-detection.

---

## Architecture

CLIENT BROWSER
├── SPA (Single Page App)
│   ├── Auth.js (Login/Register)
│   ├── Dashboard.js (Stats, Charts)
│   ├── Assets.js (CRUD, Assign)
│   ├── Requests.js / Notifications.js
│   ├── Reports.js / Audit.js
│   ├── Employees.js / Profile.js
│   └── api.js (API Client + JWT Headers)
│
└── Hash Router (#dashboard, #assets, etc.)
         │
         ▼  HTTP/REST
         │
EXPRESS SERVER (port 5000)
│
├── MIDDLEWARE LAYER
│   Helmet -> CORS -> Morgan -> JSON Parser -> Auth & Validate
│
├── ROUTES (/api/*)
│   /api/auth           -> AuthController
│   /api/users          -> UserController (admin)
│   /api/assets         -> AssetController
│   /api/requests       -> RequestController
│   /api/dashboard      -> DashboardController
│   /api/reports        -> ReportController (admin)
│   /api/audit-logs     -> AuditController (admin)
│   /api/notifications  -> NotificationController
│
├── SERVICE LAYER
│   AuthService    (login, register, changePassword)
│   AssetService   (CRUD, assign, return, history, stats)
│   RequestService (CRUD, status workflow, comments)
│   Business Logic: Validation, Notifications, Audit Trail
│
├── MODEL LAYER
│   userModel, assetModel, requestModel
│   categoryModel, notificationModel, auditModel
│   db-helper.js (queryAll, queryOne, run)
│
└── SQLITE DATABASE
    users | assets | asset_categories | asset_assignments
    service_requests | request_comments | notifications | audit_logs
