-- Drop legacy project_status values; only Active | Pause | Archive are valid (no remapping).
UPDATE "project_main"
SET "project_status" = NULL
WHERE "project_status" IS NOT NULL
  AND TRIM("project_status") NOT IN ('Active', 'Pause', 'Archive');
