-- Active: 1692371058716@@127.0.0.1@5432@db_ml_velly@public
CREATE TABLE predictions (
    id VARCHAR PRIMARY KEY,
    upload_url VARCHAR NOT NULL,
    result_url VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
)

DROP TABLE IF EXISTS detections

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
)

DROP TABLE IF EXISTS users