-- +goose Up
-- เวลาที่ผู้จัดขยาย Date Range ครั้งล่าสุด (มีวันใหม่) — ใครเคย Push ก่อนหน้านี้ควรถูกชวน Push อีกครั้ง
ALTER TABLE trips ADD COLUMN date_range_changed_at TIMESTAMPTZ;

-- +goose Down
ALTER TABLE trips DROP COLUMN IF EXISTS date_range_changed_at;
