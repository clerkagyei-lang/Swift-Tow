---
name: Workflow port config
description: Which ports and workflow names are used for each service in this Replit project
---

## Rule
Single workflow called "Swift Tow API + Mobile" runs on PORT=5000 (outputType: webview).

Command: `PORT=5000 pnpm --filter @workspace/api-server run start`

**Why:** Previously two separate workflows (API on 8080, mobile Expo dev on 5000). This caused network errors on login because the mobile web (served by Expo on port 5000) called `window.location.origin + '/api/...'` which hit Expo's dev server, not the API. Solution: API server serves the pre-built mobile web directly, so mobile+API share the same origin.

## Port mapping in .replit
- Port 5000 → external 80 (main webview — mobile app at /mobile/ and admin at /admin-dashboard/)
- Port 8080 → external 8080 (unused in dev, kept for reference)

## URL routing (app.ts)
- `/` → 301 redirect to `/mobile/`
- `/mobile/*` → serves `artifacts/mobile/dist-web/` static files
- `/admin-dashboard/*` → serves `artifacts/admin-dashboard/dist/public/` static files
- `/api/*` → Express API routes
