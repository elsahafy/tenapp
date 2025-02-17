-- Create scenarios table
CREATE TABLE IF NOT EXISTS public.scenarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    scenario_type text NOT NULL,
    parameters jsonb NOT NULL DEFAULT '{}'::jsonb,
    results jsonb,
    status text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for scenarios
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can update own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can insert own scenarios" ON public.scenarios;
DROP POLICY IF EXISTS "Users can delete own scenarios" ON public.scenarios;

-- Create policy to allow users to view only their own scenarios
CREATE POLICY "Users can view own scenarios"
    ON public.scenarios FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to update only their own scenarios
CREATE POLICY "Users can update own scenarios"
    ON public.scenarios FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own scenarios
CREATE POLICY "Users can insert own scenarios"
    ON public.scenarios FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own scenarios
CREATE POLICY "Users can delete own scenarios"
    ON public.scenarios FOR DELETE
    USING (auth.uid() = user_id);

-- Drop trigger if exists
DROP TRIGGER IF EXISTS handle_updated_at_scenarios ON public.scenarios;

-- Add trigger for updated_at
CREATE TRIGGER handle_updated_at_scenarios
    BEFORE UPDATE ON public.scenarios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
