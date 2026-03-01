# Marketplace Platform Guide (English)

Last updated: February 27, 2026

## 1. What this project is

This project is an online marketplace for business equipment.

In simple words, it helps:
- sellers publish equipment ads,
- buyers find equipment,
- both sides communicate safely,
- staff manage quality and support.

The product name used in the interface is **ALCOR**.

## 2. Who this platform is for

The platform serves 4 main groups:

1. Visitors (not signed in)
They can browse listings and companies, search by category, and view public details.

2. Registered users
They can save favorites, message sellers, create listings, track notifications, and contact support.

3. Professional sellers/dealers
They can manage many listings, use subscription plans, and receive dealer workflow support.

4. Admins/Managers
They supervise content, users, support tickets, categories, templates, and business operations.

## 3. What people can do without technical knowledge

### Public website
Anyone can:
- open the home page,
- browse listings,
- browse companies,
- explore categories by marketplace,
- read About, Pricing, Help, Terms, and Privacy pages.

### Account area ("Cabinet")
Signed-in users get a personal workspace with:
- My Listings,
- New Listing wizard,
- Favorites,
- View History,
- Messages,
- Saved Searches,
- Notifications,
- Support tickets,
- Subscription information,
- Profile settings.

### Admin area
Admins and managers can:
- view business stats,
- manage marketplaces,
- manage categories,
- manage form templates for listings,
- moderate listings,
- manage users,
- handle dealer leads,
- manage companies,
- review platform messages,
- process support tickets.

## 4. Main platform sections (plain-language map)

## Home
Shows featured content, categories, company highlights, trust sections, and contact points.

## Listings
Main marketplace of equipment ads with filtering and detailed product pages.

## Companies
Directory of participating companies with profiles and reviews.

## Categories
Structured category discovery by marketplace (for example, agro, auto/commercial, machinery).

## Ad Placement
Guided flow to create a listing. Users choose category first, then fill details in steps.

## Authentication
Includes registration, login, password reset, and email verification.

## Cabinet
Private dashboard where users manage activity, communication, and settings.

## Admin
Operational control center for content quality, structure, and support.

## 5. Core business workflows

### A. User registration and trust
1. User registers with email and password.
2. Platform sends a verification code.
3. User confirms email.
4. After verification, user can access full account features.

### B. Posting a listing
1. User opens Ad Placement.
2. User selects marketplace/category.
3. User fills dynamic form fields (the fields depend on category).
4. User uploads photos.
5. User submits listing.
6. Listing enters moderation, then becomes active when approved.

### C. Buyer journey
1. Buyer searches listings.
2. Buyer opens listing details.
3. Buyer saves favorite and/or messages seller.
4. Buyer can keep saved searches and receive notifications.

### D. Support and issue resolution
1. User opens a support ticket from Cabinet.
2. Admin/support team replies.
3. User tracks ticket updates in account.

### E. Dealer onboarding
1. Dealer submits registration lead.
2. Admin reviews and updates lead status.
3. Dealer can be converted into a working business account.

## 6. Safety and reliability (non-technical summary)

The platform includes:
- account access control by role (regular user vs admin/manager),
- secure sign-in/session handling,
- email verification,
- password reset flow,
- request rate limits (to reduce abuse),
- content moderation process before listing activation,
- support ticket tracking for accountability,
- centralized notifications.

## 7. Data and privacy (what stakeholders should know)

The system stores and manages:
- user accounts and profile basics,
- listings and listing media,
- company pages and reviews,
- messages between users,
- favorites, view history, and saved searches,
- subscriptions and plans,
- support tickets and replies,
- admin actions for operation control.

This data structure supports auditing, support, moderation, and reporting.

## 8. Supported languages and user experience

The interface supports Ukrainian and English.

Key points:
- Ukrainian is primary in many current pages.
- English translations are available through the app i18n system.
- The same product logic exists in both language modes.

## 9. Marketplace structure in plain words

The project uses multiple marketplace families (for example: agroline, autoline, machineryline), each with its own category tree.

Why this matters:
- Users can find products faster in the correct business domain.
- Sellers get category-specific forms.
- Admins can control forms and quality per category.

## 10. What makes this project business-ready

It already includes:
- catalog browsing,
- listing lifecycle management,
- account management,
- messaging,
- support workflows,
- subscription handling,
- admin operations,
- multilingual UI.

In practical terms, this is not just a website. It is a full operational marketplace system.

## 11. Quick glossary for non-technical teams

- Listing: one ad for one product/equipment unit.
- Category: classification bucket (for easier discovery).
- Marketplace: a major product domain (agro, transport, machinery, etc.).
- Cabinet: the user personal dashboard.
- Moderation: approval/rejection check before public visibility.
- Dealer lead: request from a business wanting to join as a dealer.
- Template: predefined form structure for listing details.
- Saved search: stored filter set so user can return quickly.

## 12. Recommended way to share this document internally

For non-technical teams (sales, operations, support):
1. Start with sections 1-5.
2. Use section 11 as shared vocabulary.
3. Use section 6-7 for policy/process discussions.
4. Use section 10 when presenting platform readiness to stakeholders.

## 13. Click-by-click handbook for non-technical users

This section explains exactly how to use the most important product functions.

### 13.1 Create account and sign in
1. Open `Sign in / Register` from the top menu.
2. Select `Register`.
3. Fill first name, last name, email, password.
4. Submit the form.
5. Check email for 6-digit verification code.
6. Return to `Verify email`, enter code, confirm.
7. You are now signed in and can use Cabinet features.

If code is missing:
1. Wait 1 minute.
2. Use `Resend code`.
3. Check spam folder.

### 13.2 Recover password
1. Open `Sign in`.
2. Click `Forgot password`.
3. Enter account email and submit.
4. Open the reset link/token from email.
5. Set new password and confirm.
6. Sign in with new password.

### 13.3 Post a new listing (standard user flow)
1. Click `Post listing` in the top menu.
2. Choose business path (private/pro) and continue.
3. Select marketplace and category.
4. Fill required product details.
5. Upload photos.
6. Add contact/seller details.
7. Submit listing for moderation.
8. Track status in `Cabinet` -> `My Listings`.

Listing status meanings:
- `Draft`: not sent yet.
- `Pending moderation`: waiting for admin check.
- `Active`: visible to all buyers.
- `Rejected`: needs corrections before resubmission.
- `Paused`: temporarily hidden by owner/admin.

### 13.4 Edit existing listing
1. Open `Cabinet` -> `My Listings`.
2. Choose listing and click `Edit`.
3. Update fields/photos.
4. Save changes.
5. If required, resubmit for moderation.

### 13.5 Search and filter listings (buyer flow)
1. Open `Listings`.
2. Set filters (category, price, location, etc.).
3. Open matching listing cards.
4. Use pagination to browse more results.
5. Save listing to favorites if relevant.

### 13.6 Save favorites and search history
1. On listing detail, click favorite icon.
2. Open `Cabinet` -> `Favorites` to review saved items.
3. Open `Cabinet` -> `History` to see recently viewed listings.

### 13.7 Message a seller
1. Open listing detail page.
2. Click `Contact seller`.
3. Send message in conversation window.
4. Continue chat in `Cabinet` -> `Messages`.

### 13.8 Create support ticket
1. Open `Cabinet` -> `Support`.
2. Click `New ticket`.
3. Choose topic and describe issue clearly.
4. Submit ticket.
5. Open ticket details to read replies and respond.

### 13.9 Use notifications
1. Click notification bell in top bar.
2. Open new notifications.
3. Mark items as read or use `Read all`.
4. Review full log in `Cabinet` -> `Notifications`.

### 13.10 Manage profile settings
1. Open `Cabinet` -> `Settings`.
2. Update name, phone, and profile details.
3. Save changes.
4. Reopen page to confirm updates are stored.

### 13.11 Dealer registration (business onboarding)
1. Open `Dealer registration` page.
2. Fill company and contact fields.
3. Submit request.
4. Wait for manager/admin contact and status update.

### 13.12 Admin/manager daily operations

Admin users should work in this order:
1. Open `Admin` dashboard and check KPIs.
2. Review `Moderation` queue and process pending listings.
3. Review `Tickets` and answer urgent support issues.
4. Review `Dealer leads` and update pipeline statuses.
5. Review `Users`, `Companies`, and `Messages` for policy/safety actions.

### 13.13 Simple troubleshooting (non-technical)

If page is not loading:
1. Refresh once.
2. Sign out and sign in again.
3. Try another browser tab/window.

If action fails (save, submit, upload):
1. Check all required fields are filled.
2. Reduce image size and retry upload.
3. Wait 30-60 seconds and retry.
4. Create support ticket with page name and exact error text.
