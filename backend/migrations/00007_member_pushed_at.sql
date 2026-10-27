-- +goose Up
-- เวลาที่ User Push จากปฏิทินส่วนตัวเข้าทริปครั้งล่าสุด (NULL = ยังไม่เคย)
ALTER TABLE trip_members ADD COLUMN pushed_at TIMESTAMPTZ;

-- +goose Down
ALTER TABLE trip_members DROP COLUMN IF EXISTS pushed_at;
