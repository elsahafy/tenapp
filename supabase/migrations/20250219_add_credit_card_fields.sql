-- Add credit card specific fields to accounts table
ALTER TABLE accounts
ADD COLUMN min_payment_amount numeric,
ADD COLUMN min_payment_percentage numeric,
ADD COLUMN emi_enabled boolean DEFAULT false;

-- Add check constraints
ALTER TABLE accounts
ADD CONSTRAINT min_payment_amount_check CHECK (min_payment_amount >= 0),
ADD CONSTRAINT min_payment_percentage_check CHECK (min_payment_percentage >= 0 AND min_payment_percentage <= 100),
ADD CONSTRAINT interest_rate_check CHECK (interest_rate >= 0 AND interest_rate <= 100);
