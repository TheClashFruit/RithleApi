FROM node:26-alpine AS builder

WORKDIR /usr/src/app

RUN npm install --global corepack@latest
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM node:26-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

RUN npm install --global corepack@latest
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/views ./dist/views
COPY --from=builder /usr/src/app/src/pages ./dist/pages
COPY --from=builder /usr/src/app/src/static ./dist/static

RUN mkdir -p data

EXPOSE 3000

CMD ["node", "dist/index.js"]