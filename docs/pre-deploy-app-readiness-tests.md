# Pre-Deploy App Readiness Tests (High-Level)

Date: 2026-02-26  
Scope: `api` + `web` + infrastructure services (`postgres`, `redis`, `minio`, `opensearch`, `mailpit`)  
Owner: QA + Backend + Frontend + DevOps + Security

## Purpose

Use this as the release checklist before any production deployment.  
A release is considered ready only when all gates below are marked `PASS`.

## Gate 0 - Automated Quality Baseline (Must Pass)

- [ ] `web`: `npm --prefix web run i18n:guard`
- [ ] `web`: `npm --prefix web run lint`
- [ ] `web`: `npm --prefix web run build`
- [ ] `api`: `npm --prefix api run build`
- [ ] `api`: `npm --prefix api test -- --runInBand`
- [ ] `api`: `npm --prefix api run test:e2e -- --runInBand`
- [ ] `api`: `npm --prefix api run test:security`
- [ ] `api`: `pnpm --dir api run audit:prod` (no high/critical findings)
- [ ] CI security jobs green: secret scan + SAST

## Gate 1 - Environment and Data Readiness

- [ ] Production/staging config review completed (`JWT_SECRET`, `UPLOAD_GUEST_TOKEN_SECRET`, `S3_*`, `FRONTEND_URL`, `DATABASE_URL`, `REDIS_URL`)
- [ ] Secrets follow security constraints in `api/src/config/configuration.ts` (length, entropy, no insecure defaults, secret separation)
- [ ] DB migration dry run passed: `npx --prefix api prisma migrate deploy`
- [ ] Full seed verification passed on staging clone:
  - `npm --prefix api run seed:all`
  - `npm --prefix api run seed:verify`
- [ ] Confirm expected marketplaces and taxonomy exist (`agroline`, `autoline`, `machineryline`)

## Gate 2 - Critical User Journeys (E2E UAT)

### 2.1 Authentication
- [ ] Register, verify email, login, refresh token, logout all succeed
- [ ] Forgot-password + reset-password flow succeeds via mail provider
- [ ] Invalid credentials and expired tokens return correct errors (`401/400`)

### 2.2 Listing Creation and Publishing
- [ ] Authenticated listing flow works end-to-end:
  - `/ad-placement/select-category` -> `/ad-placement/details`
  - description + dynamic attributes + media + contacts
  - submit for moderation
- [ ] Guest upload flow works with upload token and later authenticated publish
- [ ] Listing edit/update works from `/cabinet/listings/[id]/edit`
- [ ] Listing status transitions validated: submit, pause, resume, resubmit

### 2.3 Listings Discovery and Detail
- [ ] `/listings` loads with filters and pagination
- [ ] `/listings/[id]` renders media, mapped attribute labels, price behavior, boolean formatting
- [ ] Search/facet endpoints return expected data under real seeded content

### 2.4 Company, Cabinet, Messaging, Support
- [ ] `/companies` and `/companies/[slug]` load and filter correctly
- [ ] Favorites, view history, saved searches, notifications, subscription pages work
- [ ] Messaging conversation create/read/reply/unread counters work
- [ ] Support ticket create/reply/status flows work for user and admin

## Gate 3 - Admin and Moderation Readiness

- [ ] Admin auth/role guard works for all `/admin/*` pages and API routes
- [ ] Marketplace management: create/update/activate/deactivate works
- [ ] Category management: create/edit/delete and tree behavior work
- [ ] Template lifecycle works:
  - list templates
  - create/update
  - activate/deactivate
  - versioning behavior
- [ ] Form blocks and engine block behavior validated on motorized categories
- [ ] Moderation queue validates actions for `SUBMITTED` and `PENDING_MODERATION`

## Gate 4 - Security Regression Tests

### 4.1 Authorization and Access Control
- [ ] Cross-account listing mutation attempts are blocked (`403`)
- [ ] Non-admin access to admin endpoints blocked (`403`)
- [ ] Public write restrictions on reference endpoints enforced

### 4.2 Session and Token Security
- [ ] Refresh token cookie remains `HttpOnly`, `SameSite=Strict`, secure in prod
- [ ] CSRF header + cookie check enforced on `/auth/refresh` and `/auth/logout`
- [ ] Old refresh token replay attempts fail

### 4.3 Upload and Abuse Controls
- [ ] Upload rejects spoofed file signatures and invalid mime/type mismatches
- [ ] Upload rate limits and quota enforcement return `429` when exceeded
- [ ] Path traversal/invalid filename patterns blocked on file retrieval route

### 4.4 Headers and Privacy
- [ ] API helmet protections active
- [ ] Web response headers present (`CSP`, `X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`)
- [ ] Translation privacy controls tested:
  - `TRANSLATION_EXTERNAL_ENABLED=false` returns `503`
  - `TRANSLATION_ALLOW_PII=false` suppresses sensitive text translation

## Gate 5 - Performance and Reliability

- [ ] Baseline load test run for hot endpoints:
  - `GET /listings`
  - `GET /search`, `GET /search/facets`
  - `POST /auth/login`
  - `POST /upload/images`
- [ ] Target SLOs met:
  - core read endpoints `p95 < 300ms` (staging baseline)
  - error rate `< 1%` under expected load
- [ ] Resilience drills completed:
  - Redis temporary outage
  - MinIO temporary outage
  - email provider outage
- [ ] Graceful degradation confirmed (no data corruption, recoverable retries)

## Gate 6 - Release Execution and Post-Deploy Checks

- [ ] Deployment plan selected (canary or blue/green) with rollback trigger documented
- [ ] Post-deploy smoke run completed:
  - auth
  - listing create/read
  - upload/view media
  - admin moderation action
- [ ] Monitoring and alert checks completed (error rate, latency, queue/backlog, DB health)
- [ ] Secret rotation rollback path acknowledged (`docs/secret-rotation-runbook.md`)

## Evidence Package (Required Before Sign-Off)

- [ ] CI run links and commit SHA
- [ ] Test report for each gate above
- [ ] Security results (`test:security`, audit, secret scan, SAST)
- [ ] Seed/migration verification output
- [ ] UAT sign-off from Product/QA
- [ ] Deployment + rollback record

## Final Go/No-Go Rule

- Go: all gates `PASS`, no open `P0/P1` defects, and evidence package complete.
- No-Go: any failed gate, unresolved critical security issue, or missing rollback confidence.

## Update - 2026-03-01 (Current Local Verification Snapshot)

- Verified in current branch session:
  - pass: `pnpm -C api test --runInBand`
  - pass: `pnpm -C api exec tsc --noEmit`
  - pass: `pnpm -C web exec tsc --noEmit`
  - pass: `pnpm -C web lint`
- Environment-constrained in this sandbox:
  - `pnpm -C api build` failed due missing `cross-env` binary in shell environment
  - `pnpm -C web build` failed because Google Fonts fetch is blocked
  - `pnpm -C api test:e2e` failed due sandbox port binding restriction (`listen EPERM`).
- Implication for Gate 0:
  - quality baseline is partially evidenced locally
  - full Gate 0 pass still requires running `api build`, `web build`, and `api test:e2e` in a non-restricted CI/staging environment.

## Documentation Refresh - 2026-03-28

Reviewed during the `new_improvements` branch documentation pass.
For the latest implementation state, see `REBUILD_CHANGELOG.md` and `docs/project_status.md`.
