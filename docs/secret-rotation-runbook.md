# Secret Rotation Runbook

## Scope

This runbook covers rotation for:

- `JWT_SECRET`
- `UPLOAD_GUEST_TOKEN_SECRET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

## Prerequisites

- Access to the production secret manager.
- Access to deployment pipeline for API rollout.
- Incident contact list for backend + DevOps on-call.

## Rotation Steps

1. Create new secrets in secret manager.
2. Ensure new values are high entropy:
   - `JWT_SECRET`: at least 32 chars.
   - `UPLOAD_GUEST_TOKEN_SECRET`: at least 32 chars and different from `JWT_SECRET`.
   - `S3_SECRET_ACCESS_KEY`: at least 24 chars.
3. Update deployment environment variables for API.
4. Deploy API to staging and verify startup health.
5. Run auth smoke tests in staging:
   - login
   - token refresh
   - logout
   - upload flow
6. Promote the same secret set to production.
7. Deploy API to production.
8. Verify production health checks and auth/upload smoke tests.
9. Invalidate old sessions if rotating `JWT_SECRET`:
   - force re-authentication for all users.
10. Confirm no startup validation errors in logs.

## Rollback

1. Revert to previous secret versions in secret manager.
2. Redeploy API.
3. Re-run smoke tests.
4. Open an incident if rollback fails.

## Evidence to Store

- Deployment ID / commit SHA.
- Timestamp of secret version change.
- Smoke test results.
- Any session invalidation notice sent to users.

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
