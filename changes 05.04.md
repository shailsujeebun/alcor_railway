# Changes 05.04

Date: 2026-04-05
Branch: `new_improvements`

---

## Changes Log

### 1. Consultation modal — match main landing page

Replaced the top-bar "Get a consultation" `mailto:` link with a proper modal form matching the Alcor Leasing main site design:
- Full-screen overlay with `backdrop-filter: blur(10px)` and dark scrim
- Rounded card (`border-radius: 24px`, 50px padding) with glassmorphism border
- Form fields: Ім'я, Email, Телефон, Повідомлення — identical layout/spacing/placeholders to the reference site
- Orange gradient submit button with hover lift + glow (`box-shadow` expand)
- X close button top-right, Escape key support, body scroll lock
- Thank-you state after submission
- Button text changed from English "Get a consultation" → Ukrainian "Отримати консультацію"
- Light-mode compatible via CSS variables (`--bg-card`, `--bg-primary`, `--border-color`, `--text-primary`)

Files:
- **New:** `web/src/components/layout/consultation-modal.tsx`
- **Updated:** `web/src/components/layout/top-bar.tsx`

### 2. Removed reviews from the marketplace

Removed all review/rating UI from company pages:
- Removed star rating and review count from company detail header
- Removed the "Відгуки" (Reviews) tab from company detail page
- Removed review list, review form, and review modal imports/usage
- Removed review-related FAQ entry from the help page
- Company cards were already clean (reviews removed in March 8 update)

Files:
- **Updated:** `web/src/components/companies/company-detail.tsx`
- **Updated:** `web/src/app/help/page.tsx`

### 3. Contact Alcor button now opens consultation form (no login required)

Replaced the listing "Contact Alcor" button behavior:
- Previously required login/registration to send a message through the internal messaging system
- Now opens the same consultation modal form as the top-bar button (Name, Email, Phone, Message)
- No account needed — anyone can submit an inquiry directly
- Applies to both the orange CTA button in the price panel and the secondary contact button in the seller panel

Files:
- **Updated:** `web/src/components/listings/contact-seller-button.tsx`

---

## Verification

_Verification results will be recorded here after changes are applied._
