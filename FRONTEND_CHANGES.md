# Frontend Changes — VendorPay

This document covers every change made to the frontend codebase. Read it top-to-bottom — each section builds on the previous one.

---

## 1. Docker Build Fix

**File:** `src/pages/auth/forgotpassword.jsx` → renamed to `src/pages/auth/ForgotPassword.jsx`

The file was named in all-lowercase but imported with mixed case in `App.jsx`:

```js
import ForgotPassword from './pages/auth/ForgotPassword';
```

macOS (case-insensitive filesystem) masked the mismatch locally. Docker runs on Linux (case-sensitive), so the build failed with `UNRESOLVED_IMPORT`. Renaming the file to match the import fixes it.

---

## 2. Nginx Sub-path Deployment (`/vendorpay-fr/`)

The frontend is served at `/vendorpay-fr/` on the EC2 server (see `/etc/nginx/sites-available/myapp`). Three changes were required to make the React app aware of this.

### 2a. Vite base path

**File:** `vite.config.js`

```js
// before
export default defineConfig({ plugins: [react()], server: { ... } })

// after
export default defineConfig({ plugins: [react()], base: '/vendorpay-fr/', server: { ... } })
```

Without this, Vite builds asset URLs as `/assets/index.js`. With it, they become `/vendorpay-fr/assets/index.js`, which nginx routes correctly through the `/vendorpay-fr/` proxy location.

### 2b. BrowserRouter basename

**File:** `src/App.jsx`

```jsx
// before
<BrowserRouter>

// after
<BrowserRouter basename="/vendorpay-fr">
```

Without a basename, React Router treats the full pathname (including `/vendorpay-fr`) as the route to match. No routes would match, so the `*` wildcard would fire and redirect to login on every page load.

### 2c. Auth-failure redirect

**File:** `src/lib/apiClient.js`

```js
// before (both occurrences)
window.location.href = '/login';

// after
window.location.href = '/vendorpay-fr/vendorpay/login';
```

On a 401 error (expired/missing token), the client does a hard redirect. The old path `/login` hits nginx's `location /` which proxies to the main app on port 3005 — not the VendorPay frontend. The corrected path goes through the `/vendorpay-fr/` nginx location, which serves the correct SPA.

---

## 3. Routing Fixes — Missing `/vendorpay` Prefix

All routes in `App.jsx` are defined under the `/vendorpay/` namespace (e.g. `/vendorpay/vendor/dashboard`). Across the codebase, almost every `navigate()` call and sidebar link was missing this prefix, causing the React Router `*` wildcard to catch them and redirect to login.

### Files changed and what was fixed

**`src/components/layout/Sidebar.jsx`**
- All vendor nav items: `/vendor/dashboard` → `/vendorpay/vendor/dashboard`, same for invoices and payments
- All admin nav items: `/admin/dashboard` → `/vendorpay/admin/dashboard`, same for vendors, invoices, payments
- Support link for both roles
- Logout button: `navigate('/login')` → `navigate('/vendorpay/login')`

**`src/pages/auth/Login.jsx`**
- Post-login redirect: `/admin/dashboard` → `/vendorpay/admin/dashboard`
- Post-login redirect: `/vendor/dashboard` → `/vendorpay/vendor/dashboard`
- Forgot password link: `/forgot-password` → `/vendorpay/forgot-password`
- Register link: `/register` → `/vendorpay/register`

**`src/pages/auth/Register.jsx`**
- Post-register redirect: `/login` → `/vendorpay/login`
- "Sign In" link: `/login` → `/vendorpay/login`

**`src/pages/onboarding/Onboarding.jsx`**
- Post-onboarding redirect: `/vendor/dashboard` → `/vendorpay/vendor/dashboard`

**`src/pages/vendor/VendorDashboard.jsx`**
- FAB button: `/vendor/invoices/new` → `/vendorpay/vendor/invoices/new`

**`src/pages/vendor/InvoiceHistory.jsx`**
- "Submit New Invoice" button: `/vendor/invoices/new` → `/vendorpay/vendor/invoices/new`
- Row view button: `/vendor/invoices/${id}` → `/vendorpay/vendor/invoices/${id}`

**`src/pages/vendor/InvoiceDetail.jsx`**
- Back button: `/admin/invoices` / `/vendor/invoices` → with `/vendorpay/` prefix

**`src/pages/vendor/SubmitInvoice.jsx`**
- Post-submit redirect: `/vendor/invoices` → `/vendorpay/vendor/invoices` (both occurrences)

**`src/pages/admin/AdminDashboard.jsx`**
- Navigate to invoices: `/admin/invoices` → `/vendorpay/admin/invoices`
- Navigate to payments: `/admin/payments` → `/vendorpay/admin/payments`

**`src/pages/admin/AdminVendors.jsx`**
- Vendor row navigate: `/admin/vendors` → `/vendorpay/admin/vendors`

**`src/pages/admin/VendorDetail.jsx`**
- Back button (×2): `/admin/vendors` → `/vendorpay/admin/vendors`

**`src/pages/admin/AdminInvoiceManagement.jsx`**
- View invoice button: `/admin/invoices/${id}` → `/vendorpay/admin/invoices/${id}`

---

## 4. Backend Integration — Pages Wired to API

Before these changes, most pages used hardcoded data or a local in-memory store (`invoiceStore`). All pages are now connected to the real backend.

### 4a. New service methods added

**`src/lib/services/vendorService.js`** — three methods added:

| Method | Endpoint |
|---|---|
| `getAdminDashboard()` | `GET /vendors/admin/dashboard` |
| `getAllVendors()` | `GET /vendors/` |
| `getVendorById(id)` | `GET /vendors/{id}` |

**`src/lib/services/invoiceService.js`** — three methods added:

| Method | Endpoint |
|---|---|
| `getAdminInvoiceDetail(invoiceId)` | `GET /invoices/all/{id}` |
| `downloadAdminInvoicePdf(invoiceId)` | `GET /invoices/all/{id}/pdf` |
| `getAdminPayments({ page, page_size })` | `GET /invoices/admin/payments` |

### 4b. Pages rewired

#### `src/pages/vendor/VendorDashboard.jsx`
- **Was:** Hardcoded stat numbers and chart arrays
- **Now:** Calls `vendorService.getDashboard()` on mount
- Response fields used: `first_name`, `total_invoices`, `pending_approval_count`, `paid_this_month`, `total_amount_paid_ytd`, `payment_trends[]`, `status_distribution.{ paid_pct, pending_pct, flagged_pct }`
- Loading and error states added

#### `src/pages/vendor/VendorPayments.jsx`
- **Was:** Filtered from local `invoiceStore`
- **Now:** Calls `invoiceService.getMyInvoices({ status: 'paid' })` on mount
- Shows real paid invoices: invoice number, payment date, amount, currency
- Loading and error states added

#### `src/pages/vendor/InvoiceDetail.jsx`
- **Was:** Read invoice from local `invoiceStore`, hardcoded audit log, `isAdmin` detected from `window.location.pathname.startsWith('/admin')` (broken with basename)
- **Now:**
  - Fetches from `invoiceService.getMyInvoiceDetail(id)` for vendors, `invoiceService.getAdminInvoiceDetail(id)` for admins
  - `isAdmin` determined from `useAuth()` role (not the URL)
  - Audit log rendered from real `invoice.audit_logs[]` (each entry has `action`, `performed_by`, `notes`, `timestamp`)
  - Admin approve button only shown when `invoice.status === 'submitted'`
  - Admin mark-paid button only shown when `invoice.status === 'funding'`
  - Both buttons trigger the relevant `adminInvoiceService` mutation and refetch the invoice
  - Download calls the correct PDF endpoint based on role

#### `src/pages/admin/AdminDashboard.jsx`
- **Was:** All four stat cards and recent payouts hardcoded
- **Now:** Stat cards fetch from `vendorService.getAdminDashboard()`
- Response fields used: `total_vendors`, `pending_invoices`, `pending_payments`, `monthly_volume`, `status_breakdown`
- Status breakdown rendered as a live count row
- Charts and quick-action links kept; "Recent Payouts" section replaced with navigation shortcuts

#### `src/pages/admin/AdminVendors.jsx`
- **Was:** Hardcoded `VENDORS` array with 5 dummy entries
- **Now:** Fetches from `vendorService.getAllVendors()` on mount
- Columns: Company (name + business type), Contact (name + email), Industry, Status (Active if `is_onboarded`, Pending otherwise)
- Client-side search across name, email, and industry
- "View" link navigates to `/vendorpay/admin/vendors/{id}` using the real integer database ID

#### `src/pages/admin/VendorDetail.jsx`
- **Was:** Hardcoded `VENDORS` array, invoices from local `invoiceStore`
- **Now:** Parallel fetch of `vendorService.getVendorById(id)` + `adminInvoiceService.getAllInvoices({ vendor_id: id })`
- Displays real contact info, business details, and invoice history for that vendor
- Stat cards show live totals: invoice count, total invoiced, total paid

#### `src/pages/admin/AdminPayments.jsx`
- **Was:** Fully hardcoded `PAYMENTS` array with dummy transaction data
- **Now:** Fetches from `invoiceService.getAdminPayments()` on mount (calls `GET /invoices/admin/payments`)
- Status mapping: `paid → "Paid"`, `funding → "Awaiting Payment"`, `rejected → "Denied"`
- Columns: Vendor name, Invoice #, Payment rail (ACH/SWIFT/NIP/PESALINK), Amount, Date, Status
- Tab counts and totals computed from live data
- Client-side search across vendor name, invoice number, and payment rail

---

## 5. What Is Still Hardcoded / Not Connected

| Page / Section | What remains static | Reason |
|---|---|---|
| AdminDashboard chart | "Invoice Processing" area chart uses dummy weekly data | No backend endpoint for historical processing volume |
| InvoiceDetail AI chat | Responses are local keyword matches, not a real AI | No AI backend integration yet |
| VendorDashboard "Paid This Month" sub-label | Shows `{paid_pct}% Goal` — goal figure is not from backend | No goal/budget concept in the data model |
| VendorPayments "Method" column | Removed (was hardcoded "ACH") | Vendor payment rail not returned by `/invoices/my` endpoint |

---

## 6. Backend Changes (for reference)

Two changes were made to the backend (`vendorpaybackend`) to support the above:

1. **`vendor_name` added to admin invoice responses** — `GET /invoices/all` and `GET /invoices/all/{id}` now include `vendor_name` (the submitting vendor's company name). This fixes the blank vendor column in AdminInvoiceManagement and populates vendor identity in InvoiceDetail admin view.

2. **New endpoint `GET /api/invoices/admin/payments`** — returns invoices in `paid`, `funding`, and `rejected` status, each including `vendor_name` and `payment_rail` (from the vendor's banking `country_type`). Powers the AdminPayments page.

See the backend repo for the full diff in:
- `app/models/invoice.py` (added `vendor_name` and `payment_rail` properties)
- `app/schemas/invoice.py` (added `AdminInvoiceResponse`, `AdminInvoiceDetailResponse`, `PaymentResponse`)
- `app/api/routes/invoices.py` (updated admin route schemas, added `/admin/payments` endpoint)
