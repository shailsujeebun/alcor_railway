# Marketplace Clone (АЛЬКОР)

A B2B equipment marketplace platform with a NestJS backend API and Next.js frontend. This project features a multi-marketplace system supporting Agriculture, Commercial Vehicles, Industrial Machinery, and Cars.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm
- Docker & Docker Compose

### Installation

1. **Start infrastructure services**
   ```bash
   docker compose up -d
   ```

2. **Setup backend**
   ```bash
   cd api
   pnpm install
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   pnpm start:dev
   ```

3. **Setup frontend**
   ```bash
   cd web
   pnpm install
   pnpm dev
   ```

The backend runs on `http://localhost:3000` and the frontend on `http://localhost:3001`.

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive project documentation including tech stack, architecture, API endpoints, and development patterns
- **[AD.MD](./AD.MD)** - Ad placement & listing wizard documentation
- **[ADMIN.MD](./ADMIN.MD)** - Admin features documentation (marketplaces, categories, form templates)
- **[security-hardening.md](./security-hardening.md)** - Prioritized security hardening backlog with owners, acceptance criteria, and verification tests
- **[security-signoff-evidence.md](./security-signoff-evidence.md)** - Production security sign-off evidence matrix and verification runbook
- **[production-test.md](./production-test.md)** - Production readiness testing strategy, gates, and pass criteria
- **[DB_ER_DIAGRAM.MD](./DB_ER_DIAGRAM.MD)** - Database entity relationship diagram
- **[plan.md](./plan.md)** - Marketplace ad-posting system implementation plan
- **[task.md](./task.md)** - Development task checklist

## 🛠️ Tech Stack

### Backend
- NestJS 11
- PostgreSQL 16 with Prisma 7 ORM
- Redis (caching)
- OpenSearch (search)
- MinIO (file storage)
- JWT authentication

### Frontend
- Next.js 16 (App Router)
- Tailwind CSS v4
- TanStack React Query v5
- Zustand (auth state)
- AOS animations

## 📁 Project Structure

```
marketplace-clone/
├── api/          # NestJS backend
├── web/          # Next.js frontend
└── docker-compose.yml
```

## 🔑 Key Features

- Multi-marketplace system (Agriculture, Commercial, Industrial, Cars)
- Dynamic form templates per category
- Guest ad placement with draft persistence
- Multi-step listing wizard
- Admin panel for marketplace/category/template management
- Company profiles with reviews
- Messaging system
- Support tickets
- Subscription plans

## 📝 License

This project is proprietary software.

## 👥 Contact

For more information, please refer to the detailed documentation files listed above.

## Updates (2026-02-16)

- Admin templates were expanded into full lifecycle management:
  - New admin template list page at `/admin/templates`.
  - Backend endpoints for listing, deleting, and toggling template status.
  - Versioned template creation per category with automatic active-template switching.
- Form Builder (`/admin/templates/builder`) now supports loading by query params (`templateId`, `categoryId`) and has separate actions for "Save Changes" and "Save as New Version".
- Listing wizard improvements shipped:
  - Fixed client directive issue in description step.
  - Added parent/subcategory cascading selection and better dynamic-form loading states.
  - Extended wizard form state with listing core fields (brand, condition, year, price, listing type, euro class, hours, external URL).
  - Wrapped wizard usage of `useSearchParams` with `Suspense` for Next.js 16 compatibility.
- Project-wide language toggle was added:
  - Global `EN/UA` switch button in the app shell.
  - `/api/translate` endpoint for batch translation requests.
  - Full-page runtime translation for text nodes and common UI attributes.
- Lint cleanup was applied and web lint/build are passing after rule and code adjustments.

### Translation Architecture Refactor (2026-02-16, `feature-translation`)

- Replaced runtime DOM auto-translation with dictionary-based i18n (`web/src/i18n/*` + `t(key)` helper).
- Translation toggle now only switches `locale` (`uk`/`en`) in memory:
  - No language persistence.
  - No automatic translation on initial load.
  - No MutationObserver/text-node rewriting.
- Kept `/api/translate` as a compatibility fallback for still-hardcoded pages:
  - Translation requests run only after the user clicks `EN`.
  - Provider runs controlled one/two-pass translation per route (no observer loop).
  - In `EN` mode, a debounced child-list observer now re-applies fallback translation for late async UI updates without reintroducing translation loops.
- Default load remains fast in `uk`.
- Migrated shared UI to key-based translations:
  - Top bar, navbar, mobile menu, footer.
  - Admin sidebar labels.
  - Cabinet sidebar labels.
  - Listing wizard step labels and tip text.
- Validation status:
  - `web`: lint/build passing after refactor.

### Additional Hardening (2026-02-16)

- Auth i18n migration:
  - Migrated auth UI to key-based translations (`auth.tabs.*`, `auth.login.*`, `auth.register.*`, `auth.forgot.*`, `auth.reset.*`, `auth.verify.*`).
  - Added matching keys in both `web/src/i18n/messages/en.ts` and `web/src/i18n/messages/uk.ts`.
- Translation API hardening (`web/src/app/api/translate/route.ts`):
  - Added request validation and payload limits.
  - Added per-client rate limiting.
  - Added timeout handling for upstream translation calls.
  - Added cache TTL and simple LRU-style eviction.
  - Added in-flight request de-duplication for repeated texts.
  - Added privacy controls:
    - `TRANSLATION_EXTERNAL_ENABLED` to fully disable external translation by environment.
    - `TRANSLATION_ALLOW_PII` (default `false`) to block translation of likely sensitive text (email/phone/URL patterns).
  - Added policy document: `docs/translation-privacy-policy.md`.
- i18n guard:
  - Added `web/scripts/check-hardcoded-i18n.mjs`.
  - Added `npm run i18n:guard` in `web/package.json`.
  - Guard currently enforces no hardcoded Cyrillic text in `web/src/components/auth`.
- Seed system overhaul:
  - Added deterministic full-schema seeding entrypoint: `api/prisma/seed-all.ts`.
  - Modularized seed logic under `api/prisma/seed-all/` (`cleanup`, `core`, `companies-listings`, `engagement`).
  - Added post-seed verification script: `api/prisma/seed-verify.ts`.
  - Added API scripts: `seed:all`, `seed:verify`; default Prisma seed now points to `seed-all.ts`.
- CI quality gates:
  - Added GitHub Actions workflow: `.github/workflows/ci.yml`.
  - Web gates: `i18n:guard`, `lint`, `build`.
  - API gates: `build`, `test`, `test:e2e`.
  - Security test suite gate: `test:security` (auth abuse, listing authZ, upload abuse/rate-limit checks).
  - Seed smoke job: `prisma migrate deploy`, `seed:all`, `seed:verify`.
  - Security gates:
    - `api-security-audit` (`pnpm audit --prod --audit-level high`).
    - `secret-scan` (Gitleaks with `.gitleaksignore` baseline).
    - `sast-scan` (Semgrep `p/security-audit`, `ERROR` severity, optional baseline ref/commit).

## Update - 2026-02-17 (Fix_download)
- Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
- Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
- Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
- Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
- Completed validation checks and build/test verification; local infrastructure (Postgres/Redis/MinIO) confirmed working for this flow.

## Update - 2026-02-23 (Listing Experience + Media Stability)
- Listing detail page redesigned to a professional marketplace structure with improved animation and section flow.
- Dynamic form values are now consistently displayed in listing details (with template option label mapping and grouped accordion sections).
- Pricing and details cleanup:
  - request-price cases render correctly
  - placeholder-only descriptions are hidden from public listing details.
- Upload/media reliability improvements:
  - added API-backed file serving route (`/upload/files/:folder/:filename`)
  - upload endpoint now returns stable API URLs
  - frontend normalizes older MinIO URLs into API file URLs
  - added client-side type/size validation for image uploads.

## Update - 2026-02-24 (Sync + Runtime Fixes)
- Repository sync and remote stability:
  - fixed malformed Git remote URL that blocked remote operations
  - synchronized updates for target repositories/branches used in today’s migration/sync flow.
- Upload and media runtime fixes:
  - backend upload response now returns API-relative media paths
  - frontend upload URL normalization hardened for mixed path/url formats
  - Next.js security policy updated to allow local HTTP image rendering in dev mode.
- Listing creation reliability:
  - hardened category ID parsing to avoid BigInt conversion crashes
  - added safe fallback when template block data is missing during draft validation.
- Admin moderation workflow:
  - added support for moderation actions on `PENDING_MODERATION` listings.
- Listing detail UX:
  - boolean values now display as `Yes`/`No`.
- Verification run:
  - API build passing
  - API security suite passing
  - local smoke tests passing across auth/category/options/upload/listing flows.

## Update - 2026-02-24 (Taxonomy Rollout + Category UX + Responsive Footer)
- Seeded complete marketplace taxonomy across `agroline`, `autoline`, and `machineryline`:
  - full top-level categories
  - structured subcategories
  - leaf-category templates generated in seed pipeline.
- Added resilient cleanup handling in seed flow to avoid cleanup-stage permission/blocker failures from halting `seed:all`.
- Reworked listing-posting category selection UI:
  - marketplace tabs + category/subcategory cards
  - improved category icon matching.
- Reworked category discovery/navigation:
  - home now shows 3 top-level marketplace cards
  - category catalog is marketplace-scoped with tab switching and search
  - direct links supported through `/categories?marketplace=<key>`.
- Fixed layout issues found in QA screenshots:
  - removed unwanted dark spacer above footer
  - made footer alignment/responsiveness more professional at reduced widths.
- Reliability/build follow-up:
  - fixed TS issues in template builder and listing/company UI code paths
  - confirmed green build and verification commands (`api`: seed/test/build, `web`: build).

## Update - 2026-03-05 (Naming, Form Rules, Date Range, i18n, Dedupe)
- Marketplace/category naming updates in UI:
  - `autoline` -> `automarket`
  - `machineryline` -> `industrial machinery`
  - `agroline` -> `agromarket`
  - `industrial equipment` -> `equipment`
- Required-field policy was narrowed to critical ad-posting fields only:
  - marketplace, category/subcategory, ad title
  - dynamic essentials: brand, model, year of manufacture (year), condition
  - moderation readiness: at least one photo + at least one contact method (phone/email)
- Future date support added for expiration-like fields:
  - `technical_inspection_year` now includes future years (current year + 15)
  - frontend fallback logic also extends future years for `valid till` / `expiry` / `expiration` year selectors in existing templates.
- Translation fallback made bidirectional for runtime hardcoded text:
  - kept dictionary i18n as primary path
  - fallback API/provider now support both `uk -> en` and `en -> uk` for late/legacy UI text and common attributes.
- Form rendering dedupe hardening:
  - removes repeated dynamic fields (by key/signature)
  - removes repeated select options (value/label duplicates).

### Verification snapshot (2026-03-05)
- Passing:
  - `web`: `pnpm run lint`, `pnpm exec tsc --noEmit`, `pnpm run i18n:guard`
  - `api`: `pnpm run test`, `pnpm run test:security`, `pnpm run test:e2e`
  - `api` compile path: `DATABASE_URL=postgresql://dummy pnpm exec prisma generate && pnpm exec nest build`
- Environment-limited in this sandbox:
  - `web`: `pnpm run build` blocked by Google Fonts fetch restrictions.

## Update - 2026-03-27 (Translation Coverage + Main Website Linking)

- Expanded key-based translation coverage for the marketplace home and company flows:
  - featured listings
  - categories
  - supplier highlights
  - process steps
  - company catalog filters/results
  - company detail/reviews
  - shared listing/company cards.
- Added the missing translation message keys in both locales so the EN/UA switch translates those core screens directly instead of relying on fallback translation.
- Connected marketplace chrome back to the main Alcor site:
  - logo clicks now return to the main website
  - footer service links now open the main-site leasing, lending, and factoring pages
  - footer address, phone, and email are clickable.

### Validation
- `pnpm --dir web exec eslint` passing for changed files
- `pnpm --dir web run i18n:guard` passing
