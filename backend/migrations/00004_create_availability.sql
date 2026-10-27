-- +goose Up
-- Personal Calendar: วันที่ไม่มีแถว = Unknown (ไม่ใช่ว่าง)
CREATE TABLE availability (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day     DATE NOT NULL,
    status  TEXT NOT NULL CHECK (status IN ('free', 'busy')),
    PRIMARY KEY (user_id, day)
);

-- +goose Down
DROP TABLE IF EXISTS availability;
