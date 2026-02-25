# Marketplace Project Update - Technical Appendix

## 1) Scope and Commit Window
Implementation window:
- **From:** `db4cd77a23b4d2bcdef76373d4ae2779e527b09d`
- **To:** `dc5832ecacd3a9e257e89cf38ff4b325c8e6dd43`
- **Date range:** February 23-24, 2026

Commit sequence:
1. `ba586c3` - sync post-ad form with admin template builder
2. `7694b4a` - show full engine block fields in post-ad form
3. `2503726` - new fields in admin template builder start blank
4. `669a47b` - restore recovered marketplace updates
5. `f28184a` - create `form_block` table and align `form_field`
6. `dc5832e` - ignore `.claude` and remove nested worktree gitlink

---

## 2) Database and Prisma Layer

### 2.1 New/Updated Data Structures
- `category.has_engine` (boolean, default false)
- `form_template.block_ids` (JSONB, default `[]`)
- New `form_block` table:
  - `id` (text)
  - `name` (unique)
  - `is_system`
  - `fields` (JSONB)
  - timestamps
- `form_field` synchronization:
  - `config` JSONB
  - `required_if` JSONB
  - `section` text
- Added/ensured `model` table with indexes and FKs for brand/category relation.

### 2.2 Migrations Added
- `20260223143000_backfill_motorized_categories`
- `20260223150000_add_form_template_block_ids`
- `20260224094000_create_form_block`
- `20260224094500_form_block_id_text`
- `20260224095500_sync_formfield_and_model`

### 2.3 Seed Behavior
- Category seeding now supports/derives `hasEngine`.
- System block `engine_block` is upserted.
- Motorized leaf templates include `blockIds: ['engine_block']`.
- Seed logic now aligns templates and runtime expectations across categories.

---

## 3) Backend (NestJS) Architecture Changes

### 3.1 Admin Template and Category Management
- Extended admin APIs/services to support:
  - Category `hasEngine`
  - Template `blockIds`
  - Block CRUD (`/admin/blocks`)
- Added template propagation logic:
  - Engine root category -> propagate to all `hasEngine` categories.
  - Non-engine category -> propagate to descendants.

### 3.2 Template Resolution Fixes
In `CategoriesService`:
- Direct active category template is now always preferred.
- Fallback chain made deterministic:
  1. direct
  2. nearest ancestor
  3. sibling
  4. motorized fallback
- Removed stale timestamp-based behavior that could select older templates incorrectly.

### 3.3 Engine Block Runtime Guarantee
- For engine categories, `engine_block` is injected into effective block IDs if missing.
- If DB block record is absent, service uses built-in engine block definition.
- Guarantees complete technical form fields without requiring fragile manual sync.

### 3.4 Rule-Driven Dynamic Validation
- Introduced/used rule-tree evaluator supporting:
  - `all`, `any`, `not`
  - operators: `eq`, `ne`, `in`, `exists`, `gt`, `gte`, `lt`, `lte`, etc.
- Listing draft validation now enforces:
  - field visibility conditions (`visibleIf`)
  - conditional required rules (`requiredIf`)
  - type and min/max validation

### 3.5 Options System Enhancements
- Dynamic option resolution from:
  - static lists
  - API endpoints
  - DB queries (`/options/resolve`)
- Added richer create-option endpoints for brands/models/categories/countries/cities.
- Category creation flow can inherit/copy template structure from parent/sibling contexts.

### 3.6 Security Hardening
Auth:
- CSRF checks for refresh/logout.
- Session cookie handling tightened.
- Email verification throttling and resend controls.
- Strong password policy enforced.

Upload:
- Guest upload token flow with TTL/rate limits.
- Per-actor quotas (requests, files, bytes).
- MIME and file-signature validation (JPEG/PNG/WEBP/GIF only).

---

## 4) Frontend (Next.js / React) Changes

### 4.1 Admin Categories Interface
- New page for hierarchical category management.
- CRUD operations with marketplace filtering and parent-child handling.
- `hasEngine` control integrated in category forms.

### 4.2 Admin Template Builder Upgrade
- Loads template by category.
- Supports reusable block selection and block CRUD.
- Supports advanced field configuration:
  - visibility/required rule JSON
  - data source mode (`static`, `api`, `db`)
  - endpoint/query/dependency mapping

### 4.3 Dynamic Listing Form Improvements
- Conditional show/hide via rules.
- Conditional required fields via rules.
- Dependency-driven option refresh and child reset behavior.
- Better compatibility with model/brand dynamic option pipelines.

### 4.4 Template Freshness Fix
`useCategoryTemplate` query now uses:
- `staleTime: 0`
- `refetchOnMount: 'always'`
- `refetchOnWindowFocus: true`

This prevents stale form templates in post-ad flow.

### 4.5 Listing and Media UX
- Listing details improved with template-aware labels/grouping.
- Media uploader switched to server upload path with stricter client validation.
- Contact/submit step validates dynamic attributes before submit.
- Price display behavior corrected for "on request" and missing values.

---

## 5) Testing and Quality Signals
- Added `categories.service.spec.ts` to cover template resolution and motorized fallback behavior.
- Added/updated unit/security-related tests in impacted modules (auth/upload/config/rule-tree areas).
- Documentation files updated for project status, security, planning, and runbooks.

---

## 6) Recreate/Verification Materials
Detailed reproduction package exists at:
- `docs/recreate-db4cd77a-to-dc5832e/`

Contains:
- commit-by-commit full patches
- full-range diff
- replay checklist/checkpoints

This supports one-to-one reconstruction on older versions.

---

## 7) Final Technical Outcome
The project moved from basic per-category fields to a block-enabled, rule-driven template architecture with stronger consistency and security. The update is end-to-end: schema, services, APIs, admin tooling, user form flow, and validation pipeline are now aligned.
