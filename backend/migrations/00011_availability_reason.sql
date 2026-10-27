-- +goose Up
-- Reason: ข้อความส่วนตัวว่าทำไมไม่ว่าง — มีได้เฉพาะวันที่ไม่ว่าง และไม่เคยออกจากปฏิทินส่วนตัว
ALTER TABLE availability ADD COLUMN reason VARCHAR(60);
ALTER TABLE availability ADD CONSTRAINT availability_reason_only_busy
    CHECK (reason IS NULL OR status = 'busy');

-- +goose Down
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_reason_only_busy;
ALTER TABLE availability DROP COLUMN IF EXISTS reason;
