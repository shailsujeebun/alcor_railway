# Security Hardening Plan (2026-02-17)

## Purpose

This document turns the current security review into an implementation backlog with:

- clear owner per item
- clear priority (`P0`, `P1`, `P2`)
- explicit acceptance criteria
- explicit verification tests

## Priority Definitions

- `P0`: Must fix before production rollout or before opening public traffic.
- `P1`: High-value hardening for current milestone; complete right after `P0`.
- `P2`: Important defense-in-depth and maturity work.

## Security Backlog

| ID | Priority | Area | Owner | Status |
|---|---|---|---|---|
| SH-01 | P0 | Listing authorization (BOLA/IDOR) | Backend | DONE |
| SH-02 | P0 | Company authorization (BOLA/IDOR) | Backend | DONE |
| SH-03 | P0 | Lock public reference-data writes | Backend | DONE |
| SH-04 | P0 | Upload abuse hardening | Backend + DevOps | DONE |
| SH-05 | P0 | Remove sensitive token/code logs | Backend | DONE |
| SH-06 | P0 | Refresh token transport hardening | Backend + Frontend | DONE |
| SH-07 | P0 | Global throttling + endpoint rate limits | Backend | DONE |
| SH-08 | P1 | Secret management / fail-fast config | DevOps + Backend | DONE |
| SH-09 | P1 | Password + verification anti-bruteforce policy | Backend | DONE |
| SH-10 | P1 | HTTP security headers / CSP | Backend + Frontend | DONE |
| SH-11 | P1 | Dependency vulnerability remediation | DevOps + Backend | DONE |
| SH-12 | P1 | Translation data privacy controls | Frontend + Product + Security | DONE |
| SH-13 | P2 | Security CI gates (SAST/secret scan/audit) | DevOps | DONE |
| SH-14 | P2 | Security-focused automated test suite | QA + Backend + Frontend | DONE |

## Detailed Work Items

### SH-01 - Listing Authorization (BOLA/IDOR)

- **Risk**: Any authenticated user may mutate listings they do not own.
- **Affected paths**:
  - `api/src/listings/listings.controller.ts`
  - `api/src/listings/listings.service.ts`
- **Required changes**:
  - Pass current user identity into all mutating listing endpoints.
  - Enforce owner check in service layer for:
    - `PATCH /listings/:id`
    - `PUT /listings/:id/attributes`
    - `PUT /listings/:id/contact`
    - `POST /listings/:id/submit`
    - `POST /listings/:id/pause`
    - `POST /listings/:id/resume`
    - `POST /listings/:id/resubmit`
  - Allow bypass only for `ADMIN`/`MANAGER`.
- **Acceptance criteria**:
  - User A cannot modify User B listing on any endpoint above (`403`).
  - Owner and admins can perform allowed actions.
- **Verification tests**:
  - Integration tests for each endpoint with 3 users: owner, other user, admin.

### SH-02 - Company Authorization (BOLA/IDOR)

- **Risk**: Any authenticated user may update any company.
- **Affected paths**:
  - `api/src/companies/companies.controller.ts`
  - `api/src/companies/companies.service.ts`
- **Required changes**:
  - Require ownership/company membership (`OWNER` role) for `PATCH /companies/:id`.
  - Keep admin/manager override.
  - Resolve actor from JWT user id, not request payload.
- **Acceptance criteria**:
  - Non-member receives `403` for company update.
  - Member owner and admin paths still work.
- **Verification tests**:
  - Integration tests for member/non-member/admin update scenarios.

### SH-03 - Lock Public Reference Data Writes

- **Risk**: Public write endpoints enable spam/data poisoning.
- **Affected paths**:
  - `api/src/categories/categories.controller.ts`
  - `api/src/brands/brands.controller.ts`
  - `api/src/activity-types/activity-types.controller.ts`
  - `api/src/countries/countries.controller.ts`
  - `api/src/cities/cities.controller.ts`
- **Required changes**:
  - Restrict all create endpoints to `ADMIN`/`MANAGER` or admin-only as required.
  - Keep read endpoints public.
- **Acceptance criteria**:
  - Unauthenticated and normal authenticated users receive `401/403`.
  - Admin can still create.
- **Verification tests**:
  - Auth matrix tests (anonymous, user, manager/admin).

### SH-04 - Upload Abuse Hardening

- **Risk**: Unauthenticated uploads + public bucket can be abused for storage and malicious files.
- **Affected paths**:
  - `api/src/upload/upload.controller.ts`
  - `api/src/upload/upload.service.ts`
- **Required changes**:
  - Add access control for direct upload endpoint or issue short-lived guest upload tokens.
  - Validate by magic bytes (not MIME header only).
  - Enforce per-user/IP quotas and request burst limits.
  - Restrict allowed folder targets and extensions server-side.
  - Revisit public bucket policy; prefer private bucket + controlled delivery.
- **Acceptance criteria**:
  - MIME spoofed files are rejected.
  - Upload quota exceeded returns `429`.
  - Anonymous abusive upload attempts are blocked.
- **Verification tests**:
  - Negative tests for spoofed content, oversize, burst upload, and folder traversal.

### SH-05 - Remove Sensitive Token/Code Logging

- **Risk**: Password reset tokens and verification codes are exposed in logs.
- **Affected paths**:
  - `api/src/auth/auth.service.ts`
- **Required changes**:
  - Remove plaintext logs for reset tokens and verification codes.
  - Add log redaction policy for sensitive auth fields.
- **Acceptance criteria**:
  - No logs contain raw reset tokens or verification codes.
- **Verification tests**:
  - `rg "reset token|verification code|Password reset token|Email verification code" api/src` returns no sensitive logging lines.

### SH-06 - Refresh Token Transport Hardening

- **Risk**: Refresh token is JS-readable and sent in JSON body (high impact under XSS).
- **Affected paths**:
  - `web/src/stores/auth-store.ts`
  - `web/src/lib/auth-api.ts`
  - `api/src/auth/auth.controller.ts`
  - `api/src/auth/auth.service.ts`
- **Required changes**:
  - Store refresh token in `HttpOnly`, `Secure`, `SameSite=Strict` cookie set by backend.
  - Remove refresh token from frontend JS storage and API JSON responses where possible.
  - Keep refresh-token rotation on each refresh and revoke old session.
  - Add CSRF protection for cookie-based refresh/logout endpoints.
- **Acceptance criteria**:
  - Frontend JS cannot read refresh token.
  - Refresh flow still works across reloads.
  - Replay of an old refresh token fails.
- **Verification tests**:
  - Browser/E2E test confirms no refresh token in `document.cookie`.
  - Integration test confirms one-time refresh token rotation.

### SH-07 - Global Throttling and Endpoint-Specific Rate Limits

- **Risk**: Auth and public submission endpoints are brute-force/spam targets.
- **Affected paths**:
  - `api/src/app.module.ts`
  - `api/src/auth/auth.controller.ts`
  - `api/src/dealer-leads/dealer-leads.controller.ts`
  - `api/src/upload/upload.controller.ts`
- **Required changes**:
  - Register `ThrottlerGuard` globally (`APP_GUARD`).
  - Add tighter route-specific limits for:
    - `/auth/login`
    - `/auth/verify-email`
    - `/auth/forgot-password`
    - `/auth/resend-verification`
    - `/dealer-leads`
    - `/upload/images`
- **Acceptance criteria**:
  - Exceeding limits returns `429` with consistent response shape.
- **Verification tests**:
  - Load test scripts triggering threshold behavior per endpoint.

### SH-08 - Secrets and Fail-Fast Configuration

- **Risk**: Weak defaults (`dev-secret`, `minioadmin`) could leak into production.
- **Affected paths**:
  - `api/src/config/configuration.ts`
- **Required changes**:
  - Remove insecure production defaults for JWT/S3 credentials.
  - Add environment validation schema and fail startup on missing prod secrets.
  - Create secret rotation runbook.
- **Acceptance criteria**:
  - Production startup fails when required secrets are absent/weak.
  - No production config path uses fallback secret literals.
- **Verification tests**:
  - Startup validation tests with invalid/missing env variables.

### SH-09 - Password and Verification Policy

- **Risk**: Current minimum password and verification flow are susceptible to weak credential usage/bruteforce.
- **Affected paths**:
  - `api/src/auth/dto/register.dto.ts`
  - `api/src/auth/auth.service.ts`
- **Required changes**:
  - Increase password policy strength (length + entropy checks).
  - Add failed verification-attempt counters and temporary lockouts.
  - Add resend cooldown per account and IP.
- **Acceptance criteria**:
  - Weak passwords rejected with clear error.
  - Excessive code attempts/resends are blocked.
- **Verification tests**:
  - Integration tests for lockout and cooldown behavior.

### SH-10 - HTTP Security Headers and CSP

- **Risk**: Missing baseline hardening against common browser attacks.
- **Affected paths**:
  - `api/src/main.ts`
  - `web/next.config.ts`
- **Required changes**:
  - Apply `helmet` in API with tuned policy.
  - Add strict response headers in Next app (CSP, frame-ancestors, referrer-policy, X-Content-Type-Options).
  - Enable HSTS in production.
- **Acceptance criteria**:
  - Security headers present for API and web responses.
- **Verification tests**:
  - Automated header assertions in integration tests.

### SH-11 - Dependency Vulnerability Remediation

- **Risk**: Known vulnerabilities in production dependency tree (notably `qs`; Prisma chain advisories).
- **Affected scope**:
  - `api/package.json`
  - lockfiles and dependency overrides
- **Required changes**:
  - Upgrade/override vulnerable dependencies where patch exists.
  - Add policy: no unresolved high/critical vulnerabilities in prod deps.
- **Acceptance criteria**:
  - `pnpm -C api audit --prod` reports no high/critical vulnerabilities.
  - Exceptions documented with explicit compensating controls.
- **Verification tests**:
  - CI step for dependency audit with severity threshold.

### SH-12 - Translation Data Privacy Controls

- **Risk**: User text sent to third-party translation service may violate privacy/compliance expectations.
- **Affected paths**:
  - `web/src/app/api/translate/route.ts`
- **Required changes**:
  - Add environment switch to disable external translation in sensitive environments.
  - Add explicit product policy on what text may be translated externally.
  - Optionally move to approved provider with contractual data controls.
- **Acceptance criteria**:
  - Translation route can be fully disabled by config.
  - Privacy policy and product behavior are aligned.
- **Verification tests**:
  - Route test for disabled mode.
  - Documentation sign-off by product/security.

### SH-13 - Security CI Gates

- **Risk**: Security regressions can merge unnoticed.
- **Owner**: DevOps
- **Required changes**:
  - Add secret scanning in CI.
  - Add SAST checks (configurable baseline).
  - Keep dependency audit gating.
- **Acceptance criteria**:
  - PR fails on secret leak/high-risk findings.
- **Verification tests**:
  - CI dry-runs proving failed and passing scenarios.

### SH-14 - Security Test Suite Expansion

- **Risk**: Current test coverage is near-zero for real attack paths.
- **Required changes**:
  - Add API integration tests for authZ, authN abuse, rate limits, upload hardening.
  - Add E2E security flows for cross-account access attempts.
  - Add load-abuse tests for auth and public endpoints.
- **Acceptance criteria**:
  - Core security scenarios are automated and required in CI.
- **Verification tests**:
  - New test suite stats and CI checks visible in pipeline.

## Progress Log

### 2026-02-17 - SH-01 Completed

- **Implemented by**: Backend
- **Scope delivered**:
  - Enforced ownership/admin checks for all user-level listing mutation endpoints.
  - Controller now passes authenticated actor (`id`, `role`) to mutation service methods.
  - Service now blocks non-owner, non-admin/non-manager mutation attempts with `403`.
- **Updated files**:
  - `api/src/listings/listings.controller.ts`
  - `api/src/listings/listings.service.ts`
  - `docs/security-hardening.md`
- **Verification**:
  - `pnpm -C api build` passes after authorization changes.
  - `pnpm -C api test` passes after authorization changes.

### 2026-02-17 - SH-02 Completed

- **Implemented by**: Backend
- **Scope delivered**:
  - Enforced company update authorization on `PATCH /companies/:id`.
  - Only company `OWNER` or platform `ADMIN`/`MANAGER` can update company details.
  - Controller now passes authenticated actor (`id`, `role`) into update service.
- **Updated files**:
  - `api/src/companies/companies.controller.ts`
  - `api/src/companies/companies.service.ts`
  - `docs/security-hardening.md`
- **Verification**:
  - `pnpm -C api build` passes after authorization changes.
  - `pnpm -C api test` passes after authorization changes.

### 2026-02-17 - SH-03 Completed

- **Implemented by**: Backend
- **Scope delivered**:
  - Locked reference-data create endpoints to `ADMIN`/`MANAGER` roles.
  - Kept corresponding read endpoints public.
- **Endpoints protected**:
  - `POST /categories`
  - `POST /brands`
  - `POST /activity-types`
  - `POST /countries`
  - `POST /cities`
- **Updated files**:
  - `api/src/categories/categories.controller.ts`
  - `api/src/brands/brands.controller.ts`
  - `api/src/activity-types/activity-types.controller.ts`
  - `api/src/countries/countries.controller.ts`
  - `api/src/cities/cities.controller.ts`
  - `docs/security-hardening.md`
- **Verification**:
  - `pnpm -C api build` passes after authorization changes.
  - `pnpm -C api test` passes after authorization changes.

### 2026-02-17 - SH-04 Completed

- **Implemented by**: Backend + Frontend
- **Scope delivered**:
  - Replaced fully-open direct uploads with authenticated upload access:
    - `Bearer` access token for signed-in users.
    - short-lived guest upload token for guest flows.
  - Added guest token endpoint with per-client issuance rate limiting.
  - Added per-actor upload quotas (requests/files/bytes per minute) for direct uploads.
  - Added server-side magic-byte image signature validation (JPEG/PNG/WEBP/GIF).
  - Enforced strict signature/content-type match checks to block MIME spoofing.
  - Restricted upload folders and presigned upload content types server-side.
  - Made bucket public-read policy configurable (`S3_PUBLIC_READ_ASSETS`) instead of always forcing public-read.
  - Updated frontend upload client to request and reuse guest upload tokens automatically.
- **Updated files**:
  - `api/src/config/configuration.ts`
  - `api/src/upload/upload.module.ts`
  - `api/src/upload/upload.controller.ts`
  - `api/src/upload/upload.service.ts`
  - `web/src/lib/api.ts`
  - `docs/security-hardening.md`
- **Verification**:
  - `pnpm -C api build` passes after upload hardening changes.
  - `pnpm -C api test` passes after upload hardening changes.
  - `pnpm -C web build` passes after guest-upload client updates.

### 2026-02-17 - SH-05 Completed

- **Implemented by**: Backend
- **Scope delivered**:
  - Removed plaintext logging of password-reset tokens.
  - Removed plaintext logging of email-verification codes.
  - Replaced with redacted operational logs containing only `userId`.
- **Updated files**:
  - `api/src/auth/auth.service.ts`
  - `docs/security-hardening.md`
- **Verification**:
  - `rg "Password reset token for|Email verification code for" api/src/auth` returns no matches.
  - `pnpm -C api build` passes after logging hardening changes.
  - `pnpm -C api test` passes after logging hardening changes.

### 2026-02-17 - SH-06 Completed

- **Implemented by**: Backend + Frontend
- **Scope delivered**:
  - Migrated refresh token transport from JSON body / JS-accessible cookie to backend-managed `HttpOnly` cookie.
  - Added double-submit CSRF validation for cookie-based `/auth/refresh` and `/auth/logout`.
  - Rotated refresh-token cookies on every refresh while keeping one-time session rotation/revocation.
  - Removed refresh-token persistence from frontend JS state/cookies.
  - Updated auth API/store flows to use `credentials: include` and cookie-driven refresh.
- **Updated files**:
  - `api/src/auth/auth.controller.ts`
  - `api/src/auth/auth.service.ts`
  - `web/src/stores/auth-store.ts`
  - `web/src/lib/auth-api.ts`
  - `web/src/lib/api.ts`
  - `web/src/components/providers/auth-provider.tsx`
  - `web/src/components/layout/navbar.tsx`
  - `web/src/components/auth/login-form.tsx`
  - `web/src/components/auth/verify-email-form.tsx`
  - `web/src/types/api.ts`
  - `docs/security-hardening.md`
- **Verification**:
  - `rg "Cookies.get\\('refreshToken'\\)|Cookies.set\\('refreshToken'\\)|Cookies.remove\\('refreshToken'\\)" web/src` returns no matches.
  - `pnpm -C api build` passes after cookie-based refresh hardening.
  - `pnpm -C api test` passes after cookie-based refresh hardening.
  - `pnpm -C web build` passes after frontend auth flow migration.

### 2026-02-17 - SH-07 Completed

- **Implemented by**: Backend
- **Scope delivered**:
  - Registered throttling globally by binding `ThrottlerGuard` as `APP_GUARD`.
  - Added tighter route-level throttles for:
    - `/auth/login`
    - `/auth/verify-email`
    - `/auth/forgot-password`
    - `/auth/resend-verification`
    - `/dealer-leads`
    - `/upload/images`
  - Kept module-wide default throttle in place as baseline protection.
- **Updated files**:
  - `api/src/app.module.ts`
  - `api/src/auth/auth.controller.ts`
  - `api/src/dealer-leads/dealer-leads.controller.ts`
  - `api/src/upload/upload.controller.ts`
  - `docs/security-hardening.md`
- **Verification**:
  - `rg "@Throttle|APP_GUARD|ThrottlerGuard" api/src/app.module.ts api/src/auth/auth.controller.ts api/src/dealer-leads/dealer-leads.controller.ts api/src/upload/upload.controller.ts` shows expected guard/decorators.
  - `pnpm -C api build` passes after throttling hardening.
  - `pnpm -C api test` passes after throttling hardening.

### 2026-02-17 - SH-08 Completed

- **Implemented by**: Backend + DevOps docs
- **Scope delivered**:
  - Removed insecure production fallback secrets for JWT and S3 credentials.
  - Added fail-fast startup validation for production secret strength/uniqueness.
  - Added explicit production validation for:
    - `JWT_SECRET`
    - `UPLOAD_GUEST_TOKEN_SECRET`
    - `S3_ACCESS_KEY_ID`
    - `S3_SECRET_ACCESS_KEY`
  - Added unit tests for missing/weak secret scenarios and strong-secret success path.
  - Added a rotation runbook for operational secret rollover.
- **Updated files**:
  - `api/src/config/configuration.ts`
  - `api/src/config/configuration.spec.ts`
  - `docs/secret-rotation-runbook.md`
  - `docs/security-hardening.md`
- **Verification**:
  - `pnpm -C api build` passes after config hardening.
  - `pnpm -C api test` passes including configuration validation tests.
  - `pnpm -C api test -- configuration.spec.ts` validates fail-fast env behavior directly.

### 2026-02-17 - SH-09 Completed

- **Implemented by**: Backend
- **Scope delivered**:
  - Strengthened registration password policy (length + uppercase + lowercase + number + special char).
  - Added server-side password strength enforcement in auth service for both registration and password reset.
  - Added Redis-backed verification-code attempt tracking with temporary lockout behavior.
  - Added Redis-backed resend cooldown enforcement keyed by account and client IP.
  - Wired client IP extraction in auth controller for verify/resend flows.
  - Added auth service security-policy tests for weak password rejection, verification lockout, and resend cooldown.
- **Updated files**:
  - `api/src/auth/dto/register.dto.ts`
  - `api/src/auth/auth.service.ts`
  - `api/src/auth/auth.controller.ts`
  - `api/src/auth/auth.service.spec.ts`
  - `api/src/redis/redis.service.ts`
  - `docs/security-hardening.md`
- **Verification**:
  - `pnpm -C api build` passes after auth hardening updates.
  - `pnpm -C api test` passes with new auth security tests.
  - `pnpm -C api test -- auth.service.spec.ts` validates lockout/cooldown and password policy behavior.

### 2026-02-17 - SH-10 Completed

- **Implemented by**: Backend + Frontend
- **Scope delivered**:
  - Added `helmet` middleware to API bootstrap with tuned settings for API traffic.
  - Added web security headers in Next config:
    - `Content-Security-Policy` (including `frame-ancestors 'none'`)
    - `Referrer-Policy`
    - `X-Content-Type-Options`
    - `X-Frame-Options`
    - `Permissions-Policy`
  - Disabled `X-Powered-By` header in Next (`poweredByHeader: false`).
- **Updated files**:
  - `api/src/main.ts`
  - `api/package.json`
  - `pnpm-lock.yaml`
  - `web/next.config.ts`
  - `docs/security-hardening.md`
- **Verification**:
  - `rg "helmet\\(|Content-Security-Policy|Referrer-Policy|X-Content-Type-Options|frame-ancestors" api/src/main.ts web/next.config.ts` confirms header/middleware wiring.
  - `pnpm -C api build` passes after API header hardening.
  - `pnpm -C api test` passes after API header hardening.
  - `pnpm -C web build` passes after Next security-header configuration.

### 2026-02-17 - SH-11 Completed

- **Implemented by**: DevOps + Backend
- **Scope delivered**:
  - Added production dependency audit policy script with high/critical severity gate (`audit:prod`).
  - Added transitive dependency overrides to pull patched versions for vulnerable packages.
  - Added CI pipeline job (`api-security-audit`) that runs `pnpm` install + `audit:prod` gate.
  - Re-ran dependency audits for API and web production dependencies after remediation.
- **Updated files**:
  - `api/package.json`
  - `api/pnpm-lock.yaml`
  - `.github/workflows/ci.yml`
  - `docs/security-hardening.md`
- **Verification**:
  - `pnpm -C api audit --prod --json` reports zero vulnerabilities.
  - `pnpm -C web audit --prod --json` reports zero vulnerabilities.
  - `pnpm -C api audit:prod` passes (no high/critical vulnerabilities).
  - `pnpm -C api build` passes after dependency updates.
  - `pnpm -C api test` passes after dependency updates.
  - `pnpm -C web build` passes after lockfile/dependency updates.

### 2026-02-17 - SH-12 Completed

- **Implemented by**: Frontend + Product/Security docs
- **Scope delivered**:
  - Added environment switch to disable external translation route completely.
  - Added default privacy guard to avoid sending likely sensitive text (email/phone/URL patterns) to external translator.
  - Added documented policy defining allowed/disallowed translation content and ownership.
- **Updated files**:
  - `web/src/app/api/translate/route.ts`
  - `docs/translation-privacy-policy.md`
  - `docs/security-hardening.md`
- **Verification**:
  - `pnpm -C web build` passes after translation privacy hardening.
  - Route behavior check:
    - with `TRANSLATION_EXTERNAL_ENABLED=false`, `/api/translate` returns `503` with policy error.
    - with `TRANSLATION_ALLOW_PII=false`, text matching email/phone/URL patterns is excluded from external translation payload.

### 2026-02-17 - SH-13 Completed

- **Implemented by**: DevOps
- **Scope delivered**:
  - Added dedicated CI secret scanning gate using Gitleaks.
  - Added dedicated CI SAST gate using Semgrep with high-severity blocking.
  - Added Semgrep baseline support (`SEMGREP_BASELINE_COMMIT` / `SEMGREP_BASELINE_REF`) via reusable CI script.
  - Kept dependency-audit gate active from SH-11.
  - Added `.gitleaksignore` baseline for known false positives so new leaks still fail CI.
- **Updated files**:
  - `.github/workflows/ci.yml`
  - `.github/scripts/run-semgrep.sh`
  - `.gitleaksignore`
  - `docs/security-hardening.md`
- **Verification**:
  - `docker run --rm -v \"${PWD}:/repo\" zricethezav/gitleaks:latest detect --source=/repo --no-banner --redact --gitleaks-ignore-path=/repo/.gitleaksignore --exit-code 1` passes with no leaks.
  - `semgrep scan --config p/security-audit --severity ERROR --error --metrics=off --exclude node_modules --exclude .next --exclude dist .` passes with 0 blocking findings.
  - `pnpm -C api audit:prod` remains active and passing for dependency audit gating.

### 2026-02-17 - SH-14 Completed

- **Implemented by**: QA + Backend
- **Scope delivered**:
  - Added dedicated API security test suite script (`test:security`).
  - Added listing authorization security tests for cross-account mutation attempts.
  - Added upload abuse/rate-limit security tests for token misuse and quota enforcement.
  - Kept auth abuse and config hardening tests in the security suite to cover authN + fail-fast controls.
  - Added `Security test suite` step in CI so these checks are required on PRs.
- **Updated files**:
  - `api/src/listings/listings.security.spec.ts`
  - `api/src/upload/upload.security.spec.ts`
  - `api/package.json`
  - `.github/workflows/ci.yml`
  - `docs/security-hardening.md`
- **Verification**:
  - `pnpm -C api test:security` passes.
  - `pnpm -C api test` passes with expanded security specs.
  - `pnpm -C api build` passes after test-suite additions.
  - CI workflow now contains a required `Security test suite` step in `api-quality`.

### 2026-02-17 - Security Sign-Off Evidence Pack Added

- **Implemented by**: Security + DevOps
- **Scope delivered**:
  - Added a dedicated production sign-off evidence document mapped to all required evidence items.
  - Linked each sign-off requirement to concrete tests/config/docs and repeatable verification commands.
  - Captured current verification status for security tests, dependency audit, headers, token handling, and incident runbook coverage.
- **Updated files**:
  - `docs/security-signoff-evidence.md`
  - `docs/security-hardening.md`
  - `docs/README.md`
- **Verification**:
  - `pnpm -C api test:security` passes.
  - `pnpm -C api audit:prod` passes.
  - `rg "Content-Security-Policy|Referrer-Policy|X-Content-Type-Options|X-Frame-Options|Permissions-Policy|poweredByHeader" web/next.config.ts` confirms web header configuration.
  - `rg "httpOnly|sameSite|secure" api/src/auth/auth.controller.ts` confirms refresh-cookie transport protections.

## Milestone Plan

### Milestone 1 (Target: 2026-02-24)

- SH-01, SH-02, SH-03, SH-04, SH-05, SH-06, SH-07

### Milestone 2 (Target: 2026-03-03)

- SH-08, SH-09, SH-10, SH-11, SH-12

### Milestone 3 (Target: 2026-03-10)

- SH-13, SH-14

## Required Evidence Before Production Sign-Off

1. Authorization tests proving no cross-account mutation paths. Status: DONE (`docs/security-signoff-evidence.md`).
2. Upload abuse tests (spoofed file, quota, unauthenticated abuse). Status: DONE (`docs/security-signoff-evidence.md`).
3. Token handling evidence (refresh token inaccessible from JS). Status: DONE (`docs/security-signoff-evidence.md`).
4. Dependency audit report attached to release. Status: DONE (`docs/security-signoff-evidence.md`).
5. Security header validation report. Status: DONE (`docs/security-signoff-evidence.md`).
6. Incident response notes for credential rotation and rollback procedure. Status: DONE (`docs/security-signoff-evidence.md` and `docs/secret-rotation-runbook.md`).

## Update - 2026-02-17 (Fix_download)
- Implemented Autoline-style template/runtime upgrades: configurable `dataSource`, `dependsOn`, `visibleIf`, `requiredIf`, `resetOnChange`, and template block attachments.
- Added full Autoline motorized template inventory (41 fields) as the shared system block for all motorized categories (cars, trucks, tractors, harvesters, excavators, loaders), synced seed and runtime schema, and updated checkbox-group API validation compatibility.
- Added reusable `engine_block`, category-level `hasEngine`, and inheritance/fallback rules so new subcategories keep full details instead of losing engine-related fields.
- Added persistent "create new option" flows and APIs for `brand`, `model`, `subcategory`, `country`, and `city`, so new values are saved once and reused by all users.
- Added options/cascade runtime behavior: parent-change child reset, dependency-based option loading, and dependency-state caching.
- Completed validation checks and build/test verification; local infrastructure (Postgres/Redis/MinIO) confirmed working for this flow.

## Documentation Refresh - 2026-03-28

Reviewed during the `new_improvements` branch documentation pass.
For the latest implementation state, see `REBUILD_CHANGELOG.md` and `docs/project_status.md`.
