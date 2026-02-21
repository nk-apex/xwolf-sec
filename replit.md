# XWOLF SEC - Security Analysis & Threat Intelligence

## Overview

XWOLF SEC is a cybersecurity web application that performs security analysis scans on target URLs. It checks for DDoS protection, scraping vulnerabilities, server configuration, and HTTP header security. Users enter a URL, the server performs a real-time analysis (DNS lookup, header inspection, bot detection), stores the results in PostgreSQL, and presents findings through a dark-themed cybersecurity dashboard.

The app follows a monorepo structure with three main directories:
- `client/` — React SPA (Vite + TypeScript)
- `server/` — Express API server (TypeScript)
- `shared/` — Shared schemas, types, and route definitions used by both client and server

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data**: TanStack React Query for server state management with polling (5s interval for scan list)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, dark mode by default (cybersecurity aesthetic with green accent colors)
- **Animations**: Framer Motion for page transitions and scan states
- **Key Pages**:
  - `/` — Dashboard with scanner input, stats grid, and recent scan cards
  - `/scans/:id` — Detailed scan result view
  - `/history` and `/settings` — Placeholder routes pointing to Dashboard

### Backend (server/)
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx)
- **API Pattern**: REST API with routes defined in `shared/routes.ts` using Zod schemas for validation
- **Scan Logic**: Server-side URL analysis using native `fetch` and `dns/promises` — no external scanning APIs. Checks HTTP headers, bot blocking, DDoS protection indicators (Cloudflare, etc.)
- **Dev Server**: Vite dev server middleware integrated into Express for HMR during development
- **Production**: Client is built to `dist/public/`, server is bundled with esbuild to `dist/index.cjs`

### Shared Layer (shared/)
- `schema.ts` — Drizzle ORM table definitions and Zod insert schemas for the `scans` table
- `routes.ts` — API contract definitions (method, path, input/output Zod schemas) used by both client and server

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: `node-postgres` (pg) Pool, configured via `DATABASE_URL` environment variable
- **Schema**: Single `scans` table with fields: id, url, targetIp, server, isScrapable, ddosProtected, headers (JSONB), recommendations (JSONB), createdAt
- **Migrations**: Use `npm run db:push` (drizzle-kit push) to sync schema to database

### Storage Pattern
- `server/storage.ts` defines an `IStorage` interface with `DatabaseStorage` implementation
- CRUD operations: `getScans()`, `getScan(id)`, `createScan(scan)`
- Exported singleton `storage` instance used by route handlers

## API Endpoints
- `GET /api/scans` — List all scans (ordered by createdAt desc)
- `GET /api/scans/:id` — Get scan by ID
- `POST /api/scans` — Create new scan (body: `{ url: string }`)

## Key Files
- `shared/schema.ts` — Database schema and validation types
- `shared/routes.ts` — API contract definitions
- `server/db.ts` — Database connection
- `server/routes.ts` — API routes with security analysis engine
- `server/storage.ts` — Database CRUD operations
- `client/src/pages/Dashboard.tsx` — Dashboard page
- `client/src/pages/ScanResult.tsx` — Scan result detail page
- `client/src/components/ScannerInput.tsx` — URL input with analyze button
- `client/src/components/ScanCard.tsx` — Scan result card
- `client/src/components/StatusBadge.tsx` — Status indicator badge
- `client/src/components/Layout.tsx` — App layout with sidebar
- `client/src/hooks/use-scans.ts` — React Query hooks for scan data

## Theme
- Dark-themed with green (#22c55e-ish) primary color
- Uses Inter font family
- Cybersecurity aesthetic with monospace font accents

## Recent Changes
- 2026-02-21: Complete rebuild as XWOLF SEC vulnerability scanner with security analysis engine, dark cybersecurity dashboard, scan results with recommendations
