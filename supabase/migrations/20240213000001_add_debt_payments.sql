-- Create debt_payments table
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    debt_id uuid NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount decimal(12,2) NOT NULL CHECK (amount > 0),
    payment_date date NOT NULL,
    payment_type text NOT NULL CHECK (payment_type IN ('scheduled', 'extra')),
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for debt_payments
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own debt payments" ON public.debt_payments;
DROP POLICY IF EXISTS "Users can update own debt payments" ON public.debt_payments;
DROP POLICY IF EXISTS "Users can insert own debt payments" ON public.debt_payments;
DROP POLICY IF EXISTS "Users can delete own debt payments" ON public.debt_payments;

-- Create policy to allow users to view only their own debt payments
CREATE POLICY "Users can view own debt payments"
    ON public.debt_payments FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to update only their own debt payments
CREATE POLICY "Users can update own debt payments"
    ON public.debt_payments FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own debt payments
CREATE POLICY "Users can insert own debt payments"
    ON public.debt_payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own debt payments
CREATE POLICY "Users can delete own debt payments"
    ON public.debt_payments FOR DELETE
    USING (auth.uid() = user_id);

-- Drop trigger if exists
DROP TRIGGER IF EXISTS handle_updated_at_debt_payments ON public.debt_payments;

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at_debt_payments
    BEFORE UPDATE ON public.debt_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
