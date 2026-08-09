ALTER TABLE "expenses"
ADD COLUMN "category" TEXT NOT NULL DEFAULT '日常消耗';

CREATE INDEX "expenses_category_idx" ON "expenses"("category");
