-- First, let's check the current state of the Personal Loan account
SELECT id, name, type, current_balance, is_active 
FROM accounts 
WHERE name ILIKE '%Personal Loan%';

-- Update the account to ensure it's properly set as a loan type and active
UPDATE accounts 
SET 
  type = 'loan',
  current_balance = -ABS(current_balance),  -- Make sure the balance is negative
  is_active = true
WHERE 
  name ILIKE '%Personal Loan%';

-- Verify the changes
SELECT id, name, type, current_balance, is_active 
FROM accounts 
WHERE name ILIKE '%Personal Loan%';
