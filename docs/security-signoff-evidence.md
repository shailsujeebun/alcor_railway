# Security Production Sign-Off Evidence

Date: 2026-02-17
Branch: `testing`
Reference commit: `a547d91`

## Purpose

This document captures the evidence required by `docs/security-hardening.md` for production security sign-off.

## Evidence Matrix

| Item | Requirement | Status | Evidence |
|---|---|---|---|
| E-01 | Authorization tests proving no cross-account mutation paths | DONE | `api/src/listings/listings.security.spec.ts`, `pnpm -C api test:security` |
| E-02 | Upload abuse tests (spoofed file, quota, unauthenticated abuse) | DONE | `api/src/upload/upload.security.spec.ts`, `pnpm -C api test:security` |
| E-03 | Token handling evidence (refresh token inaccessible from JS) | DONE | `api/src/auth/auth.controller.ts` (`httpOnly: true`, `sameSite: 'strict'`, secure cookie policy), SH-06 refresh flow tests |
| E-04 | Dependency audit report attached to release | DONE | `pnpm -C api audit:prod` (no high/critical vulnerabilities) |
| E-05 | Security header validation report | DONE | `api/src/main.ts` (`helmet`), `web/next.config.ts` (`CSP`, `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Permissions-Policy`) |
| E-06 | Incident response notes for credential rotation and rollback | DONE | `docs/secret-rotation-runbook.md` |

## Verification Run (2026-02-17)

1. `pnpm -C api test:security`
   - Result: PASS (4 suites, 16 tests).
2. `pnpm -C api audit:prod`
   - Result: PASS (`No known vulnerabilities found`).
3. `rg "Content-Security-Policy|Referrer-Policy|X-Content-Type-Options|X-Frame-Options|Permissions-Policy|poweredByHeader" web/next.config.ts`
   - Result: headers and `poweredByHeader: false` confirmed.
4. `rg "httpOnly|sameSite|secure" api/src/auth/auth.controller.ts`
   - Result: refresh cookie security attributes confirmed.
5. `rg "rollback|incident|Evidence to Store" docs/secret-rotation-runbook.md`
   - Result: rollback and incident handling guidance confirmed.

## Notes

- Re-run this verification block before each release candidate and attach command outputs to the release artifact.

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
