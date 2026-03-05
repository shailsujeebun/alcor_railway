This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Update - 2026-02-24

- Category experience was shifted to a marketplace-first model:
  - homepage now shows 3 marketplace entry cards
  - categories page supports marketplace tabs with scoped discovery and search
  - deep-linking supported via `/categories?marketplace=<key>`.
- Ad-posting description step now includes marketplace tabs and category/subcategory cards with improved category icon mapping.
- Responsive layout fixes:
  - removed unwanted dark spacer above footer
  - improved footer responsiveness/positioning for reduced viewport widths.
- Build status:
  - `pnpm run build` passing.

## Project Update - 2026-03-05

- UI naming normalization shipped across marketplace/category views:
  - `autoline` -> `automarket`
  - `machineryline` -> `industrial machinery`
  - `agroline` -> `agromarket`
  - `industrial equipment` -> `equipment`
- Listing wizard required markers were tightened to important fields only:
  - marketplace/category/subcategory/title
  - dynamic essentials: brand/model/year(condition-specific year key)/condition
- Added contact guard in submit flow:
  - requires at least one method (`sellerEmail` or `sellerPhones`).
- Dynamic form updates:
  - strips stray label `*` suffixes so stars reflect real required state only
  - supports future years for expiration-like selectors (e.g. technical inspection valid till year)
  - dedupes repeated fields and repeated select options in render output.
- Runtime translation fallback now works both directions (`uk <-> en`) for non-keyed/late-rendered text and common attributes.

### Validation
- `pnpm run lint` passing
- `pnpm exec tsc --noEmit` passing
- `pnpm run i18n:guard` passing
