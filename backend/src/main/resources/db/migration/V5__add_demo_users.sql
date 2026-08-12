-- Insert demo rider and customer users with password: 'password'
INSERT INTO users (id, username, password, role) 
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'rider', '$2a$10$9v3KW5ySzzVniF.Pdhik5uhL0sjDBdOoAcgS6gFxJ8KMosmqInD5a', 'ROLE_DELIVERY'),
  ('33333333-3333-3333-3333-333333333333', 'alice', '$2a$10$9v3KW5ySzzVniF.Pdhik5uhL0sjDBdOoAcgS6gFxJ8KMosmqInD5a', 'ROLE_CUSTOMER')
ON CONFLICT (username) DO NOTHING;
