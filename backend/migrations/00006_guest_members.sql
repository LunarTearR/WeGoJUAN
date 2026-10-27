-- +goose Up
-- Guest = สมาชิกที่ไม่มีบัญชี จำได้จาก token ในเครื่องที่ใช้เข้าร่วม (เก็บแค่ hash)
ALTER TABLE trip_members ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE trip_members ADD COLUMN guest_token_hash TEXT;
ALTER TABLE trip_members ADD CONSTRAINT trip_members_user_xor_guest
    CHECK ((user_id IS NULL) <> (guest_token_hash IS NULL));
CREATE UNIQUE INDEX trip_members_trip_guest ON trip_members (trip_id, guest_token_hash)
    WHERE guest_token_hash IS NOT NULL;

-- +goose Down
DELETE FROM trip_members WHERE user_id IS NULL;
DROP INDEX IF EXISTS trip_members_trip_guest;
ALTER TABLE trip_members DROP CONSTRAINT IF EXISTS trip_members_user_xor_guest;
ALTER TABLE trip_members DROP COLUMN IF EXISTS guest_token_hash;
ALTER TABLE trip_members ALTER COLUMN user_id SET NOT NULL;
