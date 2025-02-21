-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Service role can read system user" ON public.users;
DROP POLICY IF EXISTS "Allow service role to insert system user" ON public.users;
DROP POLICY IF EXISTS "Allow service role to insert system categories" ON public.categories;
DROP POLICY IF EXISTS "Allow users to read system categories" ON public.categories;

-- Create policies for users table
CREATE POLICY "Users can read own data" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid() OR id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Allow service role to insert system user" ON public.users
FOR INSERT TO authenticated
WITH CHECK (id = '00000000-0000-0000-0000-000000000000');

-- Create policies for categories table
CREATE POLICY "Allow service role to insert system categories" ON public.categories
FOR INSERT TO authenticated
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Allow users to read system categories" ON public.categories
FOR SELECT TO authenticated
USING (user_id = '00000000-0000-0000-0000-000000000000' OR user_id = auth.uid());

-- First, clean up any existing system user
DO $$
BEGIN
  -- Delete from public.users first (due to foreign key)
  DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000';
  
  -- Then delete from auth.users
  DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';
  
  -- Also delete any user with the system email to handle the unique constraint
  DELETE FROM auth.users WHERE email = 'system@tenapp.local';
END $$;

-- Then insert the system user into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  is_sso_user
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'system@tenapp.local',
  '$2a$10$Q7HSHM.U3HVq3UfNvGKH.eYJazcAkwEeGH0S9H1XeY3H9kKg3U5.e', -- Random hash, login not allowed
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  false
);

-- Finally, insert into public.users
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@tenapp.local',
  'System',
  'User',
  NOW(),
  NOW()
);
