-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete their own accounts" ON accounts;

-- Create new delete policy
CREATE POLICY "Users can delete their own accounts"
ON accounts
FOR DELETE
USING (auth.uid() = user_id);

-- Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'accounts'
ORDER BY policyname;
