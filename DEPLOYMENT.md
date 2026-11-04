# Royal Orchid — Production Hosting & Real-User Testing Blueprint

This guide provides the exact roadmap to host the **Royal Orchid Apartment Management Portal** so that real residents, RWA members, and external testers can access the live application, test features (onboarding, UPI verification, tickets, notices), and submit feedback directly inside the app.

---

## 🏛️ Recommended Architecture (100% Free Tier)

| Component | Recommended Host | Free Tier Allowance | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | [Supabase](https://supabase.com) | 500 MB Postgres • 2 projects | Relational ACID storage for flats, residents, dues, ledger |
| **Backend API** | [Render](https://render.com) or [Railway](https://railway.app) | 750 free instance hours / month | Express REST API, PDFKit receipts, Auth |
| **Frontend SPA** | [Vercel](https://vercel.com) or Unified Render | Unlimited bandwidth & HTTPS | React 19 + Vite client with instant global CDN |

> [!TIP]
> **Easiest 1-Click Deployment (Single Unified Web Service):**
> Because Express is now configured to automatically serve the production build from `client/dist`, you can deploy the **entire application (both frontend and backend) as a single Web Service on Render or Railway**! This eliminates all cross-origin CORS issues and requires managing only one deployment URL.

---

## 🚀 Option A: Unified Monolith Deployment on Render (Recommended)

### Step 1: Initialize Database on Supabase
1. Create a free account at [supabase.com](https://supabase.com) and click **New Project**.
2. Name the project `royal-orchid` and set a strong database password.
3. In your project dashboard, navigate to **Project Settings** $\rightarrow$ **Database** $\rightarrow$ **Connection Pooling**.
4. Copy the **Transaction Mode connection string** (port 6543):
   ```text
   postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Step 2: Push Database Schema & Initial Flats
From your local terminal, point Prisma to the Supabase database and push the schema:
```bash
cd server
DATABASE_URL="your-supabase-connection-string" npx prisma db push

# Seed the 24 units, initial dues, and notices
DATABASE_URL="your-supabase-connection-string" npm run prisma:seed
```

### Step 3: Deploy on Render
1. Push your latest code to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: production readiness, feedback system, and hosting configs"
   git push origin main
   ```
2. Go to [render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Select your GitHub repository (`apartment-management-portal`).
4. Configure the service settings:
   - **Environment:** `Node`
   - **Build Command:** `npm run install:all && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** `Free`
5. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `DATABASE_URL` = `your-supabase-connection-string`
   - `JWT_SECRET` = `generate-a-strong-random-secret-key-32-chars`
   - `CLIENT_URL` = `https://your-service-name.onrender.com`
6. Click **Deploy Web Service**.
7. Render will install dependencies, build the Vite frontend, compile the TypeScript backend, and launch the portal. Your live URL will be ready at:
   `https://royal-orchid-portal.onrender.com`

---

## ⚡ Option B: Decoupled Deployment (Vercel Frontend + Render Backend)

If you prefer deploying the frontend Single Page Application separately on Vercel:

### Step 1: Deploy Backend on Render
1. Set Render build command to: `cd server && npm install && npm run build`
2. Set Render start command to: `cd server && npm start`
3. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
4. Note your backend URL (e.g., `https://royal-orchid-api.onrender.com`).

### Step 2: Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com) and click **Add New** $\rightarrow$ **Project**.
2. Select your repository.
3. In **Root Directory**, click edit and select `client`.
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://royal-orchid-api.onrender.com`
5. Click **Deploy**. Vercel will build and assign an HTTPS domain (e.g. `https://royal-orchid.vercel.app`).
6. Update `CLIENT_URL` on Render to match your Vercel URL:
   `CLIENT_URL=https://royal-orchid.vercel.app`

---

## 👥 Real-User Testing & Feedback Collection Workflow

### 1. In-App Tester Feedback Widget
Real users testing the portal will see an interactive **"Feedback"** button:
- **Desktop:** Located in the top navigation header and footer.
- **Mobile Viewport:** Sticky floating pill in the bottom-right corner for quick thumb taps.
- **Features:**
  - 1 to 5 star rating scale.
  - Category selector: 🐞 Bug / Issue, 💡 Feature Request, 🎨 UI/UX Suggestion, 💬 General.
  - Text area for observations.
  - Automatically captures the current screen/tab and device info (Mobile / Desktop, screen size, OS).

### 2. Admin Feedback Review Dashboard
The administrator can review all submitted feedback in real-time:
1. Log in as Secretary (`admin@atrium.local` or your own admin account).
2. Click the **Tester Feedback** tab in the navigation bar.
3. Review metrics:
   - Total submissions
   - Average satisfaction score
   - Breakdown of bugs vs feature ideas
   - Device logs and user unit numbers

### 3. How to Conduct a User Testing Session with Real Residents
1. **Send Invitation Link via WhatsApp:**
   > *"Hello Royal Orchid Residents! We are testing our new building management portal before official launch. Please tap the link to test flat self-registration or explore October dues & maintenance tickets: https://your-domain.com. Tap the yellow 'Feedback' button anytime you spot an issue or idea!"*
2. **Onboarding Test Flow:**
   - Have residents register their actual flat (Floor 1–4, Units 101–406).
   - Log in as Secretary to approve their registration in 1 click.
3. **Payment Test Flow:**
   - Have them navigate to **My Dues & Receipts**, scan the dummy UPI QR, and submit a test bank reference (e.g. `UPI9876543210`).
   - Admin verifies the transaction and the resident downloads their generated PDF receipt.
4. **Maintenance Ticket Test Flow:**
   - Have residents submit a test ticket (e.g. "Low water pressure in kitchen") with photo attachment.
   - Admin assigns technician (Ramesh Kumar), updates progress, and closes the ticket.

---

## 🛡️ Production Readiness Checklist

- [x] **Cross-Site Auth Hardening:** Dual session strategy with JWT Bearer tokens in `localStorage` + HTTP-only cookies, preventing session drop on Safari / iOS.
- [x] **Brute-Force Rate Limiting:** `express-rate-limit` active on `/auth/login`, `/auth/register`, and `/feedback`.
- [x] **HTTP Security Headers:** `helmet` active with cross-origin resource sharing configured for PDF receipts and proofs.
- [x] **Database Safeguards:** Safe seeding check prevents accidental database wipes if `seed` is re-run.
- [x] **Mobile PWA Support:** Web App Manifest (`manifest.json`) and viewport configuration enable "Add to Home Screen" on iOS and Android.
- [x] **Deep Linking:** Hash-based URL sync (`#dues`, `#complaints`, `#notices`) supports browser back buttons and direct WhatsApp links.
- [x] **Health Check:** Live probe at `/api/health` queries PostgreSQL to verify end-to-end database connectivity.
