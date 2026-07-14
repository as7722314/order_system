CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "store_settings" ("id", "is_open")
VALUES ('store', true)
ON CONFLICT ("id") DO NOTHING;