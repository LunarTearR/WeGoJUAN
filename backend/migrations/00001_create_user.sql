-- +goose Up
CREATE TABLE
    if not exists users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        display_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
    );

-- +goose Down
DROP TABLE IF EXISTS users;