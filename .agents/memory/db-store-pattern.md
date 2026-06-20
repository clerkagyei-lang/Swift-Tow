---
name: DB-backed store pattern
description: How the in-memory store was replaced with PostgreSQL via Drizzle ORM, and the GPS location cache decision.
---

## Rule
`artifacts/api-server/src/lib/store.ts` is now fully async — all methods return Promises and use Drizzle ORM against Replit PostgreSQL.

**Why:** The original in-memory store lost all data on server restart.

## How to apply
- All route handlers and socket event handlers must use `async`/`await` when calling any `store.*` method.
- Driver `currentLocation` is **NOT written to the DB on every GPS tick** — it lives in a module-level `driverLocationCache` Map inside `store.ts`. Only `isOnline` and other stable driver fields go to the DB. This prevents write flooding from 3s GPS intervals.
- Schema lives in `lib/db/src/schema/index.ts`. After changing it, run: `pnpm --filter @workspace/db push`
- Seed data uses stable hardcoded UUIDs and is guarded by an existence check — safe to run on every startup.
