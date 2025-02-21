-- Fix all loan balances to be negative
UPDATE accounts 
SET 
  current_balance = CASE 
    WHEN type = 'loan' AND current_balance > 0 THEN -current_balance 
    ELSE current_balance 
  END,
  updated_at = NOW()
WHERE 
  type = 'loan' 
  AND current_balance > 0;

-- Verify the changes
SELECT id, name, type, current_balance, is_active 
FROM accounts 
WHERE type = 'loan'
ORDER BY name;
