# HMIMS — Hola Municipality Inventory Management System

A full-stack inventory management system for the Municipality of Hola, Tana River County, Kenya. Covers procurement, stock movements, reporting, audit trail, and role-based access for 6 user roles.

## Run & Operate

- `pnpm --filter @workspace/hmims run dev` — frontend (port assigned by workflow)
- `pnpm --filter @workspace/api-server run dev` — API server (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `DATABASE_URL` — Postgres connection string (pre-configured), `SESSION_SECRET` — JWT secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend**: React 19 + Vite + Tailwind CSS v4 + shadcn/ui + Wouter routing + Recharts
- **Backend**: Express 5 + Drizzle ORM + PostgreSQL
- **Auth**: JWT (jsonwebtoken + bcryptjs), stored in localStorage as `hmims_token`
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild (API server CJS bundle)

## Default Login Credentials

| Username | Password | Role |
|---|---|---|
| admin | Admin@1234 | Administrator |
| storekeeper | Admin@1234 | Storekeeper |
| procurement | Admin@1234 | Procurement Officer |
| finance | Admin@1234 | Finance Officer |
| dept_user | Admin@1234 | Department User |
| auditor | Admin@1234 | Auditor |

## Where Things Live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema (users, categories, suppliers, inventory, purchase orders, GRN, stock movements, notifications, audit)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not hand-edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not hand-edit)
- `artifacts/api-server/src/routes/` — Express route handlers (16 route groups)
- `artifacts/api-server/src/lib/` — auth.ts (JWT), audit.ts (audit log helper)
- `artifacts/hmims/src/pages/` — all frontend pages
- `artifacts/hmims/src/components/layout.tsx` — sidebar + app shell

## Modules

| Module | Status | Route |
|---|---|---|
| Dashboard | ✅ | `/dashboard` |
| Inventory Items | ✅ | `/inventory` |
| Categories | ✅ | `/categories` |
| Suppliers | ✅ | `/suppliers` |
| Purchase Orders (LPO) | ✅ | `/purchase-orders` |
| Goods Received Notes | ✅ | `/grn` |
| Stock Issues | ✅ | `/stock-issues` |
| Stock Returns | ✅ | `/stock-returns` |
| Stock Adjustments | ✅ | `/stock-adjustments` |
| Stock Taking | ✅ | `/stock-taking` |
| Reports | ✅ | `/reports` |
| Notifications | ✅ | `/notifications` |
| User Management | ✅ | `/users` |
| Audit Trail | ✅ | `/audit` |

## Architecture Decisions

- JWT in localStorage (not cookies) to keep the API stateless and work cleanly with the Replit proxy setup
- Soft-deletes on inventory items (`is_deleted` flag) — nothing is permanently deleted
- All audit logs written in route handlers via `createAuditLog()` helper — failures are silently swallowed so they never break the main operation
- OpenAPI-first: all types come from codegen; hand-writing types against the spec is forbidden
- `SESSION_SECRET` env var used as JWT signing key (falls back to hardcoded dev string if not set)

## Gotchas

- After any OpenAPI spec change, run codegen before touching frontend or backend: `pnpm --filter @workspace/api-spec run codegen`
- The `storekeeperI` field name in `stockReturnsTable` is a typo from the original schema — it maps to DB column `storekeeper_id`. Do not rename it without a DB migration.
- DB schema was pushed via raw SQL (not drizzle push) — if you add new columns, write a SQL ALTER TABLE or re-run the full schema

## User Preferences

- Project is for Hola Municipality, Tana River County, Kenya
- Government of Kenya context — professional, formal UI tone
- All amounts in Kenyan Shillings (KES)
