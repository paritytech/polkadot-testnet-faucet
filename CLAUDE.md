# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Generic faucet for Substrate-based chains (Polkadot testnets). Two interfaces: a Matrix chat bot and a web UI. Supports multiple networks: Westend, Paseo, Versi, and an E2E test network.

## Monorepo Structure

- **Root workspace** — Backend server (Node.js 22 / TypeScript / Express / TypeORM / Polkadot API)
- **`client/`** — Frontend web app (SvelteKit / Svelte 4 / TailwindCSS / DaisyUI)
- Package manager: **Yarn 4.6.0** (Berry, with `nodeLinker: node-modules`)

## Build & Development Commands

```bash
# Setup
yarn install
yarn codegen                    # Generate config types + PAPI descriptors (run after env.faucet.config.json changes)
cp .env.example .env            # Configure environment

# Database
yarn build                      # Must build before running migrations
yarn dev:db                     # Starts PostgreSQL (docker compose) + runs TypeORM migrations
yarn migrations:generate src/db/migration/<Name>  # Generate new migration (build first)

# Development
yarn dev                        # Concurrent tsc -w + node --watch
cd client && yarn dev           # Frontend: Vite dev server

# Build
yarn build                      # Backend: tsc + copy package.json to build/
yarn build:docker               # Build Docker image
cd client && yarn build         # Frontend: Vite production build
```

## Testing & Code Quality

```bash
# Unit tests (Node.js experimental test runner + earl assertions)
yarn test                       # All backend tests
yarn test -- --test-name-pattern="<pattern>"  # Filter tests by name

# E2E
yarn e2e:zombienet              # Start local blockchain via Zombienet
yarn test:e2e                   # Run E2E tests (requires running Zombienet + Matrix)
cd client && yarn test          # Playwright tests for frontend

# Linting & formatting
yarn lint                       # ESLint check
yarn format                     # Prettier check
yarn typecheck                  # TypeScript type check (tsc --noEmit)
yarn fix                        # Auto-fix lint + format
cd client && yarn check         # Svelte type checking
```

## Architecture

```
src/start.ts                    # Entry point: init DB → start bot → wait for chain → start server
src/bot/                        # Matrix bot (commands: !drip, !balance, !help, !version)
src/server/                     # Express REST API (/balance, /drip/web, /health, /ready, /metrics)
src/dripper/
  DripRequestHandler.ts         # Core: validates requests, checks daily quota, calls PolkadotActions
  polkadot/PolkadotActions.ts   # Blockchain interactions: sendTokens, transferTokens, teleportTokens
  Recaptcha.ts                  # ReCAPTCHA v2 validation (web drips only)
  dripperStorage.ts             # In-memory daily drip limit tracking
src/db/                         # TypeORM: AppDataSource, Drip entity, migrations
src/papi/                       # Polkadot API (PAPI) chain configs per network
  chains/{westend,paseo,versi,e2e}.ts
.papi/                          # Generated PAPI descriptors (via yarn codegen)
```

**Request flow:** Web UI or Matrix bot → `DripRequestHandler` (validates address, checks quota, verifies captcha for web) → `PolkadotActions` (submits tx to chain) → records drip in PostgreSQL.

## Key Patterns

- **ESM modules** throughout (`"type": "module"` in package.json). Imports use `.js` extensions even for `.ts` files.
- **Path alias**: `#src/*` maps to `./src/*` (configured in package.json `imports` and tsconfig `paths`).
- **Configuration**: `confmgr` library reads `env.faucet.config.json` schema. All env vars prefixed with `SMF_CONFIG_`.
- **TypeORM decorators**: `experimentalDecorators` and `emitDecoratorMetadata` enabled; `strictPropertyInitialization` disabled for entity classes.
- **Tests**: Co-located with source files (`*.test.ts`). Use Node.js built-in test runner (`node:test`) with `earl` assertion library and `testcontainers` for DB tests.
- **Git hooks**: `simple-git-hooks` runs `lint-staged` on pre-commit (prettier + eslint on staged files).

## Environment

Copy `.env.example` to `.env`. Key variables: `SMF_CONFIG_NETWORK` (westend|paseo|versi|e2e), `SMF_CONFIG_FAUCET_ACCOUNT_MNEMONIC`, `SMF_CONFIG_MATRIX_ACCESS_TOKEN`, `SMF_CONFIG_RECAPTCHA_SECRET`, DB connection vars (`SMF_CONFIG_DB_*`). Frontend env vars use `PUBLIC_` prefix in `client/.env`.

## Deployment

- Docker multi-stage builds (Node 22 Alpine)
- Helm charts in `helm/` with per-environment values files
- GitHub Actions CI: lint → typecheck → format → test → Docker build
- Deploys to Versi/Westend/Paseo via ArgoCD
