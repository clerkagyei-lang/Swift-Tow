# Use a lightweight Node.js image
FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN corepack enable

# Stage: Build
FROM base AS build
WORKDIR /app
COPY . .
# Install all dependencies and build everything in the monorepo
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# Stage: Production
FROM base AS production
WORKDIR /app
# Copy only the built artifacts from the previous stage
COPY --from=build /app/artifacts/api-server/dist ./api-server/dist
COPY --from=build /app/artifacts/admin-dashboard/dist ./admin-dashboard/dist
COPY --from=build /app/artifacts/api-server/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 8080
CMD ["node", "api-server/dist/index.js"]
