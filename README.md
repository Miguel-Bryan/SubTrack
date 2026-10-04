# SubTrack

A small web app for two people to run a subscription-reselling business: clients, the subscriptions they bought, payments and balances, the subscriptions you buy from providers (with seats), expenses, and monthly profit.

Stack: Next.js 15 (App Router) + TypeScript, Tailwind CSS v4, Prisma, SQLite locally, PostgreSQL on Vercel.

## Run it locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
npm run setup               # creates the database and loads demo data
npm run dev
```

Open http://localhost:3000 and sign in with:

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `ChangeMe123!` |
| Collaborator | `partner` | `ChangeMe123!` |

Change both passwords after the first login (Users page, admin only).

Useful commands:

| Command | What it does |
|---|---|
| `npm run db:seed` | Adds the two users and demo data (skipped if clients already exist) |
| `npm run db:seed:empty` | Adds only the two users, no demo data |
| `npm run db:reset` | Wipes the database and reseeds it (development only) |
| `npm run db:studio` | Opens Prisma Studio to browse the data |
| `npm run typecheck` | TypeScript check |

## Project structure

```
prisma/schema.prisma      Database schema (6 models)
prisma/seed.ts            Users + demo data
src/middleware.ts         Redirects to /login when there is no valid session
src/lib/status.ts         ALL business rules: balance, paid/due soon/overdue, expiring/expired, seats
src/lib/dates.ts          Date maths (add months, "today" in Africa/Douala)
src/lib/validation.ts     Zod schemas for every form
src/lib/queries.ts        Shared queries (dashboard, reports)
src/actions/*.ts          Server Actions = the backend (create/update/delete per entity)
src/components/           Reusable UI: forms, badges, panels, sidebar, confirm dialog
src/app/(app)/            Pages: dashboard, clients, subscriptions, payments, providers, expenses, reports, users
```

## How the rules work

- **End date** = start date + duration (1, 2 or 3 months). Jan 31 + 1 month gives Feb 28 (month end is respected).
- **Balance** = selling price minus the sum of payments. Nothing about money is stored twice, so it can't drift.
- **Payment status**: Paid (balance 0), Overdue (balance owed and the due date has passed), Due soon (balance owed and due within 7 days, including today), otherwise Partly paid or Unpaid.
- **Subscription state**: Active, Expiring soon (ends within 7 days), Expired (end date passed). Renewing marks the old term as Renewed so it stops showing as expired.
- **Provider status**: Active, Expiring soon (renews within 7 days), Expired, or Cancelled. Available seats = capacity minus occupied seats (use the + / - buttons on the Provider page).
- **Revenue** = payments received in the month. **Expenses** = expenses dated in the month. **Profit** = revenue minus expenses. This is cash-basis, so it is an estimate.
- Payments can't exceed what is still owed on a subscription.

## Environment variables

See `.env.example`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./dev.db` locally, a PostgreSQL URL in production |
| `AUTH_SECRET` | Signs login cookies. The app refuses to start in production with the placeholder |
| `APP_TIMEZONE` | Decides what "today" is for due dates (default `Africa/Douala`) |
| `SEED_*` | Optional passwords/usernames for the seed script |

## Deploy to Vercel (PostgreSQL)

SQLite files can't be used on Vercel (the filesystem is read-only and not persistent), so production uses PostgreSQL.

1. **Create a Postgres database.** Neon, Supabase or Vercel Postgres all work. Copy the connection string.
2. **Switch the schema.** In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`. Nothing else changes.
3. **Create the tables and the two users** from your computer, pointing at the production database. Use the *direct* (non-pooled) connection string for this step:
   ```bash
   # macOS / Linux
   DATABASE_URL="postgresql://..." npx prisma db push
   DATABASE_URL="postgresql://..." SEED_ADMIN_PASSWORD="a-strong-password" SEED_COLLAB_PASSWORD="another-strong-one" npm run db:seed:empty
   ```
   On Windows PowerShell, set the variables first: `$env:DATABASE_URL="postgresql://..."`.
4. **Push the code to GitHub** and import the repository in Vercel.
5. **Add environment variables** in Vercel (Project, Settings, Environment Variables): `DATABASE_URL` (the pooled string is fine here), `AUTH_SECRET` (generate with `openssl rand -base64 32`), and optionally `APP_TIMEZONE`.
6. **Deploy.** The build command is already `prisma generate && next build`.

If you change the schema later, run `npx prisma db push` against production again before deploying.

## Security notes

- Passwords are hashed with bcrypt. Sessions are signed, HTTP-only cookies valid for 30 days.
- Every Server Action checks the signed-in user; user management also checks for the Admin role.
- There is no login rate-limiting. For two users behind a strong password this is acceptable; add one (for example Upstash) if you expose it more widely.
