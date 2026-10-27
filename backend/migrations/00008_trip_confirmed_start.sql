-- +goose Up
-- Confirmed Dates = Window ที่ผู้จัดเลือก (เก็บแค่วันเริ่ม ยาว duration_days วัน) — NULL = กำลังหาวัน
ALTER TABLE trips ADD COLUMN confirmed_start DATE;
ALTER TABLE trips ADD CONSTRAINT trips_confirmed_fits
    CHECK (confirmed_start IS NULL OR (confirmed_start >= start_date AND confirmed_start + duration_days - 1 <= end_date));

-- +goose Down
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_confirmed_fits;
ALTER TABLE trips DROP COLUMN IF EXISTS confirmed_start;
