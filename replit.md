# Swift Tow — Workspace

## Overview

Full-stack on-demand tow truck platform for Ghana (Accra/Mampong).
pnpm workspace monorepo using TypeScript with an Expo mobile app and a Node.js API backend.

## Artifacts

| Artifact | Kind | Path |
|---|---|---|
| `artifacts/mobile` | Expo (React Native) | Preview via Expo Dev Domain |
| `artifacts/api-server` | Express API + Socket.io | `/api/*`, `/admin-dashboard/*` |
| `artifacts/admin-dashboard` | React/Vite (build-only) | Built to `dist/public/`, served by api-server |

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Mobile**: Expo (SDK 53), Expo Router v6, React Native
- **API framework**: Express 5 + Socket.io (real-time tow coordination)
- **Data store**: In-memory Maps with seed data (no DB — demo)
- **API codegen**: Orval (from OpenAPI spec at `lib/api-spec`)
- **Build**: esbuild (CJS bundle for API server)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/mobile run dev` — run Expo dev server

## Mobile App Screens

- **Auth**: Login (`/auth/login`), Register (`/auth/register`)
- **Tabs**: Home/Map (`/(tabs)/`), Trips (`/(tabs)/trips`), Profile (`/(tabs)/profile`)
- **Modals**: Active Request (`/active-request`), Payment (`/payment`), Help (`/help`), Edit Profile (`/edit-profile`)

## Features

- Auth (register/login with in-memory store, no real JWT — token = userId for demo)
- Tow request flow: select tow type (Flatbed/Hook & Chain/Repair) → confirm → real-time socket events
- Payment: MTN MoMo, Telecel Cash, AT Money, Cash
- Real-time via Socket.io: user joins room, driver accepts → `request:accepted`, trip complete → `request:completed`
- **Live tracking**: active-request screen shows full-screen map with user pin + approaching driver truck marker; route line drawn between them (Google Directions on web, polyline on native)
- **Driver GPS emission**: DriverContext emits `driver:location` via socket on every native GPS update (3s interval); on web, simulates smooth exponential movement toward pickup after accepting
- **Stale closure fix**: TowContext uses refs for `towStatus` / `activeRequest` so socket callbacks always read current state
- Trips history screen using generated React Query hooks
- Profile with QR code modal, edit profile, sign out
- Map: `react-native-maps` on native (iOS/Android), Google Maps JS API on web
- Platform guards throughout (web safe insets: 67px top, 34px bottom)
- Admin dashboard sidebar shows amber badge with pending driver count (polls every 15s)

## Branding

- Primary: `#FF6B00` (Swift Tow orange)
- Secondary: `#34495E` (dark slate)
- Dark background on login: `#34495E`
- All screens use `useColors()` hook from `constants/colors.ts`

## Admin Dashboard

React/Vite SPA at `/admin-dashboard/`. Login: `admin@swifttow.com` / `admin123`.

Pages: Dashboard (stats), Drivers (approve/reject), Requests (tow list).

**Serving architecture**: The admin dashboard is built (Vite production build) and served as static files by the API server's Express (`app.use("/admin-dashboard", express.static(...))`). The admin-dashboard workflow is intentionally disabled — its port was not detectable by Replit's workflow health-check system.

**To rebuild after code changes**:
```
PORT=22133 BASE_PATH=/admin-dashboard/ pnpm --filter @workspace/admin-dashboard run build
```
Then restart the api-server workflow to reload the files.

## Architecture Notes

- Socket.io mounts at default path; the reverse proxy maps `/api` → api-server port 8080
- Admin dashboard static files served by Express at `/admin-dashboard/` (port 8080)
- Mobile socket connects to `https://${EXPO_PUBLIC_DOMAIN}` with `path: "/api/socket.io"`
- `MapComponent.native.tsx` / `MapComponent.web.tsx` — platform-specific map rendering
- `MapComponent.tsx` — TypeScript resolution shim (re-exports web version)
- Auth context uses `expo-secure-store` on native, `localStorage` on web
- TowContext connects socket only when `userId` is non-null (post-login)

## Seed Drivers

Two drivers seeded in store on startup:
- Kwame Asante (+233244567890) — online, near Labone area
- Abena Osei (+233244890123) — online, near Osu area
