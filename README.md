# Gaulaxmi Global Wellness

Marketing site, member dashboard, and admin console for the Gaulaxmi investment platform.

## Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS v4, TypeScript
- **Backend:** Express API, JSON file database (`server/data/database.json`), JWT auth, bcrypt passwords

## Run locally (full stack)

Install dependencies:

```bash
npm install
```

Start API + main website + admin panel:

```bash
npm run dev:all
```

Or run separately:

| Command | URL | Purpose |
|---------|-----|---------|
| `npm run dev:api` | http://localhost:4000/api | REST API |
| `npm run dev` | **http://localhost:3000** | Gaulaxmi main website |
| `npm run dev:admin` | **http://localhost:3001** | Admin panel (also starts API on port 4000) |
| `npm run dev:admin:vite` | **http://localhost:3001** | Admin UI only — API must already be running |

**Main website:** **http://localhost:3000**  
**Admin panel:** **http://localhost:3001** (linked from profile menu when signed in as admin)

Copy `.env.example` to `.env` and set `JWT_SECRET` for production.

## Demo accounts (seeded on first API start)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gaulaxmi.io` | `admin123` |
| Member | `vikram@gaulaxmi.io` | `member123` |

## API overview

- `GET /api/health` — health check
- `GET /api/plans`, `GET /api/milestones` — public catalog
- `POST /api/inquiries` — contact form leads
- `POST /api/auth/register`, `POST /api/auth/login` — JWT session
- `GET /api/auth/me` — current user (Bearer token)
- `POST /api/wallet/deposit`, `POST /api/wallet/withdraw`, `POST /api/kyc/submit`, `POST /api/investments` — member actions
- `GET /api/admin/users` and `/api/admin/*` — admin-only management (plans, milestones, KYC, withdrawals, investments)

Data persists in `server/data/database.json` (gitignored). Both frontends proxy `/api` to port **4000** in development.

## Hero corporate PDF

The **Download Full PDF** button on the homepage serves `public/Gaulaxmi.pdf` (copied to `/Gaulaxmi.pdf` when the site runs). Place your presentation file there; see `public/README.md`. The file is gitignored due to size (~50MB).

## Build

```bash
npm run build        # member site → dist/
npm run build:admin  # admin → dist-admin/ (optional; main build includes dist/admin/)
npm run start:api    # production API (set SERVE_STATIC=1 to also serve dist/ + dist/admin/)
```
