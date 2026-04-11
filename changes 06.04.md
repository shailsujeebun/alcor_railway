# Changes 06.04

Date: 2026-04-06
Branch: `new_improvements`

---

## Changes Log

### 1. Runtime, database, and seed recovery

Restored the local development stack so marketplace data appears correctly again:
- Restarted backend and frontend dev servers
- Brought up Postgres, Redis, MinIO, and Mailpit
- Applied existing Prisma migrations and reran seed data
- Verified marketplace and listing endpoints return active data

### 2. Reviews removed from marketplace UI

Removed review-related UI where it was still visible:
- Removed seller rating/review display from listing detail page
- Removed seller review snapshot from listing detail
- Removed homepage testimonials/reviews section

### 3. Admin marketplaces cleanup and controls

Improved marketplace management in admin:
- Removed inactive legacy marketplaces from the local database view
- Added explicit `Edit` and `Delete` actions to admin marketplace cards
- Added backend marketplace delete endpoint
- Prevented deletion when categories or listings still exist
- Fixed marketplace action layout overflow so buttons stay inside cards

### 4. Listing form cleanup and field simplification

Cleaned up the posting flow and removed unnecessary fields:
- Removed duplicate category selector from dynamic listing details after category/subcategory was already chosen
- Removed `right_hand_drive` from templates and public listing detail rendering
- Removed `net_weight` from the website form
- Changed Agro market title behavior so most agro categories use a manual listing title, while tractor categories still auto-generate

### 5. Calendar/date picker upgrade

Reworked date input behavior in the dynamic form:
- Replaced split year/month inputs with a single date picker experience
- Added an in-app calendar popover
- Added direct month and year selectors for fast jumps
- Fixed clipping/overflow issues inside accordion sections
- Improved calendar spacing and popover styling to match the rest of the UI

### 6. Listing submission moderation workflow

Implemented admin approval before user listings go live:
- User submissions now go to `PENDING_MODERATION`
- Admin approval is required before a listing becomes public
- Admin rejection requires a rejection reason
- Rejected users receive a notification with the rejection reason
- Rejected listings can be edited and resubmitted
- Added admin/manager notifications when a listing is submitted for moderation
- Added moderation tracking fields in Prisma schema and migration

### 7. Listing posting reliability fixes

Fixed a broken user posting flow:
- Saved seller contact information before moderation submit
- Made backend contact update more tolerant of current phone/email payloads
- Resolved "Listing is incomplete" failures for otherwise valid drafts

### 8. Homepage translation fixes

Fixed the main-page language toggle so homepage content actually changes:
- Moved hero, top bar CTA, stats, marketplace subtitles, CTA banner, and contact section text onto translation keys
- Added missing `en`/`uk` translation entries for homepage strings
- Kept translation toggle behavior but removed the remaining hardcoded homepage text that blocked visible language switching

### 9. Homepage/footer visual cleanup

Improved the landing page lower section and footer boundary:
- Removed dark spacer bands caused by layout padding and duplicate divider styling
- Added/adjusted clear footer divider behavior
- Softened contact section form surfaces
- Fixed footer spacing and divider positioning

### 10. Catalog page layout and filter sidebar fixes

Fixed repeated layout issues on listing/company/category catalog pages:
- Added stronger bottom spacing before the footer on catalog pages
- Fixed sticky filter sidebar behavior so it no longer visually bleeds into the footer
- Added sidebar bottom gap and reduced sticky panel height
- Hid the visible sticky sidebar scroll track
- Applied the same sidebar/layout treatment to listings and companies
- Fixed a real `useMemo` dependency bug in categories page (`locale` was missing from dependencies)

### 11. Filter UX improvements

Improved catalog filter interactions:
- `SearchableSelect` now deselects the current value when the selected option is clicked again
- Selects now close immediately before heavier updates run
- Wrapped route updates in `startTransition` for smoother filter interaction on listings and companies pages

### 12. Other UX/content cleanup

Additional improvements completed during the session:
- Removed homepage reviews/testimonials section entirely
- Fixed top black line/band issue on the homepage
- Increased footer breathing room under divider/content areas

---

## Key Files Updated

- `api/prisma/schema.prisma`
- `api/prisma/migrations/20260406130000_add_listing_moderation_fields/migration.sql`
- `api/src/admin/admin.controller.ts`
- `api/src/admin/admin.service.ts`
- `api/src/listings/listings.service.ts`
- `api/src/templates/template-schema.ts`
- `web/src/app/page.tsx`
- `web/src/app/globals.css`
- `web/src/components/layout/top-bar.tsx`
- `web/src/components/layout/footer.tsx`
- `web/src/components/providers/translation-provider.tsx`
- `web/src/components/landing/hero.tsx`
- `web/src/components/landing/contact-section.tsx`
- `web/src/components/landing/categories-grid.tsx`
- `web/src/components/landing/cta-banner.tsx`
- `web/src/components/landing/stats-counter.tsx`
- `web/src/components/listings/listing-detail.tsx`
- `web/src/components/listings/dynamic-form.tsx`
- `web/src/components/listings/wizard/description-step.tsx`
- `web/src/components/listings/wizard/contact-step.tsx`
- `web/src/components/listings/listings-content.tsx`
- `web/src/components/companies/companies-content.tsx`
- `web/src/components/categories/categories-page.tsx`
- `web/src/components/ui/searchable-select.tsx`
- `web/src/components/admin/moderation-queue.tsx`
- `web/src/components/cabinet/my-listings.tsx`
- `web/src/lib/api.ts`
- `web/src/i18n/messages/en.ts`
- `web/src/i18n/messages/uk.ts`

---

## Verification

Verified during implementation:
- Frontend `eslint` passed on changed TSX files after each targeted fix
- Backend TypeScript compile passed for moderation/contact-related changes
- Prisma migration and client generation succeeded for moderation fields
- Backend endpoints responded correctly after restart/seed recovery
