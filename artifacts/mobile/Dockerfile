FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

ARG EXPO_PUBLIC_API_URL=https://your-api.railway.app
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

RUN pnpm --filter @workspace/api-server run build
RUN PORT=22133 BASE_PATH=/admin-dashboard/ pnpm --filter @workspace/admin-dashboard run build
RUN EXPO_BASE_URL=/mobile pnpm --filter @workspace/mobile run build:web

FROM base AS production
WORKDIR /app

COPY --from=build /app/artifacts/api-server/dist ./api-server/dist
COPY --from=build /app/artifacts/admin-dashboard/dist/public ./admin-dashboard/dist/public
COPY --from=build /app/artifacts/mobile/dist-web ./mobile/dist-web
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 5000
ENV PORT=5000
CMD ["node", "api-server/dist/index.js"]
