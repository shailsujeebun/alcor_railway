# Marketplace Clone - Project Documentation

## Project Overview

A B2B equipment marketplace platform (АЛЬКОР) with a NestJS backend API and Next.js frontend. The frontend design is based on the Alcor Leasing landing page aesthetic (dark glassmorphism, blue+orange gradients, card hover effects, AOS scroll animations). The UI language is **Ukrainian** throughout.

## Tech Stack

### Backend (`/api`)
- **Framework**: NestJS 11
- **Database**: PostgreSQL 16 with Prisma 7 ORM
- **Auth**: JWT (access + refresh tokens), bcrypt password hashing
- **Caching**: Redis
- **Search**: OpenSearch
- **File Storage**: MinIO (S3-compatible object storage)
- **Rate Limiting**: @nestjs/throttler (100 req/60s)
- **Language**: TypeScript

### Frontend (`/web`)
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (using `@import "tailwindcss"` + `@theme inline`)
- **State Management**: TanStack React Query v5 (server state), Zustand (auth state)
- **Animations**: AOS (Animate On Scroll)
- **Icons**: Lucide React
- **Language**: TypeScript, React 19

## Running the Project

```bash
# Start infrastructure (PostgreSQL, Redis, OpenSearch, MinIO)
docker compose up -d

# Run database migrations
docker compose up -d

# Generate Prisma client
cd api && npx prisma generate

# Seed the database (default deterministic dataset)
cd api && npx prisma db seed

# Optional integrity verification after seeding
cd api && pnpm seed:verify

# Start backend (runs on port 3000)
cd api && pnpm start:dev

# Start frontend (runs on port 3001)
cd web && pnpm dev
```

> **Note:** Use `docker compose` (without hyphen). The old `docker-compose` command may not be installed.

## Project Structure

```
marketplace-clone/
├── api/                              # NestJS Backend
│   ├── src/
│   │   ├── common/                   # Shared utilities
│   │   │   ├── dto/
│   │   │   │   ├── pagination-query.dto.ts
│   │   │   │   └── paginated-response.dto.ts
│   │   │   └── index.ts
│   │   ├── config/                   # App configuration
│   │   │   └── configuration.ts
│   │   ├── prisma/                   # Prisma ORM integration
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── redis/                    # Redis caching
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts
│   │   ├── auth/                     # Authentication (JWT, OAuth, password reset)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       ├── refresh-token.dto.ts
│   │   │       ├── forgot-password.dto.ts
│   │   │       └── reset-password.dto.ts
│   │   ├── users/                    # User management
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   └── dto/
│   │   │       ├── update-profile.dto.ts
│   │   │       ├── update-user.dto.ts
│   │   │       └── user-query.dto.ts
│   │   ├── listings/                 # Equipment listings (CRUD + moderation)
│   │   │   ├── listings.controller.ts
│   │   │   ├── listings.service.ts
│   │   │   ├── listings.module.ts
│   │   │   └── dto/
│   │   │       ├── create-listing.dto.ts
│   │   │       ├── update-listing.dto.ts
│   │   │       ├── listing-query.dto.ts
│   │   │       └── moderate-listing.dto.ts
│   │   ├── companies/                # Company profiles (CRUD + reviews)
│   │   │   ├── companies.controller.ts
│   │   │   ├── companies.service.ts
│   │   │   ├── companies.module.ts
│   │   │   └── dto/
│   │   │       ├── create-company.dto.ts
│   │   │       ├── update-company.dto.ts
│   │   │       ├── company-query.dto.ts
│   │   │       └── create-company-review.dto.ts
│   │   ├── categories/               # Categories (hierarchical)
│   │   ├── brands/                   # Brands
│   │   ├── countries/                # Countries
│   │   ├── cities/                   # Cities (filterable by country)
│   │   ├── activity-types/           # Activity types
│   │   ├── admin/                    # Admin dashboard (stats)
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── admin.module.ts
│   │   ├── dealer-leads/             # Dealer registration pipeline
│   │   │   ├── dealer-leads.controller.ts
│   │   │   ├── dealer-leads.service.ts
│   │   │   ├── dealer-leads.module.ts
│   │   │   └── dto/
│   │   │       ├── create-dealer-lead.dto.ts
│   │   │       ├── update-dealer-lead.dto.ts
│   │   │       └── dealer-lead-query.dto.ts
│   │   ├── favorites/                # Favorites & view history
│   │   │   ├── favorites.controller.ts
│   │   │   ├── favorites.service.ts
│   │   │   └── favorites.module.ts
│   │   ├── messages/                 # P2P messaging
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.service.ts
│   │   │   ├── messages.module.ts
│   │   │   └── dto/
│   │   │       └── create-message.dto.ts
│   │   ├── support/                  # Support ticket system
│   │   │   ├── support.controller.ts
│   │   │   ├── support.service.ts
│   │   │   ├── support.module.ts
│   │   │   └── dto/
│   │   │       └── support.dto.ts
│   │   ├── upload/                   # File upload (MinIO)
│   │   │   ├── upload.controller.ts
│   │   │   ├── upload.service.ts
│   │   │   └── upload.module.ts
│   │   ├── plans/                    # Subscription plans
│   │   │   ├── plans.controller.ts
│   │   │   ├── plans.service.ts
│   │   │   ├── plans.module.ts
│   │   │   └── dto/
│   │   │       └── plan.dto.ts
│   │   └── subscriptions/            # User subscriptions
│   │       ├── subscriptions.controller.ts
│   │       ├── subscriptions.service.ts
│   │       ├── subscriptions.module.ts
│   │       └── dto/
│   │           └── subscription.dto.ts
│   └── prisma/
│       └── schema.prisma             # Database schema (31 models, 14 enums)
│
├── web/                              # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css           # Tailwind config + design tokens
│   │   │   ├── layout.tsx            # Root layout with providers
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── (auth)/               # Auth route group
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── listings/
│   │   │   │   ├── page.tsx          # Listings browse
│   │   │   │   └── [id]/page.tsx     # Listing detail
│   │   │   ├── companies/
│   │   │   │   ├── page.tsx          # Companies browse
│   │   │   │   └── [slug]/page.tsx   # Company detail
│   │   │   ├── categories/page.tsx   # Categories page
│   │   │   ├── dealer-registration/page.tsx
│   │   │   ├── pricing/page.tsx      # Plans & pricing
│   │   │   ├── about/page.tsx        # About page
│   │   │   ├── terms/page.tsx        # Terms of service
│   │   │   ├── privacy/page.tsx      # Privacy policy
│   │   │   ├── help/page.tsx         # Help / FAQ
│   │   │   ├── cabinet/              # User cabinet (authenticated)
│   │   │   │   ├── layout.tsx        # Sidebar layout
│   │   │   │   ├── page.tsx          # Overview
│   │   │   │   ├── listings/
│   │   │   │   │   ├── page.tsx      # My listings
│   │   │   │   │   ├── new/page.tsx  # Listing wizard
│   │   │   │   │   └── [id]/edit/page.tsx
│   │   │   │   ├── favorites/page.tsx
│   │   │   │   ├── history/page.tsx
│   │   │   │   ├── messages/
│   │   │   │   │   ├── page.tsx      # Conversations list
│   │   │   │   │   └── [id]/page.tsx # Conversation detail
│   │   │   │   ├── support/
│   │   │   │   │   ├── page.tsx      # My tickets
│   │   │   │   │   ├── new/page.tsx  # Create ticket
│   │   │   │   │   └── [id]/page.tsx # Ticket detail
│   │   │   │   ├── subscription/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   └── admin/                # Admin panel (ADMIN/MANAGER only)
│   │   │       ├── layout.tsx        # Sidebar layout with role guard
│   │   │       ├── page.tsx          # Dashboard / stats
│   │   │       ├── users/page.tsx    # User management
│   │   │       ├── moderation/page.tsx
│   │   │       ├── tickets/page.tsx
│   │   │       └── dealer-leads/page.tsx
│   │   ├── components/
│   │   │   ├── providers/            # React context providers
│   │   │   │   ├── theme-provider.tsx
│   │   │   │   ├── query-provider.tsx
│   │   │   │   ├── aos-provider.tsx
│   │   │   │   └── auth-provider.tsx
│   │   │   ├── layout/               # Layout components
│   │   │   │   ├── top-bar.tsx
│   │   │   │   ├── navbar.tsx        # Dynamic nav with admin link for ADMIN/MANAGER
│   │   │   │   ├── mobile-menu.tsx
│   │   │   │   └── footer.tsx        # Links to /about, /companies, /help, /terms, /privacy
│   │   │   ├── ui/                   # Reusable UI components
│   │   │   │   ├── particles.tsx
│   │   │   │   ├── animated-counter.tsx
│   │   │   │   ├── glass-card.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── star-rating.tsx
│   │   │   │   ├── price-display.tsx
│   │   │   │   ├── pagination.tsx
│   │   │   │   ├── search-input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── modal.tsx
│   │   │   │   └── skeleton.tsx
│   │   │   ├── landing/              # Landing page sections
│   │   │   │   ├── hero.tsx
│   │   │   │   ├── stats-counter.tsx
│   │   │   │   ├── featured-listings.tsx
│   │   │   │   ├── categories-grid.tsx
│   │   │   │   ├── company-highlights.tsx
│   │   │   │   ├── how-it-works.tsx
│   │   │   │   ├── testimonials.tsx
│   │   │   │   ├── cta-banner.tsx
│   │   │   │   └── contact-section.tsx
│   │   │   ├── cards/                # Shared card components
│   │   │   │   ├── listing-card.tsx
│   │   │   │   └── company-card.tsx
│   │   │   ├── auth/                 # Auth form components
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── register-form.tsx
│   │   │   │   ├── forgot-password-form.tsx
│   │   │   │   └── reset-password-form.tsx
│   │   │   ├── listings/             # Listings page components
│   │   │   │   ├── listings-content.tsx
│   │   │   │   ├── listings-filters.tsx
│   │   │   │   ├── listings-grid.tsx
│   │   │   │   ├── listing-detail.tsx
│   │   │   │   ├── listing-wizard.tsx
│   │   │   │   ├── photo-upload.tsx
│   │   │   │   ├── contact-seller-button.tsx
│   │   │   │   └── favorite-button.tsx
│   │   │   ├── companies/            # Companies page components
│   │   │   │   ├── companies-content.tsx
│   │   │   │   ├── companies-filters.tsx
│   │   │   │   ├── companies-grid.tsx
│   │   │   │   ├── company-detail.tsx
│   │   │   │   ├── review-list.tsx
│   │   │   │   └── review-form.tsx
│   │   │   ├── categories/
│   │   │   │   └── categories-page.tsx
│   │   │   ├── dealer/               # Dealer registration
│   │   │   │   └── dealer-registration-form.tsx
│   │   │   ├── cabinet/              # User cabinet components
│   │   │   │   ├── cabinet-overview.tsx
│   │   │   │   ├── my-listings.tsx
│   │   │   │   ├── favorites-list.tsx
│   │   │   │   ├── view-history-list.tsx
│   │   │   │   ├── conversations-list.tsx
│   │   │   │   ├── conversation-detail.tsx
│   │   │   │   ├── profile-settings.tsx
│   │   │   │   ├── support-tickets.tsx
│   │   │   │   ├── ticket-detail.tsx
│   │   │   │   └── create-ticket-form.tsx
│   │   │   └── admin/                # Admin panel components
│   │   │       ├── moderation-queue.tsx
│   │   │       └── dealer-leads-pipeline.tsx
│   │   ├── stores/
│   │   │   └── auth-store.ts         # Zustand auth state (user, tokens, login/logout)
│   │   ├── lib/
│   │   │   ├── api.ts                # API fetch functions (fetchApi with Bearer token)
│   │   │   ├── auth-api.ts           # Auth-specific API calls
│   │   │   ├── queries.ts            # React Query hooks (44 hooks)
│   │   │   └── utils.ts              # Utility functions (cn, formatPrice, formatDate)
│   │   └── types/
│   │       └── api.ts                # TypeScript interfaces (24 interfaces + 12 type unions)
│   └── .env.local
│
└── docker-compose.yml                # PostgreSQL, Redis, OpenSearch, MinIO
```

## Design System

### Colors (CSS Variables in globals.css)

The app supports **dark mode** (default) and **light mode** via `[data-theme="light"]` CSS attribute.

```css
/* Dark theme (default) — :root */
--bg-primary: #050b14;
--bg-secondary: #0a1628;
--bg-card: rgba(10, 22, 40, 0.6);
--text-primary: #ffffff;
--text-secondary: #94a3b8;
--border-color: rgba(59, 130, 246, 0.15);
--input-bg: #050b14;
--hero-from: #050b14;
--hero-via: #0a1628;
--hero-to: rgba(30, 64, 175, 0.2);
--status-green: #4ade80;
--status-red: #f87171;
--status-yellow: #fbbf24;
--skeleton-bg: rgba(59, 130, 246, 0.05);
--card-shadow: 0 20px 60px rgba(59, 130, 246, 0.1);
--scrollbar-thumb: #1e40af;

/* Light theme — [data-theme="light"] */
--bg-primary: #f1f5f9;
--bg-secondary: #ffffff;
--bg-card: rgba(255, 255, 255, 0.85);
--text-primary: #0f172a;
--text-secondary: #475569;
--border-color: rgba(148, 163, 184, 0.35);
--input-bg: #ffffff;
--hero-from: #dbeafe;
--hero-via: #eff6ff;
--hero-to: #f1f5f9;
--status-green: #16a34a;
--status-red: #dc2626;
--status-yellow: #d97706;
--skeleton-bg: rgba(148, 163, 184, 0.15);
--card-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
--scrollbar-thumb: #94a3b8;

/* Accent colors (same in both themes) */
--blue-bright: #3b82f6;
--blue-light: #60a5fa;
--orange: #f97316;

/* Additional tokens */
--color-blue-darker: #050b14;
--color-blue-accent: #1e40af;
--color-orange-dark: #ea580c;
--color-gray-muted: #94a3b8;
--color-gray-dim: #64748b;
--color-gray-soft: #f8fafc;
```

### Key CSS Classes

- `.glass-card` - Glassmorphism card with backdrop blur and border
- `.card-hover` - 3D transform effect on hover
- `.gradient-text` - Blue to cyan text gradient
- `.gradient-cta` - Blue to purple button gradient
- `.container-main` - Max-width 1280px centered container

### Form Input Styling

Standard input class used across all forms:
```
w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-blue-bright outline-none transition-colors
```

### Custom Animations (keyframes in globals.css)

- `float` - Floating animation
- `fade-up` - Fade up on entry
- `gradient-shift` - Gradient color shifting

### Fonts

- **Inter** - Body text (sans-serif)
- **Manrope** - Headings (font-heading)

## API Endpoints

### Auth (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns access + refresh tokens)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (requires JWT)
- `POST /auth/forgot-password` - Request password reset email
- `POST /auth/reset-password` - Reset password with token
- `GET /auth/me` - Get current user (requires JWT)

### Listings (`/listings`)
- `POST /listings` - Create listing (requires JWT)
- `GET /listings` - Browse all listings with filters and sorting
  - Query params: `page`, `limit`, `marketplaceId`, `categoryId`, `brandId`, `companyId`, `countryId`, `cityId`, `condition`, `listingType`, `euroClass`, `priceCurrency`, `priceMin`, `priceMax`, `yearMin`, `yearMax`, `search`, `sort`, `status`
  - Sort options: `publishedAt` (default), `priceAsc`, `priceDesc`, `yearDesc`, `yearAsc`
- `GET /listings/:id` - Get single listing with all relations
- `PATCH /listings/:id` - Update listing (requires JWT)
- `GET /companies/:companyId/listings` - Get listings for a company

#### Listing Status Actions (require JWT)
- `POST /listings/:id/submit` - Submit for moderation
- `POST /listings/:id/pause` - Pause active listing
- `POST /listings/:id/resume` - Resume paused listing
- `POST /listings/:id/resubmit` - Resubmit rejected listing

#### Listing Moderation (require ADMIN/MANAGER role)
- `POST /listings/:id/approve` - Approve listing
- `POST /listings/:id/reject` - Reject listing (body: `{ moderationReason }`)

### Companies (`/companies`)
- `POST /companies` - Create company
- `GET /companies` - Browse companies with filters
  - Query params: `page`, `limit`, `countryId`, `cityId`, `isOfficialDealer`, `isManufacturer`, `isVerified`, `search`, `activityTypeId`, `brandId`
- `GET /companies/:slug` - Get company by slug
- `PATCH /companies/:id` - Update company

### Company Reviews
- `GET /companies/:companyId/reviews` - Get paginated reviews
- `POST /companies/:companyId/reviews` - Create review (recalculates denormalized `ratingAvg`)
  - Body: `{ authorName, rating, title?, body? }`

### Users (`/users`)
- `GET /users/me` - Get current profile (requires JWT)
- `PATCH /users/me` - Update profile (requires JWT)
- `GET /users` - List all users with filters (requires ADMIN/MANAGER)
  - Query params: `page`, `limit`, `search`, `role`, `status`
- `PATCH /users/:id` - Update user role/status (requires ADMIN/MANAGER)

### Admin (`/admin`)
- `GET /admin/stats` - Dashboard stats: usersCount, listingsCount, companiesCount, activeTicketsCount (requires ADMIN/MANAGER)

### Favorites & View History
- `POST /favorites/:listingId` - Add to favorites (requires JWT)
- `DELETE /favorites/:listingId` - Remove from favorites (requires JWT)
- `GET /favorites` - Get user's favorites (requires JWT)
- `GET /favorites/check/:listingId` - Check if listing is favorited (requires JWT)
- `POST /view-history/:listingId` - Record listing view (requires JWT)
- `GET /view-history` - Get view history (requires JWT)

### Messages (`/messages`)
- `POST /messages/conversations` - Start conversation (requires JWT)
  - Body: `{ listingId, sellerId, body }`
- `GET /messages/conversations` - List conversations (requires JWT)
- `GET /messages/conversations/:id` - Get conversation with messages (requires JWT)
- `POST /messages/conversations/:id` - Send message (requires JWT)
  - Body: `{ body }`
- `GET /messages/unread-count` - Get unread message count (requires JWT)

### Support Tickets (`/support`)
- `POST /support/tickets` - Create ticket (requires JWT)
  - Body: `{ subject, body, priority? }`
- `GET /support/tickets` - Get user's tickets (requires JWT)
- `GET /support/tickets/all` - Get all tickets (requires ADMIN/MANAGER)
- `GET /support/tickets/:id` - Get ticket detail (requires JWT)
- `POST /support/tickets/:id/reply` - Reply to ticket (requires JWT)
  - Body: `{ body }`
- `PATCH /support/tickets/:id` - Update ticket status/assignment (requires ADMIN/MANAGER)

### Upload (`/upload`)
- `POST /upload/images` - Upload images to MinIO (requires JWT)
  - Max 10 files, 10MB each
  - Allowed MIME: image/jpeg, image/png, image/webp, image/gif
  - Returns `{ urls: string[] }`

### Dealer Leads (`/dealer-leads`)
- `POST /dealer-leads` - Submit dealer application (public)
- `GET /dealer-leads` - List leads (requires ADMIN/MANAGER)
- `GET /dealer-leads/:id` - Get lead detail (requires ADMIN/MANAGER)
- `PATCH /dealer-leads/:id` - Update lead status/notes (requires ADMIN/MANAGER)

### Plans (`/plans`)
- `GET /plans` - List active plans (public)
- `GET /plans/:slug` - Get plan by slug (public)
- `POST /plans` - Create plan (requires ADMIN)
- `PATCH /plans/:id` - Update plan (requires ADMIN)
- `DELETE /plans/:id` - Soft-delete plan (requires ADMIN)

### Subscriptions (`/subscriptions`)
- `GET /subscriptions/me` - Get user's active subscription (requires JWT)
- `POST /subscriptions` - Create subscription (requires ADMIN)

### Reference Data
- `GET /marketplaces` - All active marketplaces
- `GET /categories` - All categories (hierarchical with parent/children)
  - Optional query: `marketplaceId` to scope the category tree
- `POST /categories` - Create category
- `GET /brands` - All brands
- `POST /brands` - Create brand
- `GET /countries` - All countries
- `POST /countries` - Create country
- `GET /cities` - All cities (supports `countryId` filter)
- `POST /cities` - Create city
- `GET /activity-types` - All activity types
- `POST /activity-types` - Create activity type

## Database Schema

### Enums (14)

**Auth**: `UserRole` (USER, PRO_SELLER, MANAGER, ADMIN), `UserStatus` (ACTIVE, RESTRICTED, BLOCKED), `CompanyUserRole` (OWNER, ADMIN, EDITOR)

**Listing**: `ListingCondition` (NEW, USED, DEMO), `ListingType` (SALE, RENT, FROM_MANUFACTURER), `ListingStatus` (DRAFT, SUBMITTED, PENDING_MODERATION, ACTIVE, PAUSED, EXPIRED, REJECTED, REMOVED), `PriceType` (FIXED, NEGOTIABLE, ON_REQUEST)

**Company**: `MediaKind` (LOGO, COVER, GALLERY)

**Business**: `DealerLeadStatus` (NEW, CONTACTED, QUALIFIED, PACKAGE_SELECTED, CONVERTED, REJECTED), `TicketStatus` (OPEN, IN_PROGRESS, RESOLVED, CLOSED), `TicketPriority` (LOW, MEDIUM, HIGH)

**Billing**: `PlanInterval` (MONTHLY, QUARTERLY, YEARLY), `SubscriptionStatus` (ACTIVE, PAUSED, CANCELLED, EXPIRED)

### Models (31)

**Auth & Users**: User, OAuthAccount, Session, PasswordResetToken, CompanyUser

**Reference Data**: Country, City, ActivityType, Brand, Category (hierarchical with parent/children)

**Company**: Company, CompanyPhone, CompanyMedia, CompanyActivityType (junction), CompanyBrand (junction), CompanyReview

**Listing**: Listing, ListingMedia (with sortOrder), ListingAttribute (key-value pairs)

**Messaging**: Conversation, Message, SupportTicket, TicketMessage

**User Features**: Favorite, ViewHistory

**Business**: DealerLead, Plan, Subscription

### Key Model Details

**User** - Platform user
- Core: email (unique), passwordHash, firstName, lastName, phone
- Auth: role (UserRole), status (UserStatus), emailVerified
- Profile: avatarUrl, locale
- Relations: sessions[], favorites[], viewHistory[], conversations[], tickets[], subscriptions[]

**Listing** - Equipment listing
- Core: title, slug, condition, listingType, year, price, priceCurrency, priceType
- Status: status (ListingStatus), moderationReason, submittedAt, moderatedAt, expiresAt
- Equipment: hoursValue, hoursUnit (default "м/г"), euroClass
- Owner: ownerUserId, companyId
- Relations: company, category, brand, country, city, media[], attributes[]

**Company** - Company profile
- Core: name, slug, description, contactPerson
- Location: countryId, cityId, region, addressLine
- Status flags: isVerified, isOfficialDealer, isManufacturer
- Denormalized counters: ratingAvg, reviewsCount, listingsCount, photosCount
- Extra: timezone, utcOffsetMin, workingHours, languages, yearsOnPlatform, yearsOnMarket, ratingSource
- Relations: phones[], media[] (with kind), activityTypes[], brands[], reviews[]

**Plan** - Subscription plan
- Core: name, slug (unique), description, priceAmount (Decimal 10,2), priceCurrency, interval
- Config: features (Json), limits (Json), isActive, sortOrder
- Relations: subscriptions[]

**Subscription** - User subscription
- Core: userId, planId, status, startDate, endDate
- Relations: user, plan
- Indexes on userId, planId

## Key Implementation Details

### Backend Architecture

1. **Auth Module** (`api/src/auth/`)
   - JWT with access token (short-lived) + refresh token (long-lived)
   - Passwords hashed with bcrypt
   - Sessions stored in Prisma (Session model)
   - `JwtAuthGuard` - validates JWT, attaches user to request
   - `RolesGuard` + `@Roles()` decorator - role-based access control
   - `@CurrentUser()` decorator - extracts user from request

2. **Listings CRUD + Moderation** (`api/src/listings/`)
   - Status machine: DRAFT → SUBMITTED → PENDING_MODERATION → ACTIVE
   - Additional transitions: ACTIVE ↔ PAUSED, REJECTED → resubmit → SUBMITTED, ACTIVE → EXPIRED/REMOVED
   - `ListingsService.create()`: Creates listing with media/attributes, increments `company.listingsCount`
   - `ListingsService.update()`: Transaction-based update for media and attributes
   - `ListingsService.findAll()`: Dynamic Prisma `where` clause, supports all filter + sort combinations

3. **Companies CRUD** (`api/src/companies/`)
   - `CompaniesService.createReview()`: Creates review and recalculates denormalized `ratingAvg`
   - `CompaniesService.update()`: Transaction support for phones, activities, brands

4. **Upload Module** (`api/src/upload/`)
   - MinIO S3-compatible storage
   - `FilesInterceptor('files', 10)` - max 10 files per request
   - 10MB file size limit, validates MIME types
   - Returns array of public URLs

5. **Admin Module** (`api/src/admin/`)
   - Stats aggregation with `Promise.all` for concurrent counts
   - Controller-level guards: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN', 'MANAGER')`

6. **Plans & Subscriptions** (`api/src/plans/`, `api/src/subscriptions/`)
   - Soft delete for plans (sets `isActive=false`)
   - Plan features/limits stored as JSON for flexibility
   - Active subscription lookup: status=ACTIVE and endDate > now

7. **Support Tickets** (`api/src/support/`)
   - Ticket creation with priority (LOW, MEDIUM, HIGH)
   - Reply system with `isStaff` flag on messages
   - Admin can update status, priority, assignment

8. **Common Patterns**
   - `PaginatedResponseDto(data, total, page, limit)` — positional constructor args
   - `PaginationQueryDto` has `skip` getter for Prisma offset
   - All admin endpoints use `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN', 'MANAGER')`
   - Route ordering: place `/me` endpoints BEFORE `/:id` in controllers to avoid conflicts

### Frontend Patterns

1. **Auth state** - Zustand store (`auth-store.ts`) holds user, accessToken, refreshToken, login/logout actions
2. **API layer** - `fetchApi<T>()` in `api.ts` auto-attaches Bearer token from Zustand store
3. **Auth provider** - Wraps app, attempts token refresh on mount
4. **URL-driven filter state** - Filters sync with URL search params for shareable links
5. **Debounced search** - 300ms delay on search input to reduce API calls
6. **React Query caching** - 60s staleTime default, 5min for reference data
7. **Responsive design** - Mobile filter drawer, hamburger menu, single-column layouts
8. **AOS animations** - Scroll-triggered fade-up animations on cards and sections
9. **Ukrainian localization** - All UI labels, navigation, and filter options in Ukrainian
10. **STATUS_BADGE pattern** - `Record<Status, { label, className }>` for consistent status display
11. **Cabinet layout** - Sidebar navigation + mobile horizontal tabs, auth guard in layout.tsx
12. **Admin layout** - Same pattern as cabinet, with ADMIN/MANAGER role guard
13. **Listing wizard** - Multi-step form with photo upload (drag & drop + MinIO integration). Category selection uses a marketplace-scoped tree and requires leaf categories.
14. **Tailwind dynamic classes** - Use explicit class strings, NOT template literals like `bg-${color}-500/20`
15. **Light/dark theme** - All theme-dependent colors use CSS variables (not hardcoded Tailwind classes). Theme toggled via `data-theme="light"` attribute on root element. Light mode overrides defined in `globals.css` under `[data-theme="light"]`
16. **Hero gradient** - Uses inline `style={{ background: 'linear-gradient(...)' }}` with CSS variables (`--hero-from`, `--hero-via`, `--hero-to`) instead of Tailwind gradient classes, to support theme switching
17. **SSR hydration safety** - Never use `Math.random()` in components rendered on server. Use client-only rendering pattern (`mounted` state + `useEffect`) or seeded PRNG for deterministic output
18. **Global footer spacing** - Applied on `<main>` in `layout.tsx` (`pb-24 md:pb-32`). Do NOT add per-page bottom padding — the global wrapper handles it
19. **Seed entrypoint** - Default Prisma seed is `api/prisma/seed-all.ts` (modular data under `api/prisma/seed-all/*`; legacy `api/prisma/seed.ts` still exists). After changing seed data, run `npx prisma db seed` from `api/` and then `pnpm seed:verify`

### Listing Filters (Frontend)

The listings page supports these filters (in `listings-filters.tsx`):
- **Marketplace** - Marketplace selector (scopes available categories)
- **Search** - Text search with debounce
- **Sort** - За замовчуванням, Ціна (зростання/спадання), Рік (спадання/зростання)
- **Category** - From categories API
- **Brand** - From brands API
- **Listing Type** - Продаж, Оренда, Від виробника (SALE, RENT, FROM_MANUFACTURER)
- **Condition** - Нове, Вживане, Демо (NEW, USED, DEMO)
- **Price Range** - Min/Max inputs
- **Currency** - EUR, USD, UAH
- **Year Range** - Min/Max inputs
- **Euro Class** - Euro 3, 4, 5, 6
- **Country** - From countries API
- **City** - From cities API (filtered by selected country)

### Company Filters (Frontend)

The companies page supports these filters (in `companies-filters.tsx`):
- Search, Activity Type, Brand, Country, City
- Checkboxes: Official Dealer, Manufacturer, Verified

### TypeScript Interfaces (`web/src/types/api.ts`)

**Type Unions (12):** ListingCondition, PriceType, ListingType, MediaKind, ListingStatus, DealerLeadStatus, UserRole, UserStatus, TicketStatus, TicketPriority, PlanInterval, SubscriptionStatusType

**Core Interfaces:** Country, City, Brand, ActivityType, Category, CompanyPhone, CompanyMedia, Company, CompanyReview, ListingMedia, ListingAttribute, Listing, User, AuthResponse

**Feature Interfaces:** DealerLead, Favorite, ViewHistoryItem, UserBrief, Conversation, ChatMessage, SupportTicket, TicketMessage, Plan, Subscription

**Payload Types:** CreateReviewPayload, CreateDealerLeadPayload, UpdateDealerLeadPayload, CreateListingPayload, UpdateListingPayload, UpdateProfilePayload, CreateConversationPayload, SendMessagePayload, CreateTicketPayload, ReplyTicketPayload, UpdateTicketPayload

**Pagination:** `PaginatedResponse<T>` with `{ data: T[], meta: { total, page, limit, totalPages } }`

### React Query Hooks (`web/src/lib/queries.ts`)

**Query Hooks (26):**
- `useListings(params)`, `useListingDetail(id)` - Listings
- `useCompanies(params)`, `useCompanyDetail(slug)` - Companies
- `useCompanyReviews(companyId, page)`, `useCompanyListings(companyId, params)` - Company sub-data
- `useCategories()`, `useBrands()`, `useCountries()`, `useCities(countryId?)`, `useActivityTypes()` - Reference data
- `useFavorites(page)`, `useCheckFavorite(listingId, enabled)` - Favorites
- `useViewHistory(page)` - History
- `useConversations(page)`, `useConversation(id)`, `useUnreadCount()` - Messaging
- `useMyTickets(page)`, `useAllTickets(params)`, `useTicket(id)` - Support
- `useDealerLeads(params)`, `useDealerLeadDetail(id)` - Dealer leads
- `useAdminStats()`, `useUsers(params)` - Admin
- `usePlans()`, `useMySubscription()` - Billing

**Mutation Hooks (18):**
- `useCreateReview(companyId)` - Reviews
- `useSubmitListing()`, `useApproveListing()`, `useRejectListing()`, `usePauseListing()`, `useResumeListing()`, `useResubmitListing()` - Listing status
- `useCreateListing()`, `useUpdateListing()` - Listing CRUD
- `useCreateDealerLead()`, `useUpdateDealerLead()` - Dealer leads
- `useUpdateProfile()` - Profile
- `useAddFavorite()`, `useRemoveFavorite()` - Favorites
- `useRecordView()` - History
- `useStartConversation()`, `useSendMessage(conversationId)` - Messaging
- `useCreateTicket()`, `useReplyToTicket(ticketId)`, `useUpdateTicket()` - Support
- `useUpdateUser()` - Admin

## Contact Details (Placeholder)

The frontend currently uses **placeholder** contact information that needs to be replaced with real Alcor Leasing details:

**Current placeholders:**
- Top bar: +1 (234) 567-890, info@marketplace.com
- Footer: +380 (44) 567-890, info@marketplace.com
- Contact section: +1 (234) 567-890, info@marketplace.com, 123 Business Avenue

**Real Alcor Leasing details** (from reference site at `/Users/rohan/Desktop/Alcor-Leasing 2/`):
- Phone: +38 (068) 319-98-00
- Email: alkorfk@gmail.com
- Address: 49044, м. Дніпро, вул. Івана Шулика, 2, офіс 302
- Working hours: Пн–Пт 09:00–18:00

**Files to update:** `top-bar.tsx`, `footer.tsx`, `contact-section.tsx`

## Common Tasks

### Adding a new filter to listings

1. Add field to `ListingQueryDto` in `api/src/listings/dto/listing-query.dto.ts`
2. Handle the field in `ListingsService.findAll()` where clause
3. Add filter UI in `web/src/components/listings/listings-filters.tsx`
4. Update URL params handling in `web/src/components/listings/listings-content.tsx`

### Adding a new landing page section

1. Create component in `web/src/components/landing/`
2. Import and add to `web/src/app/page.tsx`
3. Use `data-aos="fade-up"` for scroll animation

### Adding a new cabinet page

1. Create page at `web/src/app/cabinet/{page-name}/page.tsx`
2. Create component at `web/src/components/cabinet/{component-name}.tsx`
3. Add sidebar link in `web/src/app/cabinet/layout.tsx` (import icon, add to `sidebarLinks` array)
4. Add API function in `web/src/lib/api.ts` and hook in `web/src/lib/queries.ts` if needed

### Adding an admin page

1. Create page at `web/src/app/admin/{page-name}/page.tsx`
2. Create component at `web/src/components/admin/{component-name}.tsx` if complex
3. Add sidebar link in `web/src/app/admin/layout.tsx`
4. Admin layout handles role guard — no inline guard needed in component

### Creating a new API endpoint

1. Add route in appropriate controller
2. Add service method
3. Create/update DTOs as needed
4. Add fetch function in `web/src/lib/api.ts`
5. Add React Query hook in `web/src/lib/queries.ts`
6. Update types in `web/src/types/api.ts`

### Adding a new backend module with auth

1. Create module folder: `api/src/{module-name}/`
2. Create `{name}.module.ts`, `{name}.service.ts`, `{name}.controller.ts`
3. Create DTOs in `dto/` subfolder
4. Use `@UseGuards(JwtAuthGuard)` for authenticated endpoints
5. Add `RolesGuard` + `@Roles('ADMIN', 'MANAGER')` for admin-only endpoints
6. Use `@CurrentUser() user` to get the authenticated user
7. Import module in `api/src/app.module.ts`

## Environment Variables

### Backend (`api/.env`)
```
DATABASE_URL=postgresql://mp:mp@localhost:5433/mpdb
REDIS_URL=redis://localhost:6379
OPENSEARCH_URL=http://localhost:9200

JWT_SECRET=<your-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=marketplace
```

### Frontend (`web/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Infrastructure (docker-compose.yml)

- **PostgreSQL 16** - Port 5433 (creds: mp/mp, database: mpdb)
- **Redis 7** - Port 6379
- **OpenSearch 2.14.0** - Ports 9200/9600
- **MinIO** (latest) - Port 9000 (API), Port 9001 (Console), creds: minioadmin/minioadmin
- Persistent volumes: pgdata, osdata, miniodata

## Frontend Routes (35 total)

### Static Routes (○)
```
/                          Landing page
/_not-found                404 page
/about                     About page
/admin                     Admin dashboard
/admin/dealer-leads        Dealer leads pipeline
/admin/moderation          Listing moderation queue
/admin/tickets             Support tickets (admin)
/admin/users               User management
/cabinet                   Cabinet overview
/cabinet/favorites         Saved favorites
/cabinet/history           View history
/cabinet/listings          My listings
/cabinet/listings/new      Listing wizard
/cabinet/messages          Conversations list
/cabinet/settings          Profile settings
/cabinet/subscription      Subscription management
/cabinet/support           Support tickets
/cabinet/support/new       Create ticket
/categories                Categories page
/companies                 Companies browse
/dealer-registration       Dealer application
/forgot-password           Forgot password
/help                      Help / FAQ
/listings                  Listings browse
/login                     Login
/pricing                   Plans & pricing
/privacy                   Privacy policy
/register                  Registration
/reset-password            Reset password
/terms                     Terms of service
```

### Dynamic Routes (ƒ)
```
/cabinet/listings/[id]/edit    Edit listing
/cabinet/messages/[id]         Conversation detail
/cabinet/support/[id]          Ticket detail
/companies/[slug]              Company detail
/listings/[id]                 Listing detail
```

## Build & Deploy

```bash
# Build frontend
cd web && pnpm build

# Build backend
cd api && npx nest build
```

## Troubleshooting

### Port conflicts
- Backend runs on 3000, frontend auto-selects 3001 if 3000 is taken

### CSS not updating
- Tailwind v4 uses `@import "tailwindcss"` syntax, not traditional config file
- Check `globals.css` for `@theme inline` block with custom tokens

### AOS animations not working
- Ensure AOSProvider is wrapping the app in layout.tsx
- Check that `data-aos` attributes are on elements

### Auth issues
- Check JWT_SECRET is set in api/.env
- Ensure AuthProvider wraps the app in root layout
- Token refresh happens automatically on mount via auth-provider.tsx

### Upload failures
- Verify MinIO is running: `docker-compose ps`
- Check MinIO console at http://localhost:9001 (minioadmin/minioadmin)
- Ensure `marketplace` bucket exists
- Upload service sets bucket policy to public-read on startup so image URLs render in the UI

### Hydration mismatch errors
- Never use `Math.random()` or `Date.now()` in components that render on the server
- Use a `mounted` state pattern: render placeholder on server, real content after `useEffect` sets `mounted = true`
- For random-looking values, use a seeded PRNG (e.g., mulberry32 algorithm in `particles.tsx`)

### Light mode text invisible
- All theme-dependent colors must use CSS variables, not hardcoded dark-only values
- Check `globals.css` for `[data-theme="light"]` overrides
- Hero section uses inline style with CSS variables for gradient (not Tailwind classes)
- Inputs/textareas/selects have global light mode overrides in `globals.css`

### Footer spacing / content touching footer
- Global spacing is set in `layout.tsx` on `<main>` wrapper: `pb-24 md:pb-32`
- Do NOT add per-page bottom padding — the global wrapper handles spacing for all pages

### Docker command not found
- Use `docker compose` (without hyphen) instead of `docker-compose`
- Requires Docker Desktop to be installed and running

### Seed data not in Ukrainian
- Default seed data lives in `api/prisma/seed-all/*` via `api/prisma/seed-all.ts` (legacy `api/prisma/seed.ts` also exists)
- After changing seed data, re-run: `cd api && npx prisma db seed`
- Validate seed integrity: `cd api && pnpm seed:verify`

### Reference Design
- The Alcor Leasing reference site is at `/Users/rohan/Desktop/Alcor-Leasing 2/`
- Contains the original HTML/CSS design, contact details, and company information
- Use this as the design source of truth for styling decisions

## Update - 2026-02-17 (Fix_download)
- Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
- Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
- Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
- Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
- Completed validation checks and build/test verification; local infrastructure (Postgres/Redis/MinIO) confirmed working for this flow.

## Update - 2026-02-24 (Operational Fixes)

- Resolved Git remote sync blocker caused by malformed origin URL (newline in remote path) and completed branch/repo sync alignment for target remotes.
- Fixed image upload display issues in posting flow:
  - backend upload response now returns API-relative file paths
  - frontend API layer normalizes media URLs consistently
  - Next.js CSP allows local HTTP image loading for development.
- Fixed ad posting internal server error path in listings service:
  - safe category ID parsing
  - resilient fallback for missing template block lookup data.
- Fixed admin moderation queue interaction:
  - approve/reject actions are now available in `PENDING_MODERATION` and `SUBMITTED` tabs.
- Updated listing detail display semantics:
  - boolean values render as `Yes`/`No`.
- Validation performed:
  - `api` build passing
  - `api` security tests passing
  - local smoke API checks passing for auth, categories/options, upload, and listing create/read.
