# Commit Sequence And Checkpoints

## Ordered commits
1. `ba586c3` - `fix: sync post-ad form with admin template builder`
2. `7694b4a` - `fix: show full engine block fields in post-ad form`
3. `2503726` - `fix: new fields in admin template builder start blank`
4. `669a47b` - `restore: recover Feb 23 marketplace updates after reset`
5. `f28184a` - `feat: create form_block table and update form_field schema`
6. `dc5832e` - `chore: ignore .claude and remove nested worktree gitlink`

## Suggested replay checkpoints
- After `ba586c3`: run backend tests for categories/template resolution.
- After `7694b4a`: verify engine categories include `engine_block` fields.
- After `2503726`: verify new builder fields render with `{}` defaults.
- After `669a47b`: run app smoke tests (API + web) because this is a broad recovery commit.
- After `f28184a`: run prisma migrate + regenerate client.
- After `dc5832e`: verify repo hygiene changes in `.gitignore`.

## Commit authorship and dates
Generated from `git show --no-patch --pretty=fuller` for each commit in this range.
