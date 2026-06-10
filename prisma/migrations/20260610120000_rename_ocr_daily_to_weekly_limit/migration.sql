-- Rename the per-user OCR override from a daily to a weekly limit.
-- Nullable column with no production data yet, so the rename preserves it cleanly.
ALTER TABLE "User" RENAME COLUMN "ocrDailyLimit" TO "ocrWeeklyLimit";
