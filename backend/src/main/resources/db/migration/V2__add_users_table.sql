CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user with password: 'password'
-- BCrypt hash of 'password'
INSERT INTO users (id, username, password, role) 
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'admin', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HCGKK2T1/P4I/4EwQG.nO', 'ROLE_ADMIN');
