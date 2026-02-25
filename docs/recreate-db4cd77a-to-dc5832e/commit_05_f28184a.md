# Commit 5: f28184a

## Metadata
```text
commit f28184acb769c4dc3a8b7be904683b9c0cb1f2ba
Author:     Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
AuthorDate: Tue Feb 24 09:47:44 2026 +0100
Commit:     Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
CommitDate: Tue Feb 24 09:47:44 2026 +0100

    feat: create form_block table and update form_field schema
```

## File Changes
```text
f28184a feat: create form_block table and update form_field schema
 .claude/worktrees/nostalgic-gauss                  |  1 +
 .../20260224094000_create_form_block/migration.sql | 10 ++++++
 .../migration.sql                                  |  3 ++
 .../migration.sql                                  | 39 ++++++++++++++++++++++
 api/prisma/schema.prisma                           |  2 +-
 5 files changed, 54 insertions(+), 1 deletion(-)
```

## Full Patch
```diff
commit f28184acb769c4dc3a8b7be904683b9c0cb1f2ba
Author: Seetaram Sarvesh <sarvesh.seetaram@code.berlin>
Date:   Tue Feb 24 09:47:44 2026 +0100

    feat: create form_block table and update form_field schema

diff --git a/.claude/worktrees/nostalgic-gauss b/.claude/worktrees/nostalgic-gauss
new file mode 160000
index 0000000..db4cd77
--- /dev/null
+++ b/.claude/worktrees/nostalgic-gauss
@@ -0,0 +1 @@
+Subproject commit db4cd77a23b4d2bcdef76373d4ae2779e527b09d
diff --git a/api/prisma/migrations/20260224094000_create_form_block/migration.sql b/api/prisma/migrations/20260224094000_create_form_block/migration.sql
new file mode 100644
index 0000000..00feb61
--- /dev/null
+++ b/api/prisma/migrations/20260224094000_create_form_block/migration.sql
@@ -0,0 +1,10 @@
+CREATE TABLE IF NOT EXISTS "form_block" (
+  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
+  "name" TEXT NOT NULL,
+  "is_system" BOOLEAN NOT NULL DEFAULT false,
+  "fields" JSONB NOT NULL DEFAULT '[]'::jsonb,
+  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+  CONSTRAINT "form_block_pkey" PRIMARY KEY ("id"),
+  CONSTRAINT "form_block_name_key" UNIQUE ("name")
+);
diff --git a/api/prisma/migrations/20260224094500_form_block_id_text/migration.sql b/api/prisma/migrations/20260224094500_form_block_id_text/migration.sql
new file mode 100644
index 0000000..6211640
--- /dev/null
+++ b/api/prisma/migrations/20260224094500_form_block_id_text/migration.sql
@@ -0,0 +1,3 @@
+ALTER TABLE "form_block"
+  ALTER COLUMN "id" DROP DEFAULT,
+  ALTER COLUMN "id" TYPE TEXT USING "id"::text;
diff --git a/api/prisma/migrations/20260224095500_sync_formfield_and_model/migration.sql b/api/prisma/migrations/20260224095500_sync_formfield_and_model/migration.sql
new file mode 100644
index 0000000..9f338ce
--- /dev/null
+++ b/api/prisma/migrations/20260224095500_sync_formfield_and_model/migration.sql
@@ -0,0 +1,39 @@
+-- Align DB schema with current Prisma models used by seed/runtime
+ALTER TABLE "form_block" ALTER COLUMN "updated_at" DROP DEFAULT;
+
+ALTER TABLE "form_field"
+  ADD COLUMN IF NOT EXISTS "config" JSONB NOT NULL DEFAULT '{}',
+  ADD COLUMN IF NOT EXISTS "required_if" JSONB NOT NULL DEFAULT '{}',
+  ADD COLUMN IF NOT EXISTS "section" TEXT;
+
+CREATE TABLE IF NOT EXISTS "model" (
+  "id" TEXT NOT NULL,
+  "name" TEXT NOT NULL,
+  "brand_id" TEXT,
+  "category_id" BIGINT,
+  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
+  "updated_at" TIMESTAMP(3) NOT NULL,
+  CONSTRAINT "model_pkey" PRIMARY KEY ("id")
+);
+
+CREATE INDEX IF NOT EXISTS "model_brand_id_idx" ON "model"("brand_id");
+CREATE INDEX IF NOT EXISTS "model_category_id_idx" ON "model"("category_id");
+CREATE UNIQUE INDEX IF NOT EXISTS "model_name_brand_id_category_id_key" ON "model"("name", "brand_id", "category_id");
+
+DO $$ BEGIN
+  ALTER TABLE "model"
+    ADD CONSTRAINT "model_brand_id_fkey"
+    FOREIGN KEY ("brand_id") REFERENCES "Brand"("id")
+    ON DELETE SET NULL ON UPDATE CASCADE;
+EXCEPTION
+  WHEN duplicate_object THEN NULL;
+END $$;
+
+DO $$ BEGIN
+  ALTER TABLE "model"
+    ADD CONSTRAINT "model_category_id_fkey"
+    FOREIGN KEY ("category_id") REFERENCES "category"("category_id")
+    ON DELETE SET NULL ON UPDATE CASCADE;
+EXCEPTION
+  WHEN duplicate_object THEN NULL;
+END $$;
diff --git a/api/prisma/schema.prisma b/api/prisma/schema.prisma
index d3dde3a..8313e08 100644
--- a/api/prisma/schema.prisma
+++ b/api/prisma/schema.prisma
@@ -342,7 +342,7 @@ model FieldOption {
 }
 
 model FormBlock {
-  id        String   @id @default(uuid())
+  id        String   @id
   name      String   @unique
   isSystem  Boolean  @default(false) @map("is_system")
   fields    Json     @default("[]")
```
