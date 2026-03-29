# Changes 29.03

Branch: `new_improvements`

## Marketplace navigation and landing-page routing

- Updated the marketplace landing fallback URL from `http://localhost:4174` to `http://localhost:8000`.
- Fixed the marketplace logo return target so clicking the Alcor logo sends users back to the main landing page setup instead of a dead local address.
- Updated footer service links to use the corrected landing base URL.

Files:
- `web/src/lib/landing.ts`
- `web/src/components/layout/footer.tsx`

## Light mode support

- Restored a visible theme toggle in the desktop navbar.
- Added the same theme toggle inside the mobile menu.
- Improved theme persistence so the saved theme is resolved on load and consistently applied through the `data-theme` attribute.

Files:
- `web/src/components/layout/navbar.tsx`
- `web/src/components/layout/mobile-menu.tsx`
- `web/src/components/providers/theme-provider.tsx`

## Footer seam cleanup

- Removed the extra bottom spacing from the main shell so the darker page background no longer creates a black strip above the footer.
- Removed the footer top border to make the transition from the contact section into the footer cleaner.

Files:
- `web/src/app/globals.css`
- `web/src/components/layout/footer.tsx`

## Verification

- `npm run lint -- src/components/layout/navbar.tsx src/components/layout/mobile-menu.tsx src/components/providers/theme-provider.tsx`
- `npm run lint -- src/components/layout/footer.tsx`
