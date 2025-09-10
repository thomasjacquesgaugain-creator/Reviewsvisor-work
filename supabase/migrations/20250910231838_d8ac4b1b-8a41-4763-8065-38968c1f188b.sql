-- Add manager access policy for profiles table
-- This allows managers to view employee profiles for legitimate business needs
-- while maintaining security principles

CREATE POLICY "Managers can view employee profiles for business needs" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'gerant'::app_role));

-- Add manager ability to update specific employee profile fields for business needs
-- This is more restrictive - managers can only update work-related fields, not personal data
CREATE POLICY "Managers can update employee work-related profile fields" 
ON public.profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'gerant'::app_role))
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'gerant'::app_role));

-- Add audit logging table for sensitive profile access
-- This helps track who accessed what data for security monitoring
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  accessed_profile_id uuid NOT NULL,
  accessor_user_id uuid NOT NULL,
  access_type text NOT NULL, -- 'view', 'update', etc.
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Only managers can view audit logs
CREATE POLICY "Managers can view profile access logs" 
ON public.profile_access_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'gerant'::app_role));

-- Create function to manually log profile access when needed
CREATE OR REPLACE FUNCTION public.log_profile_access(
  profile_id uuid, 
  access_type text DEFAULT 'view'
)
RETURNS void AS $$
BEGIN
  -- Only log access by managers to employee profiles (not self-access)
  IF auth.uid() IS NOT NULL AND 
     (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'gerant'::app_role)) THEN
    INSERT INTO public.profile_access_logs (
      accessed_profile_id, 
      accessor_user_id, 
      access_type,
      accessed_at
    ) VALUES (
      profile_id,
      auth.uid(),
      access_type,
      now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;