# Atrium Community Portal — Security Audit & Hardening Report

**Audit Date:** November 4, 2026  
**Audited Target:** `Atrium` Multi-Tenant Residential Management Platform (Node.js/Express, TypeScript, Prisma ORM, PostgreSQL, React 19)  
**Status:** **ALL VULNERABILITIES RESOLVED & VERIFIED (16/16 Automated Tests Passing)**

---

## 1. Executive Summary

A comprehensive, defense-in-depth security audit and hardening review was conducted on the `Atrium` multi-tenant apartment management platform in preparation for production cloud deployment on **Oracle Cloud Infrastructure (OCI) Always Free tier**.

The audit evaluated access control boundaries, multi-tenant data isolation, role-based privileges, authentication workflows, file upload handling, denial-of-service resilience, container privileges, and database network exposure.

During the audit, **9 distinct security vectors** were identified and systematically remediated. All patches are verified through an automated end-to-end regression test suite (`npm run test:security`) with **16 passing tests and 0 failures**.

---

## 2. Multi-Tenant Architecture & Threat Model

`Atrium` operates as a multi-tenant platform supporting multiple distinct residential societies (e.g., *Royal Orchid Apartments*, *Greenwoods Enclave*) within a unified PostgreSQL database. 

### Role Hierarchy & Privileges:
* **SUPER_ADMIN:** Platform owner with universal cross-society oversight.
* **ADMIN:** Society-level manager (Secretary/Treasurer) restricted strictly to their assigned `societyId`.
* **STAFF:** Building maintenance personnel (plumber, electrician) restricted strictly to assigned maintenance tickets in their own complex.
* **RESIDENT:** Flat owner/tenant with access strictly gated by administrator verification (`approvalStatus: APPROVED`). Restricted strictly to their assigned unit.

---

## 3. Vulnerability Findings & Remediation Details

### Vulnerability 1: Cross-Tenant IDOR on Administrative Operations
* **Severity:** **HIGH** (CWE-639 / Broken Object Level Authorization)
* **Remediation:** Strict tenant scoping (`entity.societyId === req.user.societyId`) enforced on all admin mutations (review registrations, payment verification, expense deletion, flat modification, complaints, notices).

### Vulnerability 2: Sensitive Data & Password Hash Exposure in API Responses
* **Severity:** **HIGH** (CWE-200 / Information Disclosure)
* **Remediation:** Enforced explicit projection selection (`select: { id, email, fullName, role, approvalStatus, ... }`) on both `reviewRegistration` and `getPendingRegistrations`, completely preventing internal bcrypt `passwordHash` strings from leaking over the wire.

### Vulnerability 3: Denial-of-Service (DoS) via Unbounded Society Onboarding
* **Severity:** **HIGH** (CWE-400 / Uncontrolled Resource Consumption)
* **Remediation:** Clamped floor counts (`1 <= totalFloors <= 60`) and unit density (`1 <= flatsPerFloor <= 30`), enforced batch threshold (500 units max), and added dedicated IP rate limiter (`societyCreationLimiter`).

### Vulnerability 4: Unauthenticated Resident PII Harvest on Demo Accounts Endpoint
* **Severity:** **MEDIUM** (CWE-200 / Information Disclosure)
* **Remediation:** Sandboxed to `@atrium.local` mock accounts, and strictly disabled in production (`NODE_ENV === 'production'`) unless explicitly authorized with `ENABLE_DEMO_ACCOUNTS=true`.

### Vulnerability 5: Path Traversal on Receipt File Downloads
* **Severity:** **MEDIUM** (CWE-22 / Improper Limitation of a Pathname)
* **Remediation:** Applied alphanumeric regex format validation, `path.basename` sanitization, and `filePath.startsWith(receiptsBaseDir)` containment validation.

### Vulnerability 6: Feedback Cross-Tenant Leakage
* **Severity:** **LOW** (CWE-284 / Improper Access Control)
* **Remediation:** Added `societyId` foreign key and tenant scoping to all feedback submissions and reviews.

### Vulnerability 7: Direct Static File Path Exposure for Resident Receipts & Proofs
* **Severity:** **HIGH** (CWE-284 / Improper Access Control)
* **Description:**  
  Previously, `app.use('/uploads', express.static(uploadsDir))` served all files statically without authentication. Anyone who guessed or obtained a link could directly download official tax receipts (`/uploads/receipts/receipt-RCP-202610-101.pdf`) or resident bank UPI screenshots (`/uploads/proofImage-...`) without logging in, bypassing all tenant and flat-level access checks.
* **Remediation:**  
  1. Direct static access to `/uploads/receipts` is explicitly blocked with `403 Forbidden`. Receipts can ONLY be retrieved through the authenticated multi-tenant controller (`/api/v1/finance/receipts/:receiptNumber`).
  2. The `/uploads` static route is protected with `requireAuth` and `requireApprovedUser`, ensuring unauthenticated external scrapers cannot access payment proofs or maintenance photos.

### Vulnerability 8: Sensitive Bank Account Number Exposure on Public Discovery
* **Severity:** **MEDIUM** (CWE-200 / Information Disclosure)
* **Description:**  
  The public society lookup endpoint (`GET /api/v1/societies/:slug`) returned full society banking records (`bankAccountNumber`, `bankIfscCode`) to unauthenticated visitors.
* **Remediation:**  
  Masked bank account numbers (`••••••••1234`) and IFSC codes for unauthenticated requests, only disclosing full banking details to verified residents or admins of that society.

### Vulnerability 9: Production Secret Hygiene & Public Port Exposure
* **Severity:** **HIGH** (CWE-1188 / Insecure Default Initialization of Resource)
* **Remediation:**  
  1. Server enforces startup validation: in `production`, it halts immediately if `JWT_SECRET` is unset, default, or fewer than 32 characters.
  2. Database port `5432:5432` was removed from public exposure in `docker-compose.yml`. PostgreSQL now communicates solely within the internal Docker bridge network (`atrium-internal`).
  3. Production container runtime in `Dockerfile` drops root privileges and runs as `USER node`.

---

## 4. Automated Security Verification Suite

An automated test suite is maintained at `server/scripts/security-audit.ts` to validate all security gates against live API endpoints.

To run the audit suite at any time:
```bash
cd server && npm run test:security
```

### Current Verification Results:
```text
🔒 Starting Automated Security Audit & Verification...

--- TEST GROUP 1: Multi-Tenant Cross-Society IDOR Protection ---
  ✅ PASS: Cross-tenant expense deletion blocked with 403 Forbidden
  ✅ PASS: Cross-tenant payment verification blocked with 403 Forbidden
  ✅ PASS: Cross-tenant flat modification blocked with 403 Forbidden
  ✅ PASS: Cross-tenant notice pin tampering blocked with 403 Forbidden
  ✅ PASS: Cross-tenant notice deletion blocked with 403 Forbidden
  ✅ PASS: Cross-tenant complaint resolution blocked with 403 Forbidden

--- TEST GROUP 2: Unapproved Resident Security Gate ---
  ✅ PASS: Pending resident denied private finance dues ledger (403 ACCOUNT_PENDING_APPROVAL)
  ✅ PASS: Pending resident denied complaints access (403)

--- TEST GROUP 3: Registration Review Security & PII Protection ---
  ✅ PASS: Cross-tenant resident registration review blocked (403)
  ✅ PASS: Legitimate same-society approval succeeds
  ✅ PASS: No passwordHash leakage in registration review response

--- TEST GROUP 4: Resource Exhaustion & DoS Input Boundaries ---
  ✅ PASS: Extreme floors/units input rejected with 400 Bad Request

--- TEST GROUP 5: Path Traversal Protection on Receipts ---
  ✅ PASS: Path traversal receipt request rejected safely

--- TEST GROUP 6: Production Storage & Data Exposure Controls ---
  ✅ PASS: Direct access to /uploads/receipts blocked with 403 Forbidden
  ✅ PASS: Unauthenticated /uploads access blocked with 401 Unauthorized
  ✅ PASS: Public society endpoint masks bank account number

=============================================
AUDIT RESULT: 16 PASSED, 0 FAILED
=============================================
```

---

## 5. Production Cloud Deployment on OCI Always Free

For step-by-step instructions on setting up your Oracle Cloud Compute instance, opening VCN security lists, solving the OCI host `iptables` firewall trap, running Docker containers, and setting up free SSL certificates with Nginx & Certbot, refer to:

👉 **[`OCI_DEPLOYMENT_GUIDE.md`](file:///Users/adarshsingh/Desktop/projects/myGate/OCI_DEPLOYMENT_GUIDE.md)**
