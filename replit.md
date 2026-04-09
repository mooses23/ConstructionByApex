# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL (Replit Helium) + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Database Connection

The Replit Helium DB uses `PGHOST=helium` (not `DATABASE_URL` which has an old hostname).
`lib/db/src/index.ts` prefers individual `PG*` env vars when `PGHOST` is set.
Use `pnpm --filter @workspace/db run push` which uses `drizzle.config.cjs` (CJS-compatible config).

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, uses CJS drizzle config)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

### Public Website (Construction By Apex)
- Home, Services, Projects, Reviews, About, Contact pages
- Quote request form → saves lead to DB

### Admin Portal (`/admin`)
- **Dashboard** — stats cards, recent leads, follow-up queue
- **Leads** (`/admin/leads`) — list, search, status filter; detail page with notes
- **Quotes** (`/admin/quotes`) — list and detail pages

### Opportunity Intelligence Engine
- **Opportunities** (`/admin/opportunities`) — scored & ranked job opportunities (20 seeded)
  - Filters: status, trade type; sort by score/newest/deadline
  - Score tiers: High ≥8 (green), Medium ≥4 (yellow), Low <4 (grey)
- **Opportunity Detail** (`/admin/opportunities/:id`) — score gauge, breakdown chips, status change dropdown, activity log, add note
- **Sources** (`/admin/opportunities/sources`) — 5 ingestion sources (SAM.gov, RSS, Google PSE, Email, Manual) with enable/disable toggles and trigger-sync buttons
- **Scoring Rules** (`/admin/opportunities/rules`) — keyword filters + 4 weight sliders per rule
- **Sync Log** (`/admin/opportunities/sync-log`) — per-run stats table with error messages

## Database Tables (13 total)
- `leads`, `lead_contacts`, `lead_notes`, `quotes`, `quote_items`
- `services`, `testimonials`, `project_gallery`
- `opportunities`, `opportunity_sources`, `opportunity_rules`, `opportunity_sync_runs`, `opportunity_events`

## API Routes — Express route ordering
Static sub-paths (e.g. `/sources`, `/rules`, `/sync-log`) MUST be declared before `/:id` in the router.
See `artifacts/api-server/src/routes/opportunities.ts`.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Database

The API server and scripts use the local Replit PostgreSQL instance via PG environment variables (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`). The `lib/db/src/index.ts` prefers PG* variables over `DATABASE_URL` to bypass a stale remote DB secret.

To run schema migrations: start the API server — `lib/migrate.ts` auto-runs `CREATE TABLE IF NOT EXISTS` for all tables 3 seconds after startup.

## Modules

### Opportunities

Full CRUD + sync module for contractor bid opportunities. See:
- **Schema**: `lib/db/src/schema/opportunities.ts` — 5 tables: `opportunities`, `opportunity_sources`, `opportunity_sync_runs`, `opportunity_rules`, `opportunity_events`
- **Routes**: `artifacts/api-server/src/routes/opportunities.ts` — mounted at `/api/opportunities`
- **Ingestion services**: `artifacts/api-server/src/lib/opportunities/` — SAM.gov, RSS, Google PSE, manual, email connectors
- **Seed data**: `scripts/seed-opportunities.ts` — 20 opportunities, 2 sources, 1 rule

#### Key API Endpoints
- `GET/POST /api/opportunities` — list (filterable by status, trade_type, state, priority, min_score) and create
- `GET/PATCH/DELETE /api/opportunities/:id` — single opportunity CRUD
- `GET/POST /api/opportunities/:id/events` — event timeline
- `GET/POST/PATCH/DELETE /api/opportunities/sources` — ingest source management
- `POST /api/opportunities/sources/:id/sync` — trigger automated sync (samgov/rss/google_pse)
- `GET/POST/PATCH/DELETE /api/opportunities/rules` — scoring rule management
- `GET /api/opportunities/sync-log` — sync run history
- `POST /api/opportunities/email-ingest` — ingest opportunity from email payload

#### Scoring Engine
Keyword match +3, trade match +2, state match +2, budget above threshold +1, posted ≤7 days +1, deadline ≤14 days +1.
Priority: High ≥8, Medium ≥4, Low <4.
