-- +goose Up
CREATE TABLE trips (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(100) NOT NULL,
    start_date    DATE NOT NULL,
    end_date      DATE NOT NULL,
    duration_days INT NOT NULL,
    invite_code   TEXT NOT NULL UNIQUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (start_date <= end_date),
    CHECK (duration_days BETWEEN 1 AND end_date - start_date + 1)
);

CREATE TABLE trip_members (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(50) NOT NULL,
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trip_id, user_id)
);

-- ชื่อที่แสดงห้ามซ้ำในทริปเดียวกัน (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
CREATE UNIQUE INDEX trip_members_trip_display_name ON trip_members (trip_id, lower(display_name));

-- +goose Down
DROP TABLE IF EXISTS trip_members;
DROP TABLE IF EXISTS trips;
