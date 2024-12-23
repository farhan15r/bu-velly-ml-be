-- Active: 1717313701864@@127.0.0.1@5432@db_ml_velly
CREATE TABLE predictions (
    id VARCHAR PRIMARY KEY,
    upload_url VARCHAR NOT NULL,
    result_url VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
)

DROP TABLE IF EXISTS predictions

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
)

DROP TABLE IF EXISTS users

CREATE TABLE distance_objects (
    id SERIAL PRIMARY KEY,
    prediction_id VARCHAR NOT NULL,
    object_source_index INTEGER NOT NULL,
    object_target_index INTEGER NOT NULL,
    distance FLOAT NOT NULL
);

DROP TABLE IF EXISTS distance_objects

CREATE TABLE prediction_labels (
    id SERIAL PRIMARY KEY,
    prediction_id VARCHAR NOT NULL,
    object_index INTEGER NOT NULL,
    label VARCHAR NOT NULL
);

DROP TABLE IF EXISTS prediction_labels