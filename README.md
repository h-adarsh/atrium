# Atrium — Apartment Community & Society Management Platform

## Multi-Tenant Residential Operations, Area-Based Maintenance Ledgers, and Secure RWA Governance

**Atrium** is a modern, transparent, and security-first multi-tenant building operations platform built for residential apartment complexes, gated societies, and Resident Welfare Associations (RWAs). It eliminates fragmented WhatsApp coordination, manual paper receipts, and error-prone spreadsheets by providing automated area-pro-rated maintenance billing, digital payment verification audit trails, technician ticketing workflows, and one-click society onboarding. Designed with strict multi-tenant database isolation, Atrium ensures every residential community operates in complete financial privacy with role-based governance gates.

---

### Tech Stack

- **Client** - React 19, Vite 8, TypeScript, Tailwind CSS v4, Lucide Icons, Sen Typography, View Transitions API
- **Server** - Node.js, Express, TypeScript, PostgreSQL 16, Prisma ORM, JWT (HTTP-Only Cookies & Bearer), PDFKit, Docker

---

## Architecture & System Workflow

The diagram below illustrates how residents, management committees, and maintenance staff interact within Atrium's tenant-scoped boundaries:

```mermaid
flowchart TD
    subgraph Residents_Users["Residents & Property Owners"]
        A["Resident Portal (React 19 / 21n Minimalist UI)"]
        B["Self-Registration (Flat Selection & Proof)"]
        C["Maintenance Dues (UPI / Bank UTR Submission)"]
        D["Maintenance Ticket Tracker"]
    end

    subgraph Security_Gateways["Atrium Express API Gateway"]
        E["JWT Auth Guard & Cookie Parser"]
        F["Approval Gate Middleware (requireApprovedUser)"]
        G["Tenant Scoping Guard (society_id Enforcement)"]
        H["Duplicate UTR Conflict Detector (@unique)"]
    end

    subgraph RWA_Management["Management Committee (RWA)"]
        I["Admin Dashboard & Approval Queue"]
        J["Society Maintenance Ledger & Defaulter List"]
        K["PDFKit Receipt Verification Engine"]
        L["Staff Dispatch & WhatsApp Broadcast"]
    end

    subgraph Data_Layer["Storage & Isolation"]
        M[("PostgreSQL 16 Database (Prisma ORM)")]
    end

    B -->|"POST /api/auth/register (Status: PENDING)"| E
    E --> F
    I -->|"1-Click Approval / Rejection"| F
    F -->|"Persist Approval"| M

    C -->|"Submit Payment Claim"| H
    H -->|"Lock UTR / Prevent Double Claim"| G
    G --> M

    I -->|"Verify Payment Claim"| K
    K -->|"Issue Signed PDF Receipt (RCP-YYYYMM-FLAT)"| C
    K --> M

    D -->|"Log Issue (Plumbing, Electrical)"| G
    G --> L
    L -->|"Assign Technician"| M
```

---

## Installation and Usage Instructions (For End-Users)

If you are an evaluator, society administrator, or resident who wants to run and explore Atrium locally without modifying the codebase, follow these simple steps:

### 1. Quick Launch (Run Locally with Docker Compose)

Ensure you have **Docker Desktop** installed on your system. Run the complete pre-configured stack (PostgreSQL database, Node.js API, and Vite SPA):

```bash
# 1. Clone the repository
git clone https://github.com/adarshsingh/atrium.git
cd atrium

# 2. Copy the production environment template
cp .env.production.example .env

# 3. Launch the containers
docker compose up -d --build
```

Once initialized, open your browser:
- **Atrium Web Portal:** [http://localhost:5001](http://localhost:5001) *(or [http://localhost:5173](http://localhost:5173) if running dev servers)*
- **API Status & Health Check:** [http://localhost:5001/api/health](http://localhost:5001/api/health)

*(To stop the platform at any time, run: `docker compose down`).*

---

### 2. Pre-Seeded Demo Accounts (1-Click Switcher Available)

Atrium includes a one-click demo login switcher on the login page for rapid role-based testing:

| Account Name | Role | Email | Password | Primary Testing Capability |
| :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin** | Platform Owner | `superadmin@atrium.local` | `superadmin123` | Global cross-society oversight and new society onboarding |
| **Rajesh Sharma** | RWA Secretary | `admin@atrium.local` | `admin123` | Royal Orchid portal: pending approvals, 24-unit ledger, expense logs |
| **Vikram Seth** | RWA Secretary | `greenwoods.admin@atrium.local` | `admin123` | Multi-tenant proof: isolated 12-unit Greenwoods Enclave ledger |
| **Adarsh Singh** | Resident (Flat 203) | `flat203@atrium.local` | `resident123` | Dues **Paid & Verified** • Download official PDF receipt |
| **Sunil Deshmukh** | Resident (Flat 201) | `flat201@atrium.local` | `resident123` | Dues **Submitted for Verification** (UTR awaiting admin check) |
| **Kavita Reddy** | Resident (Flat 402) | `flat402@atrium.local` | `resident123` | Dues **Pending** • Active kitchen plumbing maintenance ticket |
| **Ramesh Kumar** | Maintenance Staff | `staff@atrium.local` | `staff123` | Technician portal: view and resolve assigned plumbing/electrical jobs |

> **Note on Resident Accounts:** All units follow `flat<UNIT>@atrium.local` for Royal Orchid (e.g., `flat101@atrium.local` to `flat406@atrium.local`) and `gw<UNIT>@atrium.local` for Greenwoods with password `resident123`.

---

### 3. How to Use the System as a Consumer

#### Resident Onboarding & Approval
1. Navigate to `/login` and select **Register New Resident**.
2. Select your society (*Royal Orchid Apartments* or *Greenwoods Enclave*), choose your floor and flat, and declare occupancy (*Property Owner* or *Tenant Occupant*).
3. Upon registration, your account enters `PENDING` status. 
4. The RWA Secretary receives an instant dashboard notification banner to verify your residency and approve access in one click.

#### Paying Maintenance Dues & Downloading Receipts
1. Log in as a resident (`flat203@atrium.local`).
2. View your dynamically calculated area pro-rated maintenance dues:
   $$\text{Total Due} = \text{Fixed Base Charge (₹500)} + (\text{Super Built-Up Area} \times \text{₹2.50/sq.ft.})$$
3. Scan the society UPI QR code, complete the bank transfer, and enter your 12-digit UTR/transaction reference number.
4. Once the RWA Secretary marks your payment as verified, click **Download Receipt** to generate an official, tamper-evident PDF receipt (`RCP-YYYYMM-FLAT`).

#### Reporting Maintenance Issues
1. Navigate to the **Complaints** tab.
2. Click **New Ticket**, select the category (*Plumbing*, *Electrical*, *Lift*, *Common Area*), set severity (*Emergency*, *High*, *Medium*, *Low*), and select a preferred inspection time.
3. Track technician dispatch and resolution updates in real time.

#### Viewing Society Notices & Expenses
1. Access the **Notices** page to view pinned urgent updates and general announcements.
2. Admins can click **Share to WhatsApp** to broadcast announcements directly to society WhatsApp groups.
3. Review the **Expenses** ledger for complete transparency over common funds (water tankers, elevator AMC, security guards).

---

#### Consuming via REST API (Direct Client Usage)
End-users and external integrations can interact directly with the REST endpoints:

- **Authenticate as Resident or Admin:**
  ```bash
  curl -i -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@atrium.local",
      "password": "admin123"
    }'
  ```

- **Submit Payment Reference (UTR Submission):**
  ```bash
  curl -i -X POST http://localhost:5001/api/finance/payments \
    -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{
      "due_id": "due_october_2026_flat203",
      "utr_number": "UTR987654321012",
      "payment_mode": "UPI"
    }'
  ```

- **Query Society Maintenance Ledger (Admin Only):**
  ```bash
  curl -i -X GET "http://localhost:5001/api/finance/ledger?society_id=soc_royal_orchid_01" \
    -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
  ```

---

## Installation and Usage Instructions (For Contributors)

Follow these technical instructions to clone the repository, set up local database connections, run Prisma migrations, seed sample complexes, and execute test suites.

### Prerequisites

- **Node.js:** v20.0.0+ LTS
- **npm:** v10.0.0+
- **PostgreSQL Database:** Running locally on port `5432` with a database named `atrium` (or a Supabase connection URL)

---

### Step 1: Clone Repository & Install Dependencies

```bash
git clone https://github.com/adarshsingh/atrium.git
cd atrium

# Install root & workspace packages
npm install
```

---

### Step 2: Environment Configuration

Configure the server environment file:
```bash
cd server
cp .env.example .env
```

Ensure your `.env` contains:
```env
PORT=5001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/atrium?schema=public"
JWT_SECRET=super_secret_jwt_key_at_least_32_characters_long
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

### Step 3: Database Provisioning, Schema Sync & Seeding

1. Push the Prisma schema directly to your PostgreSQL instance:
   ```bash
   cd server
   npx prisma db push
   ```

2. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Seed the database with two distinct societies (*Royal Orchid Apartments* with 24 units and *Greenwoods Enclave* with 12 units), complete with residents, dues, and tickets:
   ```bash
   npm run prisma:seed
   ```

---

### Step 4: Start Development Servers

1. **Start Express Backend (Terminal 1):**
   ```bash
   cd server
   npm run dev
   ```
   *Backend API runs at `http://localhost:5001`.*

2. **Start Vite React Frontend (Terminal 2):**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *Frontend Client runs with HMR at `http://localhost:5173`.*

---

### Step 5: Running Automated Security & Regression Tests

Run the automated 16-step security regression test suite (verifying tenant isolation, IDOR prevention, UTR collision handling, and privilege escalation guards):

```bash
cd server
npx tsx scripts/security-audit.ts
```

All 16 security regression vectors pass with 100% success rate:
- ✅ **Privilege Escalation:** Self-registration strictly enforces `Role.RESIDENT`.
- ✅ **Approval Barrier:** Unapproved users are rejected with HTTP 403 Forbidden.
- ✅ **Cross-Society IDOR:** Admin A cannot view, edit, or delete records belonging to Society B.
- ✅ **Financial Privacy:** Residents querying another unit's fees receive HTTP 403 Forbidden.
- ✅ **Duplicate UTR Prevention:** Identical UTR claims are rejected with HTTP 409 Conflict.
- ✅ **Tamper-Evident Receipts:** PDF receipts verify digitally against approved database records.

---

## Contributor Expectations

We welcome contributions to Atrium! To maintain architectural purity, multi-tenant boundaries, and strict financial audit trails, all contributors must adhere to the following standards:

### 1. Workflow & Issues Protocol
- Open an issue prior to implementing major features, financial logic changes, or schema modifications.
- Reference the issue number in all pull requests.

### 2. Branch Naming Conventions
- `feature/<short-description>` — New capabilities (e.g., `feature/visitor-gate-pass`)
- `fix/<short-description>` — Bug fixes (e.g., `fix/utr-trim-validation`)
- `docs/<short-description>` — Documentation updates (e.g., `docs/api-contracts`)
- `refactor/<short-description>` — Code cleanup without behavioral changes

### 3. Commit Message Standards
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: implement area pro-rated dues calculation formula`
- `fix: resolve race condition in technician assignment modal`
- `test: add automated test case for cross-tenant notice isolation`
- `docs: update contributor setup steps for local PostgreSQL`

### 4. Architectural & Security Ground Rules
- **Mandatory Tenant Scoping:** Every single Prisma query that reads or mutates financial, resident, or ticket records must include `society_id` scoping (`WHERE society_id = session.society_id`) to prevent cross-tenant IDOR vulnerabilities.
- **Server-Side Approval Checks:** Never rely on UI gates alone. All protected endpoints must chain the `requireApprovedUser` middleware.
- **Financial Integrity:** Payment UTR numbers must strictly enforce uniqueness constraints at both the database and controller levels.
- **Minimalist 21n Design Compliance:** All frontend additions must follow the 21n design discipline: Snow (`#ffffff`), Fog (`#f9f9fb`), Mist (`#eff0f6`), hairline borders (`#e5e7eb`), single filled Charcoal pill buttons (`#333333`), and humanist Sen typography with zero artificial drop shadows.

### 5. Pull Request Checklist
1. All 16 automated security tests must pass (`npx tsx scripts/security-audit.ts`).
2. Client TypeScript checks and production build must succeed (`npm run build`).
3. No environment secrets or database credentials committed to version control.
4. Link the relevant issue (`Closes #<issue_number>`).
