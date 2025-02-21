-- Check existing RLS policies
SELECT *
FROM pg_policies
WHERE tablename = 'accounts';

-- Create or replace the RLS policy for deleting accounts
CREATE POLICY "Enable delete for users based on user_id" ON "accounts"
    FOR DELETE
    USING (auth.uid() = user_id);

-- Make sure RLS is enabled on the accounts table
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
