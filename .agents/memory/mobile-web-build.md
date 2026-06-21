---
name: Mobile web build
description: How to correctly build and serve the Expo mobile web app in this Replit environment
---

## Rule
Always build the mobile web with both env vars set:
```
EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN EXPO_BASE_URL=/mobile pnpm --filter @workspace/mobile run build:web
```
Then restart the "Swift Tow API + Mobile" workflow.

**Why:** Without `EXPO_BASE_URL=/mobile`, the JS bundle and assets load from `/` instead of `/mobile/`, causing 404s. With a trailing slash (`/mobile/`), asset paths get a double slash (`/mobile//assets/...`) which makes Express serve index.html instead of the actual font/image file.

**How to apply:** Any time mobile web code changes and you need to update the build, run the command above. After the build completes, the workflow must be restarted to serve the new `dist-web/` output.

## Port setup
The API server is the single workflow, running on PORT=5000 (Replit webview port). This means `window.location.origin` in the mobile web == the API base URL, so all fetch calls work without any proxy. The root `/` redirects to `/mobile/`.

## DB schema
The Postgres schema must be pushed before first start: `pnpm --filter @workspace/db push`. The server seeds test data on startup only if the schema exists.
