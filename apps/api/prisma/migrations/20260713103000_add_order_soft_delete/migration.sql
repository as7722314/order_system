ALTER TABLE "orders" ADD COLUMN "deleted_reason" TEXT;
ALTER TABLE "orders" ADD COLUMN "deleted_by_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "orders_deleted_at_idx" ON "orders"("deleted_at");

ALTER TABLE "orders" ADD CONSTRAINT "orders_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
