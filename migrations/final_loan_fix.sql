-- Update all Personal Loan accounts to be properly categorized
UPDATE accounts 
SET 
  type = 'loan',
  current_balance = CASE 
    WHEN current_balance > 0 THEN -current_balance 
    ELSE current_balance 
  END,
  updated_at = NOW()
WHERE 
  name ILIKE '%Personal Loan%' 
  AND type = 'investment';

-- Verify the changes
SELECT id, name, type, current_balance, is_active 
FROM accounts 
WHERE name ILIKE '%Personal Loan%';
