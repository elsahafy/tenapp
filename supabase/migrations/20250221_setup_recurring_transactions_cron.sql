-- Drop existing job if it exists
SELECT cron.unschedule('process-recurring-transactions');

-- Create a new job to run daily at 00:05 UTC
SELECT cron.schedule(
    'process-recurring-transactions',
    '5 0 * * *',  -- Run at 00:05 UTC every day
    $$
    SELECT process_recurring_transactions();
    $$
);
