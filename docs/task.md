# Task Checklist

- [/] Phase 1 — Foundations (Week 1 Equivalent Scope)
    - [ ] Create tables: `marketplace`, `category`, `listing`, `attributes`, `facts`, `media`, `seller_contact`
    - [ ] Build endpoints:
        - [ ] `POST /listings/draft` (Creates draft)
        - [x] `GET /marketplaces`
        - [x] `GET /categories?marketplaceId=...`
- [ ] Phase 2 — Dynamic Forms (Core of Step 2)
    - [ ] Build template tables: `form_template`, `form_field`, `field_option`
    - [ ] Create admin seed scripts for templates
    - [ ] Build endpoints:
        - [ ] `GET /categories/:id/template` (Returns schema + options)
        - [ ] `PUT /listings/:id/attributes` (Validates + stores)
    - [ ] Implement Validator: Required, min/max, regex, conditional rules
- [ ] Phase 3 — Media Pipeline (Step 3)
    - [ ] Build Endpoint: Presigned upload
    - [ ] Implement Features:
        - [ ] Save media rows
        - [ ] Background job: Thumbnails, metadata extraction
- [ ] Phase 4 — Contacts + Publish (Step 4)
    - [ ] Build Endpoints:
        - [ ] `PUT /listings/:id/contact`
        - [ ] `POST /listings/:id/publish` (Validate all steps, set status published, build slug, index to search)
- [ ] Phase 5 — Search & Filters
    - [ ] Build Search Index
    - [ ] Implement Features:
        - [ ] Facets per marketplace (Cars facets differ)
        - [ ] Related listings logic
    - [ ] Public Endpoints:
        - [ ] `GET /search`
        - [ ] `GET /listings/:id`

## Test Status

- 2026-02-12: `api` tests passed (`npm test`)
- 2026-02-12: `api` lint failed with existing errors (`npm run lint`)
- 2026-02-12: `web` lint failed with existing errors (`npm run lint`)
- 2026-02-12: Fixed `react-hooks/set-state-in-effect` warnings in marketplace default selection (no tests rerun)
- 2026-02-12: Re-ran `web` lint after fix; warnings gone, lint still failing due to existing errors
- 2026-02-12: Ad placement wizard now scopes category list by `marketplaceId` from URL
- 2026-02-12: Excluded `prisma/*.ts` seed files from API tsconfig to avoid dev-server compile errors
- 2026-02-12: Admin categories now fetch marketplace-scoped tree for selected marketplace
- 2026-02-12: Added Agroline/Autoline marketplace trees to seed data with Ukrainian names and URL slugs
- 2026-02-12: Listing wizard contact step now lets users create a company if none exist
- 2026-02-12: Listing media uploads now send `type=PHOTO` to satisfy backend validation
- 2026-02-12: Company creation now generates valid slugs and listing submit requires a company; presigned uploads now use public URLs
- 2026-02-12: Company selector now requests max 100 companies to satisfy backend limit validation
- 2026-02-12: Listing attribute storage now maps key/value array into JSON attribute record
- 2026-02-12: Strip media `key` before Prisma createMany to match schema
- 2026-02-12: Upload service now sets MinIO bucket policy to public-read so images render
- 2026-02-16: `web` i18n guard added (`npm run i18n:guard`) and passing
- 2026-02-16: `web` lint passing (`npm run lint`)
- 2026-02-16: `web` production build passing (`npm run build`)
- 2026-02-16: `api` build passing (`npm run build`)
- 2026-02-16: `api` unit tests passing (`npm test -- --runInBand`)
- 2026-02-16: `api` e2e smoke passing (`npm run test:e2e -- --runInBand`)
- 2026-02-16: Applied pending migration `20260213093000_add_brand_category_map` via `npx prisma migrate deploy`
- 2026-02-16: Deterministic full seed passing (`npm run seed:all`)
- 2026-02-16: Post-seed integrity checks passing (`npm run seed:verify`)

## Update - 2026-02-17 (Fix_download)
- Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
- Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
- Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
- Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
- Completed validation checks and build/test verification; local infrastructure (Postgres/Redis/MinIO) confirmed working for this flow.

## Update - 2026-02-23 (Listing Detail Delivery)
- Listing detail now renders submitted dynamic attributes reliably (including section grouping + option label resolution).
- Listing detail page redesigned into marketplace-style structure with animated accordion characteristics.
- Price fallback logic updated to avoid placeholder dash output and align with request-price scenarios.
- Description normalization added to suppress placeholder content values (`-`, `—`, `n/a`, `none`, `null`).
- Upload reliability improvements delivered:
  - API file proxy route for uploaded assets
  - upload response now returns API-backed asset URLs
  - frontend media URL normalization for existing listings
  - stricter client-side image type/size validation before upload.

## Test Status (Latest)
- 2026-02-23: `api` build passing (`pnpm build`)
- 2026-02-23: `web` eslint passing for changed listing/media files

## Update - 2026-02-24 (Operational + Reliability Fixes)
- Fixed malformed Git remote URL (newline in origin path) that prevented `fetch/push`, then aligned repository remotes for sync with target accounts/repos.
- Fixed upload image rendering regressions:
  - backend upload response standardized to API-served media paths
  - frontend media URL normalization made robust for mixed URL formats
  - frontend CSP updated to allow local HTTP image sources during development.
- Fixed ad creation internal server error path:
  - safe category ID parsing and validation in listing creation flow
  - resilient template block fallback to avoid runtime failure when `formBlock` data is missing.
- Fixed admin moderation action availability:
  - add/reject controls now enabled for `PENDING_MODERATION` as well as `SUBMITTED`.
- Updated listing details boolean rendering from raw `true/false` to user-friendly `Yes/No`.

## Test Status (Latest)
- 2026-02-24: `api` build passing (`pnpm build`)
- 2026-02-24: `api` security tests passing (`pnpm test:security`)
- 2026-02-24: local API smoke checks passing for auth, categories, options, upload, and listing create/read flows

## Update - 2026-02-24 (Taxonomy + Categories UX + Footer/Layout)
- Seeded full marketplace taxonomy for `agroline`, `autoline`, `machineryline` (including subcategory trees and leaf templates).
- Added resilient cleanup guards to prevent seed cleanup failures in delete-many paths.
- Upgraded listing wizard category selection:
  - marketplace tabs + category/subcategory cards
  - improved category icon/emoji matching by type.
- Updated categories browsing UX:
  - marketplace-first tabs and scoped discovery
  - query-param support (`/categories?marketplace=...`) and Next.js `Suspense` wrapper for search params.
- Updated home page categories section:
  - replaced mixed category wall with 3 marketplace cards leading to scoped category pages.
- Fixed layout polish from QA feedback:
  - removed unwanted black spacer above footer
  - made footer grid/responsiveness more stable on narrow/half-width viewports.
- Applied web TypeScript fixes that were blocking clean build after updates.

## Test Status (Latest)
- 2026-02-24: `api` seed pipeline green (`pnpm run seed:all`, `pnpm run seed:verify`)
- 2026-02-24: `api` unit tests green (`pnpm test`)
- 2026-02-24: `api` security tests green (`pnpm test:security`)
- 2026-02-24: `api` build green (`pnpm build`)
- 2026-02-24: `web` production build green (`pnpm build`)

## Update - 2026-03-01 (Vehicle Parameters Parity Pass)
- Upgraded the motorized dynamic template to an Agroline-style parameter model with expanded sections and field types.
- Preserved config-driven behavior for dependencies/conditionals and added runtime `engine_block` consistency so rendered form and validator stay aligned.
- Added submit-time mapping so dynamic attributes can populate core listing payload fields (brand/price/currency/year/condition/advert type/euro).

## Test Status (Latest)
- 2026-03-01: `api` unit/security suite green (`pnpm -C api test --runInBand`)
- 2026-03-01: `api` TypeScript check green (`pnpm -C api exec tsc --noEmit`)
- 2026-03-01: `web` TypeScript check green (`pnpm -C web exec tsc --noEmit`)
- 2026-03-01: `web` lint green (`pnpm -C web lint`)
- 2026-03-01: `api` build blocked in local shell (`cross-env` missing)
- 2026-03-01: `web` build blocked in sandbox (Google Fonts network fetch unavailable)
- 2026-03-01: `api` e2e blocked in sandbox (port bind `EPERM`)

## Update - 2026-03-27 (Marketplace Translation + Footer/Main-Site Routing)
- Migrated more visible marketplace UI from hardcoded text to dictionary-based translation:
  - landing sections
  - company catalog
  - company detail
  - review form/list
  - shared listing/company cards.
- Added missing `en`/`uk` translation keys for those surfaces.
- Updated marketplace footer:
  - service links now open the main-site leasing, lending, and factoring pages
  - address, phone, and email are clickable.
- Updated shared marketplace landing target so logo clicks return users to the main Alcor website.

## Test Status (Latest)
- 2026-03-27: `pnpm --dir web exec eslint` passing for changed files
- 2026-03-27: `pnpm --dir web run i18n:guard` passing

## Documentation Refresh - 2026-03-28

Reviewed during the `new_improvements` branch documentation pass.
For the latest implementation state, see `REBUILD_CHANGELOG.md` and `docs/project_status.md`.
