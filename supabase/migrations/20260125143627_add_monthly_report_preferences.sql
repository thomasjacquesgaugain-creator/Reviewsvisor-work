-- Add monthly report preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_report_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS report_frequency TEXT DEFAULT 'monthly' CHECK (report_frequency IN ('weekly', 'monthly'));

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.monthly_report_enabled IS 'Whether the user wants to receive monthly reports via email';
COMMENT ON COLUMN public.profiles.report_frequency IS 'Frequency of reports: weekly or monthly';

-- Update existing profiles to have reports enabled by default
UPDATE public.profiles
SET monthly_report_enabled = true,
    report_frequency = 'monthly'
WHERE monthly_report_enabled IS NULL;
