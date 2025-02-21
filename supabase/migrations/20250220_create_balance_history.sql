-- Drop existing table if exists
DROP TABLE IF EXISTS public.balance_history;

-- Create balance history table
CREATE TABLE IF NOT EXISTS public.balance_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
    balance numeric(19,4) NOT NULL,
    currency public.currency_code NOT NULL,
    recorded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.balance_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own balance history" ON public.balance_history;
DROP POLICY IF EXISTS "Users can insert balance history for their accounts" ON public.balance_history;

-- Create new policies
CREATE POLICY "Users can view their own balance history"
    ON public.balance_history
    FOR SELECT
    USING (
        account_id IN (
            SELECT id FROM public.accounts
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert balance history for their accounts"
    ON public.balance_history
    FOR INSERT
    WITH CHECK (
        account_id IN (
            SELECT id FROM public.accounts
            WHERE user_id = auth.uid()
        )
    );

-- Create function to update updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS handle_balance_history_updated_at ON public.balance_history;

-- Create trigger
CREATE TRIGGER handle_balance_history_updated_at
    BEFORE UPDATE ON public.balance_history
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
