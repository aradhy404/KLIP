CREATE TABLE contacts (
    owner_id   UUID NOT NULL REFERENCES users(id),
    phone      TEXT NOT NULL,
    name       TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (owner_id, phone)
);