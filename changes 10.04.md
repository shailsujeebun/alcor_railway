# Changes 10.04

Date: 2026-04-10
Branch: `new_improvements`

---

## Changes Log

### 1. User-submitted subcategories now require admin approval

Changed the “add new subcategory” flow from immediate public creation to moderated submission:
- new subcategory suggestions from the listing wizard now save as `PENDING`
- public category trees only return `APPROVED` categories/subcategories
- approved suggestions become visible to all users after admin approval
- rejected suggestions stay hidden from the public taxonomy

Files:
- `api/prisma/schema.prisma`
- `api/prisma/migrations/20260410190000_add_category_submission_moderation/migration.sql`
- `api/src/categories/categories.service.ts`
- `api/src/options/options.controller.ts`
- `api/src/options/options.service.ts`
- `web/src/components/listings/wizard/description-step.tsx`
- `web/src/lib/api.ts`
- `web/src/types/api.ts`

### 2. Admin moderation controls for subcategories

Extended admin category management so pending user-created subcategories can be reviewed:
- added admin endpoints to list categories with moderation metadata
- added approve and reject actions for pending subcategories
- kept delete access so admin can remove unwanted subcategories

Files:
- `api/src/admin/admin.controller.ts`
- `api/src/admin/admin.service.ts`

### 3. Admin taxonomy split into 3 separate pages

Separated the old mixed taxonomy management into clearer admin sections:
- `Categories` page for root/top-level categories only
- `Subcategories` page for subcategory creation, approval, rejection, edit, and delete
- `Brands` page for separate brand management
- updated admin sidebar navigation to show all three sections

Files:
- `web/src/app/admin/layout.tsx`
- `web/src/app/admin/categories/page.tsx`
- `web/src/app/admin/subcategories/page.tsx`
- `web/src/app/admin/brands/page.tsx`
- `web/src/lib/queries.ts`

### 4. Admin taxonomy UI translation coverage

Moved the new admin taxonomy copy into translations and added Ukrainian coverage:
- category/subcategory/brand admin pages now use translation keys
- Ukrainian is covered for the new admin sections and action labels

Files:
- `web/src/i18n/messages/en.ts`
- `web/src/i18n/messages/uk.ts`

---

## Verification

Verified during implementation:
- `api`: Prisma client regeneration succeeded
- `api`: local migration `20260410190000_add_category_submission_moderation` applied successfully
- `api`: `pnpm exec tsc --noEmit` passed
- `web`: targeted ESLint passed for updated admin/taxonomy files
- `api`: public `/categories` endpoint returned `200 OK` after enum mapping fix

Known unrelated issue:
- full `web` TypeScript check still has pre-existing `.next` and `useMySubscription` errors unrelated to today’s changes
