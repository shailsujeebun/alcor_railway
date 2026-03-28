# Translation Data Privacy Policy

## Purpose

This policy defines what text is allowed to be sent to external translation providers.

## Environment Controls

- `TRANSLATION_EXTERNAL_ENABLED`:
  - `true` (default): external translation route is enabled.
  - `false`: route is disabled and returns `503`.
- `TRANSLATION_ALLOW_PII`:
  - `false` (default): blocks translation of text that appears to contain personal/sensitive data.
  - `true`: allows such text when explicitly approved.

## Allowed External Translation Content

- Public, non-sensitive UI labels.
- Generic product copy and navigation text.
- Static hints/placeholders that do not contain personal data.

## Disallowed by Default

- User-entered free text that may include personal data.
- Contact details (emails, phone numbers, URLs tied to user identity).
- Credentials, tokens, secrets, or account metadata.
- Private support messages or conversations.

## Product Behavior

- If external translation is disabled, translation requests fail closed (`503`) and UI keeps original text.
- If sensitive patterns are detected and `TRANSLATION_ALLOW_PII=false`, the text is not sent externally.

## Ownership

- Security + Product approve any exceptions to this policy.
- Engineering must keep route safeguards aligned with this document.

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
