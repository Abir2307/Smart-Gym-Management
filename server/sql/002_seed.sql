CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed only the admin account; all other users will register via the app
INSERT INTO gym_users (id, full_name, email, password_hash, role)
VALUES
  ('usr-super-admin', 'Super Admin', 'admin@pulseforge.test', crypt('Gym@1234', gen_salt('bf')), 'Super Admin')
ON CONFLICT (email) DO NOTHING;