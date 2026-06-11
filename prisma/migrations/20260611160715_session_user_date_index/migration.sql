-- DropIndex
DROP INDEX "Session_userId_idx";

-- CreateIndex
CREATE INDEX "Session_userId_date_idx" ON "Session"("userId", "date");
