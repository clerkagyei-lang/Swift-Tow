---
name: Workflow port configuration
description: Which ports each workflow uses and why.
---

## Ports
- **API Server**: port 8080, outputType `console`. Command: `pnpm install && PORT=8080 pnpm --filter @workspace/api-server run dev`
- **Swift Tow Mobile**: port 5000, outputType `webview`. Expo dev server must use port 5000 because Replit's webview outputType requires port 5000.
- **Admin dashboard**: built statically to `artifacts/admin-dashboard/dist/public/` and served by Express at `/admin-dashboard/`. Not its own workflow. Rebuild command: `PORT=8081 BASE_PATH=/admin-dashboard/ pnpm --filter @workspace/admin-dashboard run build`

**Why:** Replit enforces that webview workflows use port 5000. The original port (18115) caused workflow configuration errors.
