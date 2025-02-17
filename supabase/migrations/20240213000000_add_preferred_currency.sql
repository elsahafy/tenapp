-- Add preferred_currency column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_currency currency_code DEFAULT 'USD'::currency_code;
