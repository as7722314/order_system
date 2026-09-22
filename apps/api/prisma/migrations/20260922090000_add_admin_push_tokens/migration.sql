CREATE TABLE "admin_push_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_push_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_push_tokens_token_key" ON "admin_push_tokens"("token");
CREATE INDEX "admin_push_tokens_user_id_idx" ON "admin_push_tokens"("user_id");

ALTER TABLE "admin_push_tokens"
ADD CONSTRAINT "admin_push_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
