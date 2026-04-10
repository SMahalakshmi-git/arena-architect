# 🏗️ Arena Architect — Material Supply Optimizer

> A full-stack procurement intelligence platform powered by Cortex real-time supply chain data.

---

## 🚀 Quick Start (Docker — Recommended)

```bash
# 1. Clone / open in VS Code
cd arena-architect

# 2. Start everything
docker-compose up --build

# 3. Open browser
http://localhost          # Full app via NGINX
http://localhost:3000     # Frontend direct
http://localhost:8000     # Backend API direct
```

**Demo Login:**
- `admin@arena.com` / `demo1234`
- `procurement@arena.com` / `demo1234`
- `pm@arena.com` / `demo1234`

---

## 🛠️ Local Development (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Python 3.10+ (optional, for pandas-based scripts)

### Backend Setup

```bash
cd backend
npm install

# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE arena_architect;"
psql -U postgres -c "CREATE USER arena_user WITH PASSWORD 'arena_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE arena_architect TO arena_user;"

# Run schema
psql -U arena_user -d arena_architect -f db/init.sql

# Configure environment
cp .env.example .env   # Edit DATABASE_URL if needed

# Start backend
npm run dev
# → API running at http://localhost:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → App running at http://localhost:3000
```

---

## 📁 Project Structure

```
arena-architect/
├── docker-compose.yml          # Full stack orchestration
├── docker/
│   └── nginx.conf              # Reverse proxy config
│
├── backend/                    # Node.js + Express API
│   ├── server.js               # Entry point + WebSocket server
│   ├── .env                    # Environment variables
│   ├── db/
│   │   ├── pool.js             # PostgreSQL connection pool
│   │   └── init.sql            # Schema + seed data
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   └── routes/
│       ├── auth.js             # Login / Register
│       ├── projects.js         # Project CRUD
│       ├── materials.js        # Materials + BOQ management
│       ├── suppliers.js        # Supplier management
│       ├── alerts.js           # Risk alerts
│       ├── upload.js           # CSV/Excel/JSON file upload
│       ├── cortex.js           # Cortex API integration (mock + real)
│       ├── dashboard.js        # KPI aggregation endpoints
│       └── reports.js          # PDF report generation (PDFKit)
│
└── frontend/                   # React + Vite + Tailwind CSS
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx            # App entry point
        ├── App.jsx             # Router + protected routes
        ├── index.css           # Global styles + design tokens
        ├── context/
        │   └── AuthContext.jsx # JWT auth state management
        ├── hooks/
        │   └── useWebSocket.js # Live updates via WebSocket
        ├── utils/
        │   └── api.js          # Axios client with auth interceptor
        └── pages/
            ├── LoginPage.jsx       # Auth (login + register)
            ├── DashboardPage.jsx   # KPI cards + charts
            ├── ProjectsPage.jsx    # Project list + CRUD
            ├── ProjectDetailPage.jsx # BOQ table + Cortex analysis
            ├── MaterialsPage.jsx   # All materials overview
            ├── SuppliersPage.jsx   # Supplier comparison
            ├── AlertsPage.jsx      # Risk alerts feed
            └── UploadPage.jsx      # Drag-drop file upload
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email/password → JWT |
| POST | `/auth/register` | Create account |
| GET | `/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Get project by ID |
| PUT | `/projects/:id` | Update project |
| DELETE | `/projects/:id` | Delete project |

### Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/materials?project_id=` | List materials |
| POST | `/materials` | Add material |
| PUT | `/materials/:id` | Update material |
| DELETE | `/materials/:id` | Delete material |
| GET | `/materials/:id/recommendations` | Get Cortex supplier recs |

### Cortex Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/cortex/analyze` | Run Cortex analysis on materials |
| GET | `/cortex/pricing-trends` | Get 30-day price history |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload/boq` | Upload CSV/Excel/JSON BOQ |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/alerts` | List alerts |
| PUT | `/alerts/:id/read` | Mark alert read |
| PUT | `/alerts/read-all` | Mark all read |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/procurement-summary/:project_id` | Download PDF report |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/kpis` | Aggregated KPIs |
| GET | `/dashboard/recent-activity` | Recent activity feed |

---

## 🌐 Real Cortex API Integration

To connect to the real Cortex Material Sourcing Optimizer API, update `.env`:

```env
CORTEX_API_URL=https://api.cortex.io/v1
CORTEX_API_KEY=your_cortex_api_key_here
```

The system automatically uses mock data in development mode when these are not set.

---

## 📊 Features

### Phase 1 — Backend & Data Ingestion ✅
- JWT-based auth with role-based access (Admin / Procurement / Project Manager)
- File upload API for CSV, Excel (.xlsx/.xls), and JSON BOQ files
- Automatic material parsing and normalization into PostgreSQL
- PostgreSQL schemas for projects, materials, suppliers, pricing history, alerts

### Phase 2 — Cortex Integration ✅
- Cortex API client with automatic fallback to rich mock data
- Supplier recommendations with price, availability, risk, and delivery data
- Price trend forecasting (30-day history)
- Regional shortage and price spike detection
- Risk alerts stored and broadcasted via WebSocket

### Phase 3 — Dashboard & Frontend ✅
- Procurement Intelligence Dashboard with live KPI cards
- Price trend line charts (Chart.js)
- Risk distribution doughnut chart
- Supplier reliability bar chart
- Material-wise supplier comparison with Cortex scores
- Live alert feed with severity badges
- Project list with sourcing status

### Phase 4 — Advanced Features ✅
- Role-based access control (Admin / Procurement / Project Manager)
- Drag-and-drop BOQ file upload with format detection
- PDF procurement summary report (PDFKit — open source)
- WebSocket live updates for alerts and analysis results
- Docker + NGINX full deployment configuration

---

## 🐳 Deployment

### Free Tier Options

**Render.com:**
```bash
# Backend: New Web Service → Node → npm start
# Database: New PostgreSQL (free tier)
# Frontend: New Static Site → npm run build → dist/
```

**Railway.app:**
```bash
railway up
```

**Fly.io:**
```bash
fly launch
fly deploy
```

**Local Docker:**
```bash
docker-compose up --build -d
```

---

## 📋 Sample BOQ CSV

Download and use this template for testing uploads:

```csv
Material Name,Category,Unit,Quantity,Unit Price,Required By,Priority
Structural Steel TMT Fe500,Steel,MT,120,85000,2025-06-01,high
OPC Cement 53 Grade,Cement,bags,5000,380,2025-05-15,critical
River Sand (Coarse),Aggregate,m³,800,1200,2025-05-20,medium
Crushed Stone Aggregate 20mm,Aggregate,m³,600,950,2025-05-25,medium
Ready Mix Concrete M30,Concrete,m³,250,5500,2025-06-10,high
Steel Rebar 12mm,Steel,MT,45,78000,2025-06-05,high
Waterproofing Compound,Chemical,litre,2000,450,2025-07-01,low
Fly Ash Bricks,Masonry,nos,50000,8,2025-06-20,medium
Plywood 18mm BWR,Wood,sheet,300,1800,2025-07-15,low
Electrical Conduit 25mm,Electrical,m,2000,85,2025-07-01,medium
```

---

## 🛡️ Tech Stack (100% Free & Open Source)

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS, Chart.js, React Query |
| Backend | Node.js + Express, WebSockets (ws) |
| Database | PostgreSQL 15 |
| File Parsing | csv-parser, xlsx (SheetJS) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| PDF Reports | PDFKit |
| Deployment | Docker + Docker Compose + NGINX |
| Hosting | Render / Railway / Fly.io (free tiers) |

---

## 🧪 Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   NGINX :80                      │
│         (Reverse Proxy / Load Balancer)         │
└────────────┬─────────────────┬──────────────────┘
             │                 │
    ┌────────▼──────┐  ┌──────▼──────────┐
    │  Frontend     │  │   Backend API   │
    │  React/Vite   │  │  Node.js :8000  │
    │  :3000        │  │                 │
    └───────────────┘  │  ┌────────────┐ │
                       │  │  WebSocket │ │
                       │  │  /ws live  │ │
                       │  └────────────┘ │
                       │        │        │
                       └────────┼────────┘
                                │
                    ┌───────────▼──────────┐
                    │   PostgreSQL :5432    │
                    │   arena_architect DB  │
                    └───────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │  Cortex Material API  │
                    │  (Mock in dev mode)  │
                    └───────────────────────┘
```
