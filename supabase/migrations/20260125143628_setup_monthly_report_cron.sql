-- Setup CRON job to send monthly reports on the 1st of each month at 9:00 AM
-- Note: This requires pg_cron extension to be enabled in Supabase
-- If pg_cron is not available, you can use Supabase Dashboard -> Database -> Cron Jobs instead

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing job if it exists
SELECT cron.unschedule('send-monthly-reports');

-- Schedule the job to run on the 1st of each month at 9:00 AM (UTC)
-- Format: cron.schedule(job_name, schedule, command)
-- Schedule: '0 9 1 * *' means: minute 0, hour 9, day 1, every month, every day of week
SELECT cron.schedule(
  'send-monthly-reports',
  '0 9 1 * *', -- 1st of each month at 9:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-monthly-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object()
    ) AS request_id;
  $$
);

-- Alternative: If the above doesn't work, use this simpler approach
-- This calls the Edge Function directly via HTTP
-- Note: You may need to adjust the URL and authentication method based on your Supabase setup

-- For Supabase, it's better to use the Supabase Dashboard -> Database -> Cron Jobs
-- Or use a scheduled function that calls the Edge Function via HTTP
