-- Set up the environment variables for the cron job
ALTER DATABASE postgres SET "app.settings.next_api_url" = 'http://localhost:3000';
ALTER DATABASE postgres SET "app.settings.cron_secret" = 'd9604c1d6049cc88607645e7588d36b3730d8e6c6bd784f589de72927f7c0aa7';
