-- Create user_entitlements table for unified billing/subscription state
-- This table serves as the single source of truth for all entitlements (Stripe + creator bypass)

CREATE TABLE public.user_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pro_plan_key TEXT, -- "pro_1499_12m" or "pro_2499_monthly" or null
  pro_status TEXT NOT NULL DEFAULT 'inactive' CHECK (pro_status IN ('active', 'inactive')),
  pro_current_period_end TIMESTAMP WITH TIME ZONE,
  addon_multi_etablissements_status TEXT NOT NULL DEFAULT 'inactive' CHECK (addon_multi_etablissements_status IN ('active', 'inactive')),
  addon_multi_etablissements_period_end TIMESTAMP WITH TIME ZONE,
  addon_multi_etablissements_qty INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'stripe' CHECK (source IN ('stripe', 'creator_bypass')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own entitlements"
ON public.user_entitlements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own entitlements"
ON public.user_entitlements
FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
ON public.user_entitlements
FOR ALL
USING (auth.role() = 'service_role');

-- Add index for quick lookups
CREATE INDEX idx_user_entitlements_user_id ON public.user_entitlements(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_entitlements_updated_at
BEFORE UPDATE ON public.user_entitlements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();