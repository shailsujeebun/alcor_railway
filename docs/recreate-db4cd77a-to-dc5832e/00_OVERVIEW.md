# Recreate Changes: `db4cd77a23b4d2bcdef76373d4ae2779e527b09d` -> `dc5832ecacd3a9e257e89cf38ff4b325c8e6dd43`

## Scope
This document set captures all commits after `db4cd77a23b4d2bcdef76373d4ae2779e527b09d` up to and including `dc5832ecacd3a9e257e89cf38ff4b325c8e6dd43`.

Commit sequence in order:
1. `ba586c323686998ed9b5fdfb736ef18845fc4d64`
2. `7694b4a13d82bf300046aeba21092f59e4fc67e9`
3. `25037265802848ac5120aa0c6a418031da77136d`
4. `669a47bde65561f662f321f7aef0a7271aa92ae2`
5. `f28184acb769c4dc3a8b7be904683b9c0cb1f2ba`
6. `dc5832ecacd3a9e257e89cf38ff4b325c8e6dd43`

## Files in this folder
- `00_OVERVIEW.md` (this file)
- `01_COMMIT_SEQUENCE_AND_CHECKPOINTS.md`
- `02_FULL_RANGE_DIFF.md`
- `commit_01_ba586c3.md`
- `commit_02_7694b4a.md`
- `commit_03_2503726.md`
- `commit_04_669a47b.md`
- `commit_05_f28184a.md`
- `commit_06_dc5832e.md`

## One-to-one replay options
### Option A: Exact replay via cherry-pick (preferred when commits are reachable)
```bash
git cherry-pick ba586c323686998ed9b5fdfb736ef18845fc4d64 \
  7694b4a13d82bf300046aeba21092f59e4fc67e9 \
  25037265802848ac5120aa0c6a418031da77136d \
  669a47bde65561f662f321f7aef0a7271aa92ae2 \
  f28184acb769c4dc3a8b7be904683b9c0cb1f2ba \
  dc5832ecacd3a9e257e89cf38ff4b325c8e6dd43
```

### Option B: Manual recreation in older version
Use `commit_*.md` files in order. Each file contains:
- exact commit metadata
- file list and change stats
- full patch (`git show --no-color`) in a fenced `diff` block

### Option C: Apply the full range diff
Use `02_FULL_RANGE_DIFF.md` and apply equivalent edits from the unified diff for:
```bash
git diff --binary db4cd77a23b4d2bcdef76373d4ae2779e527b09d dc5832ecacd3a9e257e89cf38ff4b325c8e6dd43
```

## Validation checklist
1. Run DB migrations created in this range.
2. Re-seed data paths modified in this range (`api/prisma/seed.ts`, `api/prisma/seed-all/core.ts`).
3. Verify admin template builder behavior and category template propagation.
4. Verify post-ad dynamic form behavior for engine categories.
5. Confirm `.gitignore` includes `.claude/` and no nested gitlink remains.
