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
