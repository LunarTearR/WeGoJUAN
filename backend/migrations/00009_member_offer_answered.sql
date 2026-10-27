-- +goose Up
-- Confirmed Dates (วันเริ่ม) ที่ User ตอบคำถาม "ทำเครื่องหมายไม่ว่างในปฏิทินไหม" ไปแล้ว — เปลี่ยนวันยืนยัน = ถามใหม่
ALTER TABLE trip_members ADD COLUMN offer_answered_start DATE;

-- +goose Down
ALTER TABLE trip_members DROP COLUMN IF EXISTS offer_answered_start;
