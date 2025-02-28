-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_next_occurrence ON recurring_transactions;
DROP TRIGGER IF EXISTS set_updated_at ON recurring_transactions;
DROP FUNCTION IF EXISTS calculate_next_occurrence();

-- Create or update recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    account_id UUID NOT NULL REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    transfer_account_id UUID REFERENCES accounts(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    next_occurrence TIMESTAMP WITH TIME ZONE NOT NULL,
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    week_of_month INTEGER CHECK (week_of_month BETWEEN 1 AND 5),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create or replace function to calculate next occurrence
CREATE OR REPLACE FUNCTION calculate_next_occurrence()
RETURNS TRIGGER AS $$
BEGIN
    -- Set initial next_occurrence to start_date if not provided
    IF NEW.next_occurrence IS NULL THEN
        NEW.next_occurrence := NEW.start_date;
    END IF;

    -- Validate end_date is after start_date if provided
    IF NEW.end_date IS NOT NULL AND NEW.end_date <= NEW.start_date THEN
        RAISE EXCEPTION 'end_date must be after start_date';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for next_occurrence
CREATE TRIGGER set_next_occurrence
    BEFORE INSERT OR UPDATE ON recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_next_occurrence();

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
