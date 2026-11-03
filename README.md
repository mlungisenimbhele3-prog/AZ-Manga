# AZ OVERVERSE

**The Pan-African Manga & Webtoon Publishing Platform — Produced by Mlungiseni Mbhele**

AZ OVERVERSE includes a complete, first-party custom authentication and Creator Studio identity system inspired by **WEBTOON Canvas** and **MANGA Plus Creators by SHUEISHA**—built with **zero Firebase Auth, zero Firestore, and zero Supabase Auth**.

---

## Custom Authentication Architecture

- **Database (`users` table on PostgreSQL)**:
  - `id` (UUID PK), `email` (unique), `password_hash`, `pen_name` (creator nickname), `studio_name`, `bio`, `avatar_url`, `email_verified` (`boolean`), `verification_token`, `reset_token`, `role` (`reader` | `creator` | `admin`), `created_at`, `updated_at`
- **Password & Token Security**:
  - `bcryptjs` password hashing (`12` salt rounds)
  - `jsonwebtoken` purpose-bound tokens: `15m` access token, `7d` refresh token in an `httpOnly` cookie, `1d` email verification JWT, and `1h` password reset JWT
  - Strict rate limiting (`5 requests / 15 minutes` on `/register`, `/login`, `/forgot`, `/reset`, and `/resend-verification`)
  - `zod` request validation on every endpoint; `password_hash`, `verification_token`, and `reset_token` are stripped before serialization
- **Transactional Emails (`Resend`)**:
  - Sends verification links (`/verify?token=xxx`) and password reset links (`/reset?token=xxx`) via `RESEND_API_KEY`
- **API Endpoints**:
  - `POST /api/auth/register`
  - `GET /api/auth/verify?token=xxx`
  - `POST /api/auth/resend-verification`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/forgot`
  - `POST /api/auth/reset`
  - `GET /api/auth/me`
  - `PATCH /api/auth/profile`
  - `POST /api/auth/logout`
- **Frontend Pages (Dark WEBTOON Canvas / MANGA Plus Creators Theme)**:
  - `/register` — Register email, creator `pen_name`, role (`creator` / `reader`), password & confirm password
  - `/login` — Sign in with verified email & password
  - `/verify` — Verifies `?token=xxx` and confirms `"Email verified"`
  - `/forgot` & `/reset` — Password recovery flow
  - `/dashboard` — Protected route (verifies JWT + `7d` `httpOnly` refresh cookie), displays `pen_name`, profile editor, Studio shortcuts, and `Logout`

---

## Live Workspace Project Structure

```text
├── .env.example
├── server.ts                              # Express + Vite server mounting /api/auth/*
├── src/
│   ├── db/
│   │   ├── drizzle.config.ts              # PostgreSQL schema configuration
│   │   ├── index.ts                       # PostgreSQL connection pool
│   │   ├── schema.ts                      # users table definition & UserRole enum
│   │   └── users.ts                       # Sanitized repository (strips password_hash)
│   ├── server/
│   │   ├── authRoutes.ts                  # /api/auth/* routes + 5 req/15m rate limiter
│   │   ├── jwt.ts                         # 15m access, 7d refresh, 1d verify, 1h reset JWTs
│   │   ├── mailer.ts                      # Resend email dispatcher
│   │   └── validation.ts                  # Zod input validation schemas
│   ├── services/
│   │   ├── oververseAuth.ts               # Client JWT + httpOnly refresh session manager
│   │   └── userProfile.ts                 # Creator Studio state bridged to custom auth
│   └── pages/
│       └── auth/
│           ├── OververseAuthPages.tsx     # /register, /login, /verify, /forgot, /reset
│           └── CreatorDashboardPage.tsx   # Protected /dashboard route
└── docs/
    └── NEXTJS14_NEON_PRISMA_BLUEPRINT.md  # Full Next.js 14 App Router + Neon + Prisma copy-paste package
```

---

## Running Locally

### 1. Live AZ OVERVERSE App (Express + React + PostgreSQL)
```bash
npm install
cp .env.example .env
# Set JWT_SECRET and RESEND_API_KEY in .env
npm run dev
# Opens on http://localhost:3000
```

### 2. Standalone Next.js 14 App Router + Neon + Prisma Export
See **[`docs/NEXTJS14_NEON_PRISMA_BLUEPRINT.md`](./docs/NEXTJS14_NEON_PRISMA_BLUEPRINT.md)** for the complete copy-pasteable Next.js 14 App Router files (`prisma/schema.prisma`, `.env.example`, `/app/api/auth/*`, `/register`, `/login`, `/verify`, `/dashboard`):

```bash
npm install
npx prisma migrate dev --name init_oververse_users
npm run dev
```

---

## Deploying to Vercel + Neon + Resend

1. **Neon (`https://neon.tech`)**: Provision a PostgreSQL 16 database and copy your pooled connection string (`?sslmode=require`).
2. **Resend (`https://resend.com`)**: Verify your domain, create an API key (`re_...`), and configure `RESEND_API_KEY` + `RESEND_FROM_EMAIL`.
3. **Vercel (`https://vercel.com`)**:
   - Import your repository and configure `DATABASE_URL` (for Next.js/Prisma), `JWT_SECRET` (`openssl rand -hex 32`), `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL`.
   - Set Build Command to `npx prisma generate && npx prisma migrate deploy && next build` (for Next.js 14) and deploy.
