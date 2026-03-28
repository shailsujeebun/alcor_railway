# 08 March Update

Date: 2026-03-08  
Branch: `Railway_update`

This file records all changes completed today.

## 1. Logo Navigation to Main Landing

- Added a shared landing URL constant:
  - `web/src/lib/landing.ts`
  - `MAIN_LANDING_URL = process.env.NEXT_PUBLIC_MAIN_LANDING_URL || '/'`
- Updated logo click targets to use `MAIN_LANDING_URL`:
  - `web/src/components/layout/navbar.tsx`
  - `web/src/components/layout/footer.tsx`
  - `web/src/app/(auth)/layout.tsx`

## 2. Main Marketplace Hero Text Updates

Updated copy on the main hero section:

- Badge: `Marketplace of machinery and equipment.`
- Heading: `Find the necessary machinery and equipment for your business`
- Description:
  `Contact verified suppliers, compare industrial equipment and grow your business on our reliable marketplace.`

File:
- `web/src/components/landing/hero.tsx`

## 3. Marketplace Tabs Reduced to 3 + New Labels

Kept only 3 marketplace entries and removed legacy tab spillover behavior.

- Final tabs:
  - `Agro market`
  - `Auto market`
  - `Equipment`
- Enforced marketplace order to:
  - `agroline`, `autoline`, `machineryline`
- Updated display label mappings:
  - `agroline -> Agro market`
  - `autoline -> Auto market`
  - `machineryline -> Equipment`

Files:
- `web/src/components/categories/categories-page.tsx`
- `web/src/components/landing/categories-grid.tsx`
- `web/src/lib/display-labels.ts`

## 4. Company List Card Simplification

In company cards, removed:
- star rating
- reviews count
- time on platform

Kept only offers/ads count.

File:
- `web/src/components/cards/company-card.tsx`

## 5. Pricing Plans Removed from Website UI

- Removed pricing route page:
  - deleted `web/src/app/pricing/page.tsx`
- Removed footer links pointing to `/pricing` (replaced with plain text)
  - `web/src/components/layout/footer.tsx`
- Simplified cabinet subscription page by removing:
  - available plans grid
  - pricing upsell CTAs and `/pricing` links
  - plan comparison/upgrade card flow
  - `usePlans` dependency on this page
  - File: `web/src/app/cabinet/subscription/page.tsx`

## 6. Categories Cleanup + Repetition Removal

Removed specified categories from Categories page display (top-level and child lists):

- airport equipment
- campers
- air transport
- spare parts
- services
- tires and wheels
- water transport
- alternative energy sources
- equipment (including repeated/variant forms)
- mining equipment
- raw materials
- tools

Also added dedupe logic so repeated category names are not displayed multiple times.

File:
- `web/src/components/categories/categories-page.tsx`

## Documentation Refresh - 2026-03-28

Reviewed during the `new_improvements` branch documentation pass.
For the latest implementation state, see `REBUILD_CHANGELOG.md` and `docs/project_status.md`.
