-- Enable extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Remove existing schedule if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('update-exchange-rates');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, ignore the error
    NULL;
END $$;

-- Schedule the exchange rates update to run daily at midnight UTC
SELECT cron.schedule(
  'update-exchange-rates',
  '0 0 * * *',  -- At 00:00 (midnight) every day
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.next_api_url') || '/api/cron/update-exchange-rates',
    headers := json_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'
    )::jsonb
  ) AS request_id;
  $$
);

-- Ensure permissions
DO $$
BEGIN
  -- Grant permissions only if they don't already exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.role_usage_grants
    WHERE grantee = 'postgres'
    AND object_schema = 'cron'
  ) THEN
    GRANT USAGE ON SCHEMA cron TO postgres;
  END IF;
END $$;
