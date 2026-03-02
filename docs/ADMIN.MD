# Admin Features Documentation

## Overview
This document outlines the implementation of the new Admin capabilities for the Alcor Marketplace. The features include management of **Marketplaces**, **Categories**, and **Dynamic Form Templates**.

## 1. Backend Implementation (`api/src/admin`)

The backend logic is encapsulated in the `AdminModule`.

### Controllers & Services
- **AdminController**: Exposes RESTful endpoints protected by `JwtAuthGuard` and `RolesGuard` (Requires `ADMIN` or `MANAGER` role).
- **AdminService**: Handles business logic and database interactions using Prisma.

### Database Schema Updates
New tables were utilized (defined in `schema.prisma`):
- `Marketplace`: Top-level entities (e.g., Agroline, Autoline).
- `Category`: Hierarchical category tree linked to a specific Marketplace.
- `FormTemplate`: Defines the structure of listing forms for a category.
- `FormField`: Specific fields (inputs, selects) belonging to a template.
- `FieldOption`: Options for select/multiselect fields.

### API Endpoints

#### Marketplaces
- `GET /admin/marketplaces` - List all marketplaces.
- `POST /admin/marketplaces` - Create a new marketplace.
- `PATCH /admin/marketplaces/:id` - Update marketplace details (name, active status).

#### Categories
- `POST /admin/categories` - Create a new category (root or child).
- `PATCH /admin/categories/:id` - Update category details.
- `DELETE /admin/categories/:id` - Delete a category (restricted if dependencies exist).

#### Form Templates
- `POST /admin/templates` - Create a new form template with defined fields.
- `GET /admin/templates/:id` - Retrieve a full template with fields and options.

---

## 2. Frontend Implementation (`web/src/app/admin`)

The frontend admin panel has been expanded with new pages and UI components.

### API Client (`web/src/lib/api.ts`)
Added new typed functions to interact with the admin endpoints:
- `getAdminMarketplaces`, `createAdminMarketplace`, `updateAdminMarketplace`
- `createAdminCategory`, `updateAdminCategory`, `deleteAdminCategory`
- `createAdminTemplate`, `getAdminTemplate`

### New Admin Pages

#### 1. Marketplace Management
- **Path**: `/admin/marketplaces`
- **Features**: 
  - List view of all marketplaces.
  - Create new marketplace with Key and Name.
  - Toggle Active/Inactive status.

#### 2. Category Management
- **Path**: `/admin/categories`
- **Features**:
  - Filter categories by Marketplace.
  - Recursive tree view of categories.
  - Add Root Category or Subcategory.
  - Edit or Delete categories.

#### 3. Form Template Builder
- **Path**: `/admin/templates/builder`
- **Features**:
  - Visual drag-and-drop style builder (UI only for now).
  - Add fields: Text, Number, Select, Multi-Select, Boolean.
  - Configure field options and requirements.
  - Save templates to backend.

### UI Components (`web/src/components/ui`)
Implemented standard **shadcn/ui** components to support the new pages:
- `Button`, `Input`, `Label`
- `Select` (Dropdowns)
- `Dialog` (Modals for forms)
- `Card` (Layout containers)

### Navigation
Updated `web/src/app/admin/layout.tsx` to include sidebar links:
- 🌐 **Marketplaces**
- 🗂️ **Categories**
- 📝 **Form Builder**

---

## 3. How to Use

1.  **Login** as an administrator (e.g., `admin@alcor.com`).
2.  Navigate to the **Admin Panel** via the dashboard or sidebar.
3.  **Setup Workflow**:
    1.  Go to **Marketplaces** to define your high-level domains (e.g., "Industrial").
    2.  Go to **Categories** to build the hierarchy (e.g., Industrial -> Generators -> Diesel).
    3.  Go to **Form Builder**, select a category (e.g., "Diesel Generators"), and define the specific fields (e.g., "Power Output", "Year", "Hours").
4.  **Result**: Users trying to place an ad in "Diesel Generators" will now see the custom form you created.

---

## Updates (2026-02-16)

### Backend (`api/src/admin`, `api/src/categories`)

- Added template management endpoints:
  - `GET /admin/templates`
  - `DELETE /admin/templates/:id`
  - `PATCH /admin/templates/:id/status` (`{ isActive: boolean }`)
- Template creation now uses category-based versioning:
  - New templates are created as the next version for that category.
  - Existing active templates in the same category are automatically deactivated.
- Template update/create operations now run in transactions with shared field/option creation logic.
- Template responses are normalized for frontend usage (`id` as string, `key`, `type`, `isRequired`, `validationRules`, ordered options).
- `GET /categories/:id-or-slug/template` now accepts both numeric category id and slug and returns the same normalized template structure.

### Frontend Admin (`web/src/app/admin`, `web/src/lib`)

- Admin sidebar template link moved from `/admin/templates/builder` to `/admin/templates`.
- New template list page: `web/src/app/admin/templates/page.tsx`:
  - Shows category, marketplace, version, status, field count, created date.
  - Supports activate/deactivate, delete, and edit actions.
- Form Builder improvements (`/admin/templates/builder`):
  - Supports loading by `templateId` or `categoryId` query parameters.
  - Better state hydration when editing existing templates.
  - Distinct actions for `Save Changes` (update current template) and `Save as New Version` (create new template version).
- API/query/type layer updates:
  - Added `getAdminTemplates`, `deleteAdminTemplate`, `updateAdminTemplateStatus`.
  - Added related React Query hooks.
  - Added `AdminTemplate` type and `version` support in `FormTemplate`.

### Translation Refactor (2026-02-16, `feature-translation`)

- Admin layout (`web/src/app/admin/layout.tsx`) was migrated to key-based translation labels:
  - Sidebar items now use locale keys (`admin.sidebar.*`) instead of hardcoded strings.
  - Desktop and mobile admin navigation remain aligned under one translation source.
- Translation implementation changed globally from DOM runtime translation to dictionary i18n:
  - Admin pages now switch language via `t(key)` lookups.
  - No runtime page parsing or auto-translation requests.

### Operations & Quality (2026-02-16)

- Admin categories page UX copy update:
  - Main action label changed from "Add Root Category" to "Add Marketplace".
- CI quality workflow added:
  - `.github/workflows/ci.yml` now validates web and API build/test paths on push/PR.
  - Includes DB-backed seed smoke verification (`migrate deploy` + `seed:all` + `seed:verify`).
- Seed tooling for admin/template demos:
  - Deterministic full-schema seed added as the default Prisma seed.
  - Template coverage is verified by `api/prisma/seed-verify.ts` (leaf categories must have active templates).

## Update - 2026-02-17 (Fix_download)
- Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
- Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
- Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
- Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
- Completed validation checks and build/test verification; local infrastructure (Postgres/Redis/MinIO) confirmed working for this flow.

## Update - 2026-03-01 (Admin Template Runtime + Moderation Verification Snapshot)

### Admin-impacting changes delivered
- Motorized system template (`engine_block`) expanded to Agroline-style vehicle parameters.
- Runtime template resolution now prioritizes built-in `engine_block` for consistency even when DB block payloads are stale.
- Draft validation path mirrors this behavior, reducing admin-side mismatch between template editor output and posting form behavior.

### Current verification scope
- Confirmed green:
  - API unit/security suites
  - API/web TypeScript checks
  - web lint.
- Not fully validated end-to-end in sandbox:
  - admin UI click-through flows (moderation/messages/delete conversation) need runtime manual smoke in deployed/local full-stack env
  - `api test:e2e` is blocked in this sandbox due port binding restriction (`listen EPERM`).
