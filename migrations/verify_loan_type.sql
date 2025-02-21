-- Check the current state of the Personal Loan account
SELECT id, name, type, current_balance, is_active 
FROM accounts 
WHERE name ILIKE '%Personal Loan%';

-- Force update the account type to loan and ensure negative balance
UPDATE accounts 
SET 
  type = 'loan'::account_type,  -- Cast to enum type
  current_balance = CASE 
    WHEN current_balance > 0 THEN -current_balance 
    ELSE current_balance 
  END
WHERE name ILIKE '%Personal Loan%';

-- Verify the changes
SELECT id, name, type, current_balance, is_active 
FROM accounts 
WHERE name ILIKE '%Personal Loan%';
