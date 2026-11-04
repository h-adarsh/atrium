# Atrium — Apartment Community & Society Management Platform

A modern, transparent, and security-first multi-tenant building operations platform built for residential apartment complexes, gated societies, and RWAs. Replaces scattered WhatsApp coordination, paper vouchers, and fragile spreadsheets with automated maintenance ledgers, digital audit trails, and 1-click self-onboarding.

---

## 🌟 Core Highlights

* **Multi-Tenant Architecture:** Host multiple distinct apartment societies (*Royal Orchid Apartments*, *Greenwoods Enclave*, or any newly onboarded society) within an isolated, tenant-scoped PostgreSQL database.
* **1-Click Society Onboarding:** Management committees can onboard any new residential complex in seconds with custom floor counts, units per floor, automated unit number mapping, shared terrace/parking attributes, and tailored fee formulas.
* **Strict Tenant Data Isolation:** All financial queries, resident directories, maintenance tickets, and notices are strictly tenant-scoped to eliminate Cross-Society IDOR risks.
* **21n Minimalist Design System:** Built on a daylight canvas (`#ffffff` Snow, `#f9f9fb` Fog, `#eff0f6` Mist, `#e5e7eb` Silver hairline borders, `#333333` Charcoal single filled pill action buttons, and humanist **Sen** typography with zero drop shadows).
* **Fully Responsive:** Mobile-first responsive layouts, collapsible showcase cards, touch-optimized inputs (preventing iOS Safari auto-zoom), and responsive modals.
* **Audited & Hardened:** 9 security vectors remediated and verified through an automated end-to-end regression suite (16/16 tests passing).
* **OCI Always Free Cloud Ready:** Complete multi-stage Docker containerization, non-root `USER node` runtime, Nginx reverse proxy configuration, and automated PostgreSQL backup scripts.

---

## 🏢 Architectural Capabilities

### 1. Resident Self-Registration & Administrative Verification Gate
* **Self-Service Resident Onboarding:** New residents select their apartment complex, pick their floor and flat, declare occupancy (*Property Owner* vs. *Tenant Occupant*), and provide contact details.
* **Privilege Escalation Prevention:** Self-registration is strictly locked to `Role.RESIDENT`. Users cannot self-assign administrative roles.
* **Server-Side Approval Gate:** New registrations start in `PENDING` approval. Express API endpoints strictly enforce server-side approval checks (`requireApprovedUser` middleware), returning HTTP 403 Forbidden until verified by management.
* **1-Click Admin Approval:** RWA Secretaries receive an instant notification banner on the dashboard to verify occupancy claims and approve or reject resident access in one click.

### 2. Strict Financial Privacy & Maintenance Collections
* **Area Pro-Rated Billing:** Automated dues calculated dynamically:
  $$\text{Total Due} = \text{Fixed Base Charge (e.g. ₹500)} + (\text{Super Built-Up Area} \times \text{₹2.50/sq.ft.})$$
* **Role-Based Financial Isolation:**
  * **Residents:** Strictly restricted to viewing their personal unit fee status, payment submissions, and official receipts. Other flats' dues are completely masked.
  * **Administrator:** Complete society ledger covering all units, collection totals, defaulter counts, and batch monthly dues generator.
* **Flexible Bank & UPI Payment Workflow:** Direct society QR / VPA with Bank UTR/reference submission and proof screenshot upload.
* **Duplicate UTR Protection:** Prevents duplicate payment claims across all units through both PostgreSQL unique constraints (`Payment.utrNumber @unique`) and controller-level conflict checks returning HTTP 409 Conflict with unit attribution.
* **Verification & Rejection Lifecycle:**
  * Status transitions: `PENDING` $\rightarrow$ `SUBMITTED_FOR_VERIFICATION` $\rightarrow$ `VERIFIED` or `REJECTED`.
  * **Admin Rejection:** Administrator can reject fraudulent or mismatched payments with mandatory rejection feedback.
  * **Resident Feedback & Resubmission:** Residents whose claims are rejected see an alert banner explaining the admin's reason and can resubmit corrected reference details.
* **Audit-Proof PDF Receipts:** Programmatically generated PDF receipts (`RCP-YYYYMM-FLAT`) with digital verification stamps via PDFKit issued only after admin approval.
* **Transparent Expense Ledger:** Itemized common expenses (Water tankers, Cleaning, Lift AMC, Electrical repairs) visible to verified residents for community trust.

### 3. Maintenance Ticket Tracking & Operations
* **Report In-Unit or Common Area Issues:** Electrical, plumbing, lift, terrace, or general maintenance with severity level (`Emergency`, `High`, `Medium`, `Low`) and preferred inspection time slots.
* **Operations Lifecycle:** `OPEN` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED`.
* **Staff Assignment:** Dispatch to building technicians (e.g., Ramesh Kumar, Electrician & Plumber) with resolution remarks.

### 4. Society Notices & WhatsApp Broadcasting
* **Notice Priority System:** `Urgent` (pinned alert banner across screens), `Important`, and `General`.
* **One-Click WhatsApp Share:** Pre-formats broadcast text and deep-links directly to WhatsApp for instant community broadcast.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite 8 + TypeScript | Tailwind CSS v4, Lucide Icons, Sen typography, View Transitions API |
| **Backend** | Node.js + Express + TypeScript | REST APIs, HTTP-only JWT cookies & Bearer tokens, Multer, PDFKit |
| **Database** | PostgreSQL 16 + Prisma ORM | Relational integrity, ACID transactions (Supabase & Docker compatible) |
| **Deployment** | Docker & Docker Compose | Multi-stage Alpine container, non-root `USER node`, Nginx reverse proxy |

---

## 📂 Project Directory Structure

```text
atrium/
├── .dockerignore                          # Build ignore for Linux containerization
├── .env.production.example               # Production environment template for OCI
├── .gitignore                            # Root ignore for node_modules, builds, secrets
├── docker-compose.yml                    # Multi-container orchestration (App + Postgres)
├── docker-entrypoint.sh                  # Automated schema migrations & seeding on startup
├── Dockerfile                            # Multi-stage production Docker build
├── DEPLOYMENT.md                         # Free cloud deployment guide (Render + Supabase)
├── OCI_DEPLOYMENT_GUIDE.md               # Oracle Cloud (OCI) Always Free production runbook
├── SECURITY_AUDIT.md                     # Security audit & defense-in-depth report (16/16 tests)
├── README.md                             # Architectural documentation & developer guide
├── nginx/
│   ├── atrium.conf                       # Production Nginx reverse proxy configuration
│   └── mygate.conf                       # Upstream proxy config
├── client/                               # React 19 Single Page Application
│   ├── index.html                        # Entry HTML with circular Atrium SVG favicon
│   ├── package.json
│   ├── vite.config.ts                    # Vite 8 config with Tailwind v4 & React plugin
│   ├── public/
│   │   ├── favicon.svg                   # Dynamic theme-adaptive circular Atrium favicon
│   │   └── manifest.json                 # Web App Manifest for mobile PWA install
│   └── src/
│       ├── main.tsx                      # React DOM root render
│       ├── App.tsx                       # Main layout, route switching & approval gate
│       ├── index.css                     # 21n design tokens & drafting grid
│       ├── types/index.ts                # TypeScript domain models
│       ├── context/AuthContext.tsx       # Auth state, JWT session management, alias login
│       ├── services/api.ts               # HTTP client with auth headers & receipt downloads
│       ├── pages/
│       │   ├── Login.tsx                 # Sign in, resident registration & demo switcher
│       │   ├── Dashboard.tsx             # Society metrics & role-based overview
│       │   ├── DuesPage.tsx              # Maintenance dues, UPI modal & admin ledger
│       │   ├── ComplaintsPage.tsx        # Maintenance tickets & technician assignment
│       │   ├── ExpensesPage.tsx          # Itemized common expenses ledger
│       │   ├── FlatsDirectoryPage.tsx    # Unit directory & floor-by-floor view
│       │   ├── NoticesPage.tsx           # Announcements & WhatsApp broadcasting
│       │   └── FeedbackPage.tsx          # Admin feedback collection viewer
│       └── components/
│           ├── auth/PendingApprovalScreen.tsx
│           ├── common/ (Badge, Modal, ThemeToggle, PlatformShowcase, FeedbackModal)
│           ├── complaints/ (NewComplaintModal, UpdateComplaintModal)
│           ├── finance/ (PayDueModal, VerifyPaymentModal, AddExpenseModal)
│           ├── flats/EditFlatModal.tsx
│           ├── layout/Navbar.tsx
│           ├── notices/ (NewNoticeModal, WhatsAppShareButton)
│           └── society/CreateSocietyModal.tsx
└── server/                               # Express REST API Backend
    ├── package.json
    ├── prisma/
    │   ├── schema.prisma                 # PostgreSQL multi-tenant relational schema
    │   └── seed.ts                       # Database seeder (2 societies, 36 units, residents)
    ├── scripts/
    │   └── security-audit.ts             # Automated 16-step security regression test suite
    └── src/
        ├── server.ts                     # Express app setup, rate limiting, static resolver
        ├── config/prisma.ts              # PrismaClient connection pool
        ├── controllers/                  # Auth, Societies, Flats, Finance, Complaints, Notices
        ├── middleware/                   # JWT auth, tenant scoping, role gating, uploads
        ├── routes/                       # REST endpoint definitions
        ├── services/pdf.service.ts       # PDFKit digital receipt generator
        └── utils/jwt.ts                  # Cryptographic JWT issuing & verification
```

---

## 🚀 Getting Started Locally

### Prerequisites
* **Node.js** (v20+)
* **PostgreSQL** running locally on port `5432` with a database named `atrium` (or Supabase URL)

### 1. Backend Server Setup
```bash
cd server
npm install

# Push database schema & generate Prisma client
npx prisma db push

# Seed sample societies (Royal Orchid & Greenwoods Enclave), flats, dues, and notices
npm run prisma:seed

# Start development API server (runs on http://localhost:5001)
npm run dev
```

### 2. Frontend Client Setup
```bash
cd client
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🐳 Running with Docker Compose

To run the complete production stack (PostgreSQL + Node.js API + Static Vite SPA) locally or in the cloud:

```bash
# 1. Create your environment configuration
cp .env.production.example .env

# 2. Start the application & isolated PostgreSQL container
docker compose up -d --build

# 3. View startup logs
docker compose logs -f app
```

The portal is now running at `http://localhost:5001`.

---

## 🔑 Pre-Seeded Demo Accounts (Available in 1-Click UI Switcher)

| Account | Role | Email | Password | Status / Testing Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin** | Platform Owner | `superadmin@atrium.local` | `superadmin123` | Universal cross-society oversight & administration |
| **Rajesh Sharma** | Royal Orchid Secretary | `admin@atrium.local` | `admin123` | Full administrator portal, pending approval queue, 24-unit ledger |
| **Vikram Seth** | Greenwoods Secretary | `greenwoods.admin@atrium.local` | `admin123` | Multi-tenant proof: isolated 12-unit Greenwoods Enclave ledger |
| **Adarsh Singh** | Resident (Flat 203) | `flat203@atrium.local` | `resident123` | October dues **Paid & Verified** • Download official PDF receipt |
| **Sunil Deshmukh** | Resident (Flat 201) | `flat201@atrium.local` | `resident123` | Payment **Submitted for Verification** (UTR awaiting admin check) |
| **Kavita Reddy** | Resident (Flat 402) | `flat402@atrium.local` | `resident123` | Dues **Pending** • Active kitchen plumbing complaint |
| **Anand Murthy** | Greenwoods Resident | `gw202@atrium.local` | `resident123` | Greenwoods Enclave resident (Flat 202) • Dues Paid |
| **Ramesh Kumar** | Maintenance Staff | `staff@atrium.local` | `staff123` | Assigned electrical & plumbing tickets, status updater |
| **Suresh Gowda** | Greenwoods Staff | `greenwoods.staff@atrium.local` | `staff123` | Assigned parking seepage & facility tickets |

> **Note on Resident Accounts:** Pre-seeded resident accounts for all units follow `flat<UNIT>@atrium.local` for Royal Orchid (e.g. `flat101@atrium.local` to `flat406@atrium.local`) and `gw<UNIT>@atrium.local` for Greenwoods with password `resident123`.

---

## 📖 Deployment Guides

* 👉 **[Oracle Cloud Infrastructure (OCI) Always Free Runbook](OCI_DEPLOYMENT_GUIDE.md):** Complete guide for provisioning an Always Free VM, Ubuntu firewall rules, Docker Compose setup, Nginx reverse proxy, Certbot SSL, and daily automated database backups.
* 👉 **[Security Audit & Hardening Report](SECURITY_AUDIT.md):** Detailed breakdown of all 9 remediated security vulnerabilities and automated test coverage.
* 👉 **[Alternative Cloud Blueprint (Render + Supabase)](DEPLOYMENT.md):** Free-tier instructions for hosting the unified web service on Render with Supabase PostgreSQL.

---

## 📄 License

MIT License. Designed and built by [Adarsh Singh](https://github.com/adarshsingh).
