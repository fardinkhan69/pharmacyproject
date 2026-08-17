# PharmaCare — Pharmacy Management System

A Minimal MVP for managing medicines and generating customer bills.

**Course:** CSE 3206 — Software Engineering Sessional | Lab 2 | Group 06 Section A

---

## Stack

| Concern | Choice |
|---|---|
| Frontend | React 18 + Vite |
| Router | React Router v6 |
| Styling | Vanilla CSS (dark mode) |
| Backend / Auth / DB | Supabase |

---

## Setup Guide

### 1. Supabase — Run the Database Migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** → **New query**
4. Open and paste the full contents of:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
5. Click **Run**

This creates:
- `medicines` table with all required columns and constraints
- `bills` table with unique sequential bill numbers
- `bill_items` table with stored price/name snapshots
- Row Level Security (RLS) on all three tables
- `create_bill(items JSONB)` atomic RPC function

Deploy the administrator-creation Edge Function from the project directory:

```bash
npx --yes supabase@latest functions deploy create-admin --project-ref lvhgzvpflaakdnhmapyh --use-api
```

The hosted function uses Supabase's auto-provisioned credentials through `@supabase/server`; no custom function secret is required. Never add a Supabase secret/service-role key to the frontend environment file.

### 2. Supabase — Create the Pharmacy Administrator Account

1. In Supabase Dashboard → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email and password for the administrator
4. Click **Create user**

> Do not enable public signup. Only this one manually-created account can log in.

### 2a. Optional — Load Demo Data

For a presentation-ready database, run `supabase/seed.sql` in the Supabase SQL Editor after the migration. It adds a varied medicine inventory and six historical bills. The script uses fixed demo IDs and is safe to run more than once.

### 3. Environment Variables

The `.env.local` file already contains your credentials. For reference, copy `.env.example` if setting up on another machine:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

> Never commit `.env.local` to Git. It is already in `.gitignore`.

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Production Build

```bash
npm run build
```

---

## Application Routes

| Route | Description | Auth Required |
|---|---|---|
| `/login` | Administrator login | No |
| `/dashboard` | Summary cards + quick actions | Yes |
| `/medicines` | Medicine list, search, add/edit/delete | Yes |
| `/bills/new` | Create a new bill | Yes |
| `/bills` | Bill history | Yes |
| `/bills/:id` | Bill details + print | Yes |
| `/admins` | Create another administrator | Yes |

---

## Feature Summary

### Authentication
- Email + password login via Supabase Auth
- Protected routes (redirect to /login if unauthenticated)
- Logout from sidebar
- Authenticated administrators can create another confirmed administrator account

### Dashboard
- Total active medicines count
- Low stock count (quantity <= 5)
- Total bills count
- Quick action buttons: Add Medicine, Create Bill

### Medicine Management
- Add medicine (name, generic name, category, price, quantity, expiry)
- View all active medicines in a table
- Search by name or generic name
- Edit any medicine field
- Soft delete (sets is_active = false)
- Status badges: In Stock / Low Stock / Out of Stock / Expired

### Billing
- Search available medicines (active + not expired + in stock)
- Add medicines to bill, enter quantities
- Live line total and grand total (Bangladeshi Taka)
- Generate bill via atomic create_bill RPC
- Stock reduces automatically after bill generation
- View bill details with receipt layout
- Print bill (browser print, A4 compatible, navigation hidden)
- Bill history sorted newest first

---

## Git Branch Strategy

| Branch | Scope |
|---|---|
| feature/auth-dashboard | Login, logout, protected routes, dashboard |
| feature/medicine-management | Medicine list, add/edit/delete, search, statuses |
| feature/billing | Create bill, bill history, bill details, print |

---

## Known Limitations (MVP Scope)

- No signup page — administrator account created manually in Supabase
- No password reset (out of scope for MVP)
- No pagination (acceptable for MVP scale)
- No PDF generation — browser print only
- No VAT, tax, or discounts (by design)
- No bill editing or deletion (by design)
