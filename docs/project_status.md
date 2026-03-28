# Project Status Update - 2026-02-13

## 1. Task Checklist

- [x] **Start Docker Infrastructure**
  - [x] User: Start Docker Desktop application
  - [x] Start all Docker containers (`docker compose up -d`)
  - [x] Verify all services are running
- [x] Fix Port Configuration
  - [x] Stop frontend process on port 3000
  - [x] Update frontend configuration to use port 3001
  - [x] Update API `.env` to set correct `FRONTEND_URL`
  - [x] Restart frontend on port 3001 (ready to restart)
- [x] **Login Page UI Redesign**
  - [x] Increase card width to max-w-4xl (896px)
  - [x] Match registration form layout (headings, spacing, padding)
  - [x] Fix button styling and error messages
- [x] **Remove Logos**
  - [x] Remove "AND" logo from Auth Layout
  - [x] Remove "AND" logo from Navbar and Footer
- [x] **Improve Navbar Layout**
  - [x] Increase space between Logo and Menu
  - [x] Ensure Logo is far left
- [x] **Improve Ad Placement Layout**
  - [x] Analyze "Select a section" page structure
  - [x] Fix alignment and spacing of main content vs sidebar
- [x] **Debug Terminal Errors**
  - [x] Analyze terminal output for process 25476
  - [x] Fix identified errors (Killed blocking process PID 29432)
- [x] **Seed Database**
  - [x] Check for seed script
  - [x] Run seed command (Populated Users, Locations, Categories, Companies)
- [x] **Debug Company Directory**
  - [x] Investigate why "No companies found" (Frontend pointed to wrong port 3005)
  - [x] Check API response for companies
  - [x] Fix data fetching (Updated web/.env.local to port 3000)
- [x] **Fix Company Filters**
  - [x] Analyze filter components and data fetching (Confirmed API Endpoints work)
  - [x] Fix broken CompaniesFilters component (Refactored to use Select primitives)
- [x] **Fix Filter Design**
  - [x] Analyze dropdown transparency and contrast issues
  - [x] Fix `bg-popover` or `SelectContent` styling
- [x] **Fix Listing Filters Design**
  - [x] Identify ListingsFilters component
  - [x] functionality and styling fixes
- [x] **Migrate Documentation**
  - [x] Copy artifacts to project repository
- [x] Verify API Startup
  - [x] Restart API server
  - [x] Confirm no Redis connection errors
  - [x] Confirm no port conflict errors
- [x] Test System Integration
  - [x] Verify API responds on port 3000
  - [x] Verify frontend loads on port 3001
  - [x] Test API-frontend communication

---

## 2. Implementation Plan

### Fix API Startup Errors

#### Problem Analysis

The API is failing to start due to two critical issues identified from the terminal output:

1. **Redis Connection Failures (ECONNREFUSED)**: Docker containers are not running. The API expects Redis on `localhost:6379`, but the `mp_redis` container is stopped.
2. **Port 3000 Already in Use (EADDRINUSE)**: Port 3000 is occupied by the frontend dev server, conflicting with the API which also wants port 3000.

#### Proposed Changes

1. **Start Docker Infrastructure**: Use `docker compose up -d` to start Redis, PostgreSQL, OpenSearch, MinIO, and Mailpit.
2. **Fix Port Configuration**:
   - Update `web/.env.local` to point `NEXT_PUBLIC_API_URL` to `http://localhost:3000`.
   - Update `web/package.json` to run frontend on port 3001 (`next dev -p 3001`).
3. **Login Page UI Redesign**:
   - Overhaul `auth-tabs.tsx` and `login-form.tsx` to use a wide card (`max-w-4xl`), increased padding, and consistent styling with the registration form.
   - Update `(auth)/layout.tsx` to remove width constraints.
4. **Remove Logos**: Remove the "AND" logo icon from Auth Layout, Navbar, and Footer as requested.
5. **Improve Layouts**: Adjust Navbar spacing and Ad Placement sidebar alignment.

### Additional Tasks Executed

#### 11. Debug Company Directory
- **Issue:** "No companies found" logic.
- **Fix:** Corrected `NEXT_PUBLIC_API_URL` port mismatch.

#### 12. Fix Company Filters
- **Issue:** Broken filters (runtime error) due to invalid `Select` usage.
- **Fix:** Refactored `CompaniesFilters.tsx` to use `Select` primitives.

#### 13. Fix Filter Design
- **Issue:** Transparent dropdowns due to missing Tailwind v4 theme colors.
- **Fix:** Added semantic color mappings to `globals.css`.

#### 14. Fix Listing Filters Design
- **Issue:** Invisible filters on Classifieds page.
- **Fix:** Refactored `ListingsFilters.tsx` to use `Select` primitives.

---

## 3. Walkthrough & Results

### Login Card Layout Overhaul

**Key Changes:**
1.  **Card Width:** Increased from `max-w-md` (448px) to `max-w-4xl` (896px).
2.  **Heading:** Added "Login" heading.
3.  **Spacing:** Increased form spacing (`space-y-5`) and padding (`p-10`).
4.  **Constraint:** Removed parent container layout constraint.

**Result:** The login page now matches the registration form's wide, spacious design.

### Logo Removal & Navbar Fixes
- Removed the "AND" logo icon from all locations.
- Adjusted Navbar to place the text logo on the far left with proper spacing before the menu.

### Filters & Design Fixes
- **Companies Page:** Filters are now functional and populated.
- **Classifieds Page:** Filters are now visible and functional.
- **Dropdown Design:** All dropdowns now have a solid dark blue background (fixed transparency issue).

### System Health
- **API:** Running on port 3000 (no conflicts).
- **Frontend:** Running on port 3001.
- **Database:** Seeded with test data (Users, Companies, Categories).

### Dashboard UX Improvements (New)
1.  **Layout Spacing:** Increased gap between sidebar and content to **40px** (`gap-10`) for better separation.
2.  **Redundancy Removal:** Hidden "Quick Actions" bar when there are 0 ads, leaving only the main "Create your first ad" button.
3.  **Typography:** Fixed trailing space in "Welcome, Admin!" greeting.

---

## 4. Translation + Seed + CI Hardening (2026-02-16)

- **Translation reliability and speed**
  - Default page load remains in `uk` (no EN persistence).
  - English translation runs only on explicit toggle click.
  - `/api/translate` hardened with payload limits, throttling, timeout, cache TTL/LRU behavior, and in-flight request de-duplication.
- **Key-based i18n migration expansion**
  - Auth entry flows (`auth-tabs`, login/register, forgot/reset, verify-email) migrated to dictionary keys (`web/src/i18n/messages/*`).
  - Added i18n hardcoded-text regression guard: `web/scripts/check-hardcoded-i18n.mjs`.
- **Deterministic full-schema seeding**
  - Added modular seed pipeline under `api/prisma/seed-all/`.
  - Added entrypoint `api/prisma/seed-all.ts` and set as default Prisma seed.
  - Added integrity verifier `api/prisma/seed-verify.ts`.
- **Quality gates and smoke checks**
  - Added CI workflow `.github/workflows/ci.yml`:
    - Web: `i18n:guard`, `lint`, `build`
    - API: `build`, `test`, `test:e2e`
    - Seed smoke: `prisma migrate deploy`, `seed:all`, `seed:verify`

## Update - 2026-02-17 (Fix_download)
- Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
- Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
- Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
- Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
- Completed validation checks and build/test verification; local infrastructure (Postgres/Redis/MinIO) confirmed working for this flow.

## 5. Update - 2026-02-23 (Listing UI + Attributes + Media Reliability)

- Restored and stabilized Category Autoline listing details rendering so submitted dynamic form values are visible in the ad view.
- Upgraded listing details page structure to a professional marketplace layout:
  - 3-column hero area (summary/price, gallery, seller contacts)
  - sectioned details cards
  - accordion-based characteristics that mirror form sections
  - improved motion/visual polish (animated expansion, staged reveal, hover states).
- Fixed value-label mapping for template options so displayed characteristics match selected dropdown labels.
- Improved summary behavior:
  - shows meaningful listing data and top filled characteristics
  - no placeholder-only rows where avoidable.
- Fixed pricing display fallback behavior:
  - `ON_REQUEST` and missing amount now consistently render as request-based pricing text instead of generic placeholders.
- Cleaned details output by suppressing placeholder descriptions (`-`, `—`, `n/a`, `none`, `null`).
- Hardened media pipeline end-to-end:
  - added API-backed media serving route `GET /upload/files/:folder/:filename`
  - upload endpoint now returns stable API URLs
  - frontend normalizes legacy MinIO URLs to API file URLs
  - added client-side upload validation (allowed mime types and 10MB/file limit).
- Verification completed:
  - `api`: `pnpm build` passing
  - `web`: eslint passing for changed files (`listing-detail.tsx`, `price-display.tsx`, `media-uploader.tsx`, `lib/api.ts`).

## 6. Update - 2026-02-24 (Stability, Upload Rendering, Moderation UX, Repo Sync)

- Fixed Git remote configuration issue that blocked `fetch/push`:
  - removed malformed origin URL containing a newline
  - set clean remote targets and synchronized `main`/`fix_download` updates across required repos.
- Resolved listing image preview/render failures after upload:
  - backend upload response now returns API-relative file paths from `POST /upload/images`
  - frontend upload URL normalization was hardened for relative and absolute media paths
  - Next.js image/content security policy updated to allow local `http:` image sources used during dev.
- Hardened listing creation validation to prevent internal server errors:
  - safe numeric parsing for category IDs in listing service
  - graceful fallback when template `formBlock` lookup is missing
  - built-in `engine_block` fallback applied for motorized categories when DB block data is absent.
- Moderation workflow unblocked in admin UI:
  - added explicit `PENDING_MODERATION` tab
  - approve/reject controls now available in both `SUBMITTED` and `PENDING_MODERATION` views.
- Listing detail presentation polish:
  - boolean-like values now render as `Yes`/`No` instead of raw `true`/`false`.
- Access-control clarification verified:
  - creating brand/model/category options requires authenticated permissions; guest users receive `401 Unauthorized` by design.
- Validation and runtime checks completed:
  - `api`: `pnpm build` passing
  - `api`: `pnpm test:security` passing (4 suites, 16 tests)
  - API smoke checks for auth, categories, options, upload, listing create/read flows all passing against local runtime.

## 7. Update - 2026-02-24 (Marketplace Taxonomy, Category Navigation, Responsive Footer)

- Completed taxonomy rollout for production marketplace structure:
  - seeded complete top-level categories for `agroline`, `autoline`, `machineryline`
  - populated subcategory trees and generated templates for leaf categories
  - retained legacy marketplaces as inactive for compatibility.
- Fixed seed cleanup blocker:
  - added resilient guarded deletion for cleanup-stage `deleteMany` calls (including ticket-message cleanup paths).
- Upgraded posting/category UX:
  - listing wizard description step now uses marketplace tabs with category/subcategory cards
  - category icon/emoji assignment improved to better match category meaning
  - categories page switched to marketplace-first navigation with search + `?marketplace=` deep links.
- Simplified home categories section:
  - homepage now shows 3 marketplace entry cards only (Autoline/Machineryline/Agroline)
  - each card opens scoped category browsing instead of mixing all categories together.
- Fixed layout polish issues from QA screenshots:
  - removed unwanted black spacer above footer by removing extra global main bottom padding
  - refactored footer to behave correctly at half-width and mobile breakpoints.
- Build/test status confirmed green after changes:
  - `api`: `pnpm test`, `pnpm test:security`, `pnpm build`, `pnpm run seed:all`, `pnpm run seed:verify`
  - `web`: `pnpm build`.

## 8. Update - 2026-03-01 (Agroline-Style Vehicle Form Expansion)

- Delivered a major motorized form schema expansion for the posting wizard:
  - Agroline-style sections and parameter coverage (basic characteristics, engine/gearbox, axles/brakes, options matrices, ad parameters).
  - Dynamic field behavior preserved through config (cascades, conditional visibility, unit fields, radios/checkbox groups, color swatches).
- Added runtime consistency hardening:
  - built-in `engine_block` now takes precedence at runtime and validation time to avoid stale DB block mismatch.
- Added dynamic-to-core payload mapping in listing submit:
  - dynamic `brand`, `price`, `currency`, `year`, `condition`, `advert_type`, and `euro` now map into core listing payload where relevant.

### Verification snapshot (2026-03-01)

- Passing:
  - `pnpm -C api test --runInBand`
  - `pnpm -C api exec tsc --noEmit`
  - `pnpm -C web exec tsc --noEmit`
  - `pnpm -C web lint`
- Environment-limited in this sandbox:
  - `pnpm -C api build` blocked by missing `cross-env` binary
  - `pnpm -C web build` blocked by external Google Fonts fetch restrictions
  - `pnpm -C api test:e2e` blocked by sandbox port binding (`listen EPERM`).

## 9. Update - 2026-03-27 (Marketplace Translation Coverage + Main-Site Linking)

- Expanded dictionary-based translation coverage for the main marketplace user flow:
  - landing sections
  - company catalog filters/grid
  - company detail tabs, badges, empty states, and review UI
  - shared listing and company cards.
- Added matching `en` and `uk` message keys so the language switch translates those core screens directly instead of depending on fallback DOM translation.
- Aligned marketplace shell navigation with the main Alcor website:
  - clicking the marketplace logo now returns to the main website
  - footer service links now open the main-site leasing, lending, and factoring pages.
- Made footer contacts interactive:
  - address opens a map lookup
  - phone uses `tel:`
  - email uses `mailto:`.

### Verification snapshot (2026-03-27)

- Passing:
  - `pnpm --dir web exec eslint` for updated translation/footer/navigation files
  - `pnpm --dir web run i18n:guard`
- Runtime:
  - marketplace frontend responding on `http://localhost:3001`.

## 10. Update - 2026-03-28 (Current `new_improvements` State)

- Category cleanup is now enforced across all major user flows:
  - removed categories are hidden in categories, listings filters, and ad-placement selection.
- Taxonomy was updated:
  - `Transportation machinery` moved from Agro market to Auto market.
- User ads now publish directly:
  - new listings become `ACTIVE`
  - submit/resubmit actions now activate listings immediately.
- Inquiry flow is now admin-mediated:
  - listing contact actions route to Alcor admin
  - users cannot contact themselves on their own listings
  - first inquiry messages create admin notifications.
- Subscription / pro-account UX was removed from the frontend.
- Listing detail pages were cleaned up:
  - working Alcor-contact modal
  - light-mode compatible styling
  - improved top/bottom page spacing.
- Current local runtime:
  - main site `http://localhost:8000`
  - marketplace web `http://localhost:3001`
  - marketplace API `http://localhost:3000`
  - Docker-backed Postgres/Redis/MinIO/Mailpit running locally.
- Known follow-up:
  - OpenSearch still needs `OPENSEARCH_INITIAL_ADMIN_PASSWORD` set in compose to start without errors.
