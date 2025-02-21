-- Create recurring transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    amount DECIMAL(19,4) NOT NULL,
    currency currency_code NOT NULL,
    description TEXT,
    frequency recurring_frequency NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    last_generated DATE,
    next_occurrence DATE,
    type transaction_type NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    transfer_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    day_of_month INTEGER,
    day_of_week INTEGER,
    week_of_month INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(active);

-- Add necessary columns to recurring_transactions
ALTER TABLE recurring_transactions
ADD COLUMN IF NOT EXISTS day_of_month INTEGER,
ADD COLUMN IF NOT EXISTS day_of_week INTEGER,
ADD COLUMN IF NOT EXISTS week_of_month INTEGER;

-- Add quarterly to frequency type if not exists
ALTER TYPE recurring_frequency ADD VALUE IF NOT EXISTS 'quarterly';

-- Create function to calculate next occurrence
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
    p_frequency recurring_frequency,
    p_last_generated DATE,
    p_start_date DATE,
    p_day_of_month INTEGER DEFAULT NULL,
    p_day_of_week INTEGER DEFAULT NULL,
    p_week_of_month INTEGER DEFAULT NULL
) RETURNS DATE AS $$
DECLARE
    base_date DATE;
    next_date DATE;
BEGIN
    base_date := COALESCE(p_last_generated, p_start_date);
    
    -- Calculate the next date based on frequency
    next_date := CASE p_frequency
        WHEN 'daily' THEN base_date + INTERVAL '1 day'
        WHEN 'weekly' THEN 
            CASE 
                WHEN p_day_of_week IS NOT NULL THEN 
                    base_date + (7 + p_day_of_week - EXTRACT(DOW FROM base_date))::INTEGER % 7 * INTERVAL '1 day'
                ELSE base_date + INTERVAL '1 week'
            END
        WHEN 'monthly' THEN
            CASE
                WHEN p_day_of_month IS NOT NULL THEN
                    -- Move to next month and set specific day
                    (DATE_TRUNC('month', base_date) + INTERVAL '1 month' + (p_day_of_month - 1) * INTERVAL '1 day')::DATE
                WHEN p_week_of_month IS NOT NULL AND p_day_of_week IS NOT NULL THEN
                    -- Calculate specific week and day of week in next month
                    (DATE_TRUNC('month', base_date) + INTERVAL '1 month' + 
                     ((p_week_of_month - 1) * 7 + (7 + p_day_of_week - EXTRACT(DOW FROM DATE_TRUNC('month', base_date)))::INTEGER % 7) * INTERVAL '1 day')::DATE
                ELSE
                    base_date + INTERVAL '1 month'
            END
        WHEN 'quarterly' THEN base_date + INTERVAL '3 months'
        WHEN 'yearly' THEN base_date + INTERVAL '1 year'
        ELSE base_date + INTERVAL '1 month' -- Default to monthly if unknown
    END;

    -- Ensure we don't go backwards
    RETURN GREATEST(next_date, base_date + INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql;

-- Create function to update next_occurrence
CREATE OR REPLACE FUNCTION update_next_occurrence()
RETURNS TRIGGER AS $$
BEGIN
    NEW.next_occurrence := calculate_next_occurrence(
        NEW.frequency, 
        NEW.last_generated, 
        NEW.start_date,
        NEW.day_of_month,
        NEW.day_of_week,
        NEW.week_of_month
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on the table
DROP TRIGGER IF EXISTS update_next_occurrence_trigger ON recurring_transactions;
CREATE TRIGGER update_next_occurrence_trigger
    BEFORE INSERT OR UPDATE
    ON recurring_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_next_occurrence();

-- Initialize next_occurrence for existing records
UPDATE recurring_transactions
SET next_occurrence = calculate_next_occurrence(
    frequency, 
    last_generated, 
    start_date,
    day_of_month,
    day_of_week,
    week_of_month
)
WHERE next_occurrence IS NULL;

-- Create function to process recurring transactions
CREATE OR REPLACE FUNCTION process_recurring_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r RECORD;
BEGIN
    -- Find all active recurring transactions that need processing
    FOR r IN 
        SELECT * FROM recurring_transactions 
        WHERE active = true
        AND (last_generated IS NULL OR next_occurrence <= CURRENT_DATE)
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    LOOP
        -- Insert the transaction
        INSERT INTO transactions (
            user_id,
            account_id,
            category_id,
            subcategory_id,
            amount,
            currency,
            description,
            date,
            type,
            transfer_account_id
        ) VALUES (
            r.user_id,
            r.account_id,
            r.category_id,
            r.subcategory_id,
            r.amount,
            r.currency,
            r.description,
            r.next_occurrence,
            r.type,
            r.transfer_account_id
        );

        -- Update the last_generated
        UPDATE recurring_transactions 
        SET last_generated = r.next_occurrence,
            updated_at = NOW()
        WHERE id = r.id;

        -- If end_date is reached, mark as inactive
        IF r.end_date IS NOT NULL AND r.next_occurrence >= r.end_date THEN
            UPDATE recurring_transactions 
            SET active = false,
                updated_at = NOW()
            WHERE id = r.id;
        END IF;
    END LOOP;
END;
$$;
