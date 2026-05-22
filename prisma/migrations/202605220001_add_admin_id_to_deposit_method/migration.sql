ALTER TABLE "st_deposit_method"
ADD COLUMN IF NOT EXISTS "admin_id" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'st_deposit_method_admin_id_fkey'
  ) THEN
    ALTER TABLE "st_deposit_method"
    ADD CONSTRAINT "st_deposit_method_admin_id_fkey"
    FOREIGN KEY ("admin_id") REFERENCES "mikhbotam_id"("u_id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "st_deposit_method_admin_id_idx"
ON "st_deposit_method"("admin_id");
