# Changes 11.04

Date: 2026-04-11
Branch: `new_improvements`

---

## Changes Log

### 1. Ukrainian became the default language across the admin taxonomy and templates flow

Standardized locale-aware display labels so admin pages stop leaking raw English category names:
- removed persisted language restore so the UI now boots in `uk` by default
- fixed `Categories`, `Subcategories`, `Brands`, and `Form templates` to render category and marketplace labels through the Ukrainian display helpers
- fixed the template builder category selector to use localized category names
- corrected subcategory page data shaping so nested children render instead of showing an empty state.

Files:
- `web/src/components/providers/translation-provider.tsx`
- `web/src/app/admin/categories/page.tsx`
- `web/src/app/admin/subcategories/page.tsx`
- `web/src/app/admin/brands/page.tsx`
- `web/src/app/admin/templates/page.tsx`
- `web/src/app/admin/templates/builder/page.tsx`

### 2. Admin taxonomy pages were aligned to the same management structure

Completed the split taxonomy management UX so each screen supports direct admin CRUD/moderation with a consistent card layout:
- root categories page simplified to top-level category management only
- subcategories page now mirrors the categories page structure and supports create / edit / approve / reject / delete
- brand page kept separate with the same card alignment and action spacing conventions
- wrapped long titles/slugs correctly so icons and action buttons no longer drift out of place.

Files:
- `web/src/app/admin/layout.tsx`
- `web/src/app/admin/categories/page.tsx`
- `web/src/app/admin/subcategories/page.tsx`
- `web/src/app/admin/brands/page.tsx`
- `web/src/lib/api.ts`
- `web/src/lib/queries.ts`
- `web/src/types/api.ts`

### 3. Seller registration now persists real names for admin and later sign-in

Tightened the account creation path so seller identity is stored consistently:
- registration now requires first name and last name
- frontend trims submitted names before sending
- backend normalizes email and trims first/last name before user creation
- persisted user names now show up in admin user management and remain attached to the account for future login and ad posting.

Files:
- `web/src/components/auth/register-form.tsx`
- `api/src/auth/dto/register.dto.ts`
- `api/src/auth/auth.service.ts`
- `api/src/users/users.service.ts`

### 4. Autoline car brands were expanded from the workbook seed

Imported the workbook-driven car brand set and linked it to the car branch:
- added 66 car brands from `/Users/rohan/Desktop/car_brands_.xlsx`
- linked those brands to `cars` and its main passenger-car subcategories
- hardened brand/category linking with `upsert` so reseeding no longer fails on duplicates.

Files:
- `api/prisma/seed-all/core.ts`

### 5. Layout and spacing polish was applied across the website

Cleaned up repeated visual issues where content was colliding with the header or footer:
- added a shared footer gap in the app shell
- removed the black seam above the homepage footer by making the final landing section absorb that gap
- increased listing detail top spacing so moderation previews and public listing pages sit below the header stack correctly.

Files:
- `web/src/app/globals.css`
- `web/src/components/landing/contact-section.tsx`
- `web/src/components/listings/listing-detail.tsx`

---

## Verification

Verified during implementation:
- `api`: `pnpm exec tsc --noEmit` passed
- `web`: targeted ESLint passed for updated admin/template/auth/listing files
- local reseed completed successfully after the car-brand workbook import
- PostgreSQL verification confirmed the new car brands were linked to the car category branch.

Known unrelated issue:
- full `web` TypeScript check still has stale generated `.next` files referencing removed routes; app-source fixes made today were validated separately.
