# Vercel monorepo deploy guide

This repository contains multiple projects in `artifacts/`. Use the Vercel CLI to link and deploy each project directory as its own Vercel project.

Example commands (run after `vercel login`):

```
# Admin dashboard (static Vite app)
vercel link --name Swift-Tow-admin-dashboard --cwd artifacts/admin-dashboard
vercel --prod --cwd artifacts/admin-dashboard

# API server (Node/TS entrypoint)
vercel link --name Swift-Tow-api-server --cwd artifacts/api-server
vercel --prod --cwd artifacts/api-server

# Mockup sandbox (static)
vercel link --name Swift-Tow-mockup --cwd artifacts/mockup-sandbox
vercel --prod --cwd artifacts/mockup-sandbox
```

Notes:
- `artifacts/mobile` is an Expo app — deploy with Expo (or build a web-target and deploy the web build).
- The `vercel.json` files in each subproject set the basic build adapter; adjust `buildCommand` or env vars in the Vercel dashboard as needed.
