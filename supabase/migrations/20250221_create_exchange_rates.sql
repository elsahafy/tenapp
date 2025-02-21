-- Create exchange_rates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id SERIAL PRIMARY KEY,
  base_currency currency_code NOT NULL,
  rates JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_update TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all users to read exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Allow service role to manage exchange rates" ON public.exchange_rates;

-- Create policies
CREATE POLICY "Allow all users to read exchange rates"
  ON public.exchange_rates
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role to manage exchange rates"
  ON public.exchange_rates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
