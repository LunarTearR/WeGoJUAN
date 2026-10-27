-- +goose Up
-- Mark ของสมาชิกในทริป (สำเนา snapshot — ทริปไม่อ่านปฏิทินส่วนตัวโดยตรง ดู docs/adr/0001)
CREATE TABLE trip_marks (
    member_id UUID NOT NULL REFERENCES trip_members(id) ON DELETE CASCADE,
    day       DATE NOT NULL,
    status    TEXT NOT NULL CHECK (status IN ('free', 'busy')),
    PRIMARY KEY (member_id, day)
);

-- +goose Down
DROP TABLE IF EXISTS trip_marks;
