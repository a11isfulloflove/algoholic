ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User" SET "username" = COALESCE(LOWER("name"), split_part("email", '@', 1));

UPDATE "User" SET "username" = split_part("email", '@', 1)
WHERE "username" !~ '^[a-z0-9_]+$';

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

ALTER TABLE "User" DROP COLUMN "email";
