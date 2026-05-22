# AGENTS.md

Telegraph style. Root rules only. This repo is an Odyssey fullstack assignment. Optimize for evaluator confidence: required stack fidelity, generated contracts, clean architecture, polished dashboard, runnable local DX.

## Start

* Read this file before any code work.
* Read `fullstack_developer_assignment_ody(1).md` before planning scope or changing architecture.
* If a scoped `AGENTS.md` exists in a subtree, read it before touching that subtree.
* If this directory is not a git repo yet, initialize git before project implementation begins.
* Do not replace the required stack with alternatives.
* Do not make the app look like a static mock. Product flows must be interactive and backend-backed where required.
* Favor a small complete slice over broad unfinished screens.
* Before implementing dependency-specific behavior, read current official docs/types/source. No guesses about Hono, Drizzle, Expo, Orval, Workers, or React Query defaults.
* Keep generated artifacts generated. Do not hand-edit Orval output, OpenAPI output, Drizzle generated migrations, or lockfile chunks by hand.
* Never print secrets. Never commit `.env`, database credentials, API keys, or live service tokens.
* Every finished change must be reviewed and committed. Do not leave completed edits uncommitted.

## Assignment Truth

* Required structure:
  * `apps/dashboard`: Expo + React Native + Web dashboard.
  * `services/backend`: Hono API on Cloudflare Workers.
  * `packages/shared`: shared utilities, constants, design tokens, non-API helpers.
  * `packages/types`: generated or schema-derived shared types only when needed.
  * `packages/api-client`: Orval-generated client/hooks and thin exports.
* Required pipeline:
  * Drizzle schema -> drizzle-zod -> Hono/OpenAPI -> Orval -> frontend generated types/hooks.
* Data truth starts in Drizzle schema.
* API contract truth comes from backend OpenAPI.
* Frontend API types come from generated/shared contract artifacts, not handwritten DTOs.
* Frontend data fetching uses Orval-generated React Query hooks.
* Business logic lives in backend services, domain helpers, and frontend hooks/services. Page components compose UI and flows.

## Hard No

* No Next.js, NestJS, Prisma, tRPC, Supabase, Firebase, or handwritten fetch layer as the main API pattern.
* No duplicated order/customer/menu DTOs in `apps/dashboard`.
* No duplicated status enums across frontend and backend.
* No loose order status update endpoint that accepts arbitrary status.
* No client-side order total authority. Backend calculates or verifies totals.
* No accepting unavailable menu items.
* No direct database calls from dashboard.
* No large page components containing data normalization, pricing, status transition, and form orchestration all at once.
* No scattered colors, spacing, radii, shadows, or typography constants.
* No generated file edits to "quick fix" type errors.
* No broad rewrites unrelated to the assignment.

## Map

* `apps/dashboard`: Expo Router or equivalent app routing, screens, UI composition, web runtime.
* `apps/dashboard/src/screens` or `app`: Home, Orders, CRM, Menu, Settings, UI library route.
* `apps/dashboard/src/components`: app-level reusable components composed from shared UI primitives.
* `apps/dashboard/src/hooks`: frontend orchestration hooks using generated API hooks.
* `services/backend/src/db`: Drizzle schema, database client, migrations helpers.
* `services/backend/src/routes`: Hono OpenAPI route definitions.
* `services/backend/src/domain`: order state machine, totals, validation helpers, service logic.
* `services/backend/src/seed`: seed/bootstrap data.
* `packages/shared`: design tokens, shared formatting helpers, domain constants only if generated or source-owned.
* `packages/api-client`: Orval config, generated output, public exports.
* `packages/types`: contract-derived types, never a dumping ground for manually invented frontend DTOs.

## Architecture

* Backend owns persistence, validation, totals, availability checks, and order state transitions.
* Frontend owns presentation, interaction, optimistic UI only when safe, and user feedback.
* OpenAPI must describe real request/response shapes used by the dashboard.
* drizzle-zod schemas should be the basis for insert/update/read validation where practical.
* Keep status transitions explicit:
  * Example: `pending -> accepted -> preparing -> ready -> completed`.
  * Example terminal states: `cancelled`, `refunded` if implemented.
  * Reject invalid transitions with a clear typed error.
* Order creation:
  * Validate customer/menu item references.
  * Reject unavailable items.
  * Calculate item prices from server-side menu data.
  * Calculate subtotal/tax/total server-side.
  * Store enough line-item price snapshot data for historical correctness.
* CRM summaries:
  * Derive order count, spend, and recent orders from persisted orders.
  * Avoid frontend-only fake aggregation for backend-backed pages.
* Settings:
  * Store ordering-related settings server-side.
  * Use settings in relevant backend decisions when practical.
* Home KPIs:
  * Prefer backend summary endpoint over frontend recomputing everything from multiple lists.
* Shared packages:
  * Add only stable shared logic. Avoid premature abstractions.
  * If logic is backend-only, keep it backend-only.
* Generated client:
  * Orval output should expose typed client functions and React Query hooks.
  * Dashboard imports API types/hooks from `@repo/api-client` or the local package alias.

## Frontend Product

* The first screen is the actual dashboard, not a marketing page.
* Required pages:
  * Home: KPIs, revenue/orders/pending/popular items, recent activity.
  * Orders: list, filters, detail view, create order flow, valid status actions.
  * CRM: customer list, spend/order count, recent orders/order history.
  * Menu: categories, items, price, availability, create/edit flows.
  * Settings: prep time, auto-accept, service availability, hours or similar.
  * UI Library: tokens, typography, spacing, surfaces, components, states.
* Use a restrained operations-tool visual language. Dense, scannable, polished.
* Build interactive create/edit flows with modal, drawer, or focused panel patterns.
* Represent loading, empty, error, success, warning, disabled, focus, hover, and active states.
* Use reusable primitives:
  * buttons
  * inputs and form controls
  * selects/dropdowns
  * dialogs/modals/drawers
  * cards/surfaces
  * tables/lists
  * badges/status indicators
  * navigation
  * skeleton/loading states
  * feedback/toast pattern
* Keep design tokens centralized.
* No one-off visual constants inside screens unless local layout truly needs them.
* Web must work. Native readiness is a bonus.
* Test responsive behavior for desktop and mobile web widths.

## Design System

* Tokens required:
  * colors
  * typography
  * spacing scale
  * radius
  * borders
  * shadows/elevation
  * layout/grid rules
  * semantic states
* Semantic color names beat raw hue names in component APIs.
* Components should support variant, size, disabled, loading, and state styling where appropriate.
* UI Library route is not optional. It is the evaluator's map of the design system.
* Avoid nested cards and decorative clutter.
* Avoid one-note palettes. Restaurant ops can be warm and lively, but the dashboard must remain work-focused.
* Text must fit in buttons, tables, cards, filters, and mobile layouts.

## Backend API

* Use Hono on Cloudflare Workers.
* Expose OpenAPI from route definitions.
* Validate request bodies, params, and query strings.
* Return typed JSON error shapes with stable error codes.
* Use pagination or sensible limits for list endpoints.
* Filters:
  * Orders: status, date/search if implemented.
  * Menu: category, availability if implemented.
  * Customers: search if implemented.
* Seed data must make all pages interesting immediately after setup.
* Database code should be testable without Worker runtime magic where practical.
* Keep route handlers thin:
  * parse/validate
  * call service/domain function
  * return typed response
* Keep domain rules in named helpers/services with tests.

## Contracts And Generation

* `pnpm gen:contract` must regenerate OpenAPI and Orval client.
* Frontend should fail typecheck if backend response shapes change incompatibly.
* Do not copy generated types into app code.
* Do not fix generated-client errors by editing generated output.
* If generation fails:
  * fix schema/route/OpenAPI source
  * rerun generation
  * verify imports
* Public exports from `packages/api-client` may be hand-written thin barrels only.
* Keep generated output path predictable and ignored/committed according to project decision. Be consistent and document it.

## Commands

* Package manager: `pnpm` only.
* Workspace orchestrator: Turborepo.
* Expected scripts at repo root:
  * `pnpm dev:dashboard`
  * `pnpm dev:backend`
  * `pnpm gen:contract`
  * `pnpm lint`
  * `pnpm typecheck`
  * `pnpm test`
* Add focused package scripts when useful, but keep root scripts reviewer-friendly.
* Prefer repo scripts over raw tool invocations.
* If dependencies are missing: run `pnpm install`, retry once, then report the first actionable error.
* Start local dev server after implementing a runnable web app and provide the local URL.

## Validation

* Before final handoff, prove touched surface.
* Before every commit, review the diff for correctness, scope, generated artifacts, secrets, and accidental unrelated edits.
* Code changes need at least one review pass before commit:
  * self-review with `git diff`
  * targeted command proof when practical
  * explicit note of any unverified surface
* Minimum useful proof:
  * `pnpm gen:contract`
  * `pnpm typecheck`
  * `pnpm test`
  * `pnpm lint` when configured
  * dashboard web smoke test when frontend changed
* Backend tests must cover key order behavior:
  * valid order creation
  * unavailable menu item rejection
  * server-side total calculation
  * invalid status transition rejection
  * valid status transition success
* Frontend tests should cover important UI state or orchestration logic:
  * empty/loading/error states
  * status action availability
  * form validation or generated hook integration wrapper
* If proof is blocked, say exactly what command failed, why, and what remains unverified.
* Do not claim end-to-end integration without running at least one real dashboard-to-backend path or a credible equivalent.

## Code

* TypeScript strict.
* Prefer real types, discriminated unions, and schema inference.
* Avoid `any`. Use `unknown` plus narrowing at external boundaries.
* No `@ts-nocheck`.
* Lint suppressions need a short reason.
* Use early returns over nested pyramids.
* Split code into gather -> normalize -> decide -> act.
* Calls should be boring; complex decisions happen above the call.
* Use named intermediates for domain meaning, not noise.
* Comments only for non-obvious, risky, or domain-important logic.
* Keep files small enough to review. Split around 500-700 LOC when clarity improves.
* Use structured parsers/APIs instead of ad hoc string manipulation.
* Do not edit `node_modules`.

## Database

* PostgreSQL is the intended database.
* Drizzle schema is the persistence source of truth.
* Prefer explicit column names and constraints.
* Use integer cents for money.
* Store timestamps consistently.
* Store order item price snapshots.
* Model relationships clearly:
  * categories -> menu items
  * customers -> orders
  * orders -> order items
  * settings -> restaurant/business config
* Keep migrations reproducible.
* Seed should be deterministic and safe to rerun or clearly documented if reset-only.

## Testing

* Use Vitest unless the project later establishes a different required test runner.
* Colocate narrow unit tests with domain code when practical.
* Backend domain tests should not need a browser.
* Prefer behavior tests over snapshot-heavy tests.
* Clean test data, timers, env, and mocks.
* Do not weaken tests to make CI pass.
* Do not edit snapshots/baselines without understanding the behavioral change.

## Git

* Do not assume a git repo exists until `git status` succeeds. If the project is being implemented from scratch, initialize git first.
* Every coherent modification must end in a commit.
* Commit after each meaningful unit of work:
  * project scaffold
  * backend schema/API slice
  * contract generation
  * frontend feature/page
  * tests/docs updates
* Do not batch unrelated work into one commit.
* Do not leave finished changes unstaged/uncommitted at handoff unless the user explicitly asks to pause before committing.
* Before committing:
  * inspect `git status --short`
  * inspect `git diff`
  * run targeted validation for the touched surface
  * verify no secrets or unrelated files are included
* Never revert user changes unless explicitly asked.
* Stage intended files only.
* Conventional-ish concise commits if asked to commit.
* No destructive commands (`git reset --hard`, `git checkout --`) unless explicitly requested.
* Do not change branches unless asked.
* If unexpected files appear, ignore if unrelated; ask only if blocking.

## Docs / Handoff

* README must include:
  * what the product does
  * stack overview
  * local setup
  * database setup
  * seed instructions
  * generation instructions
  * dev scripts
  * test scripts
  * architecture decisions
  * tradeoffs/incomplete areas
* Keep architecture notes honest and short.
* Mention generated contract pipeline explicitly.
* Include reviewer-friendly demo data and flows.
* Optional Loom script should highlight architecture first, then product polish.

## Security

* No real secrets in repo.
* Keep env examples fake and clearly named.
* Validate public inputs at the API boundary.
* Avoid leaking stack traces in JSON responses.
* Treat lockfiles and dependency overrides as security-sensitive.
* New dependency must have a clear purpose.

## Final Handoff Checklist

* Required stack present.
* Dashboard runs on web.
* Backend runs locally.
* PostgreSQL schema and seed available.
* Contract generation works.
* Frontend imports generated hooks/types.
* Five pages implemented.
* UI Library route implemented.
* Menu management works.
* Order creation works.
* Order filters/details/status actions work.
* CRM summary/history works.
* Settings update works.
* Home summary data works.
* Backend tests cover order rules.
* Frontend tests cover important UI logic/states.
* README explains setup, seed, architecture, and tradeoffs.
