# --- Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Enable Corepack so the container automatically downloads and uses the exact pnpm version
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests (using pnpm-lock.yaml instead of package-lock.json)
COPY package*.json pnpm-lock.yaml* ./

# Install all dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
RUN pnpm run build

# --- Production Stage ---
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Enable Corepack in the runner stage as well
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests and install ONLY production dependencies
COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# Copy the compiled JS code and views from the builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/views ./dist/views

# Create the persistent data directory for SQLite
RUN mkdir -p data

EXPOSE 3000

# Run the compiled JavaScript entrypoint
CMD ["node", "dist/index.js"]