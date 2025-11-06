-- ==========================================
-- MIGRATION NON DESTRUCTIVE : Organisations, Abonnements, Améliorations
-- ==========================================

-- 1) Table organizations (nouvelle)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organizations"
  ON public.organizations FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can create their own organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own organizations"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own organizations"
  ON public.organizations FOR DELETE
  USING (auth.uid() = owner_user_id);

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_user_id);

-- 2) Table organization_members (nouvelle)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organizations"
  ON public.organization_members FOR SELECT
  USING (
    user_id = auth.uid() OR 
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Org owners can manage members"
  ON public.organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);

-- 3) Table subscriptions (nouvelle)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL DEFAULT 'FREE',
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '14 days',
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR organization_id IS NOT NULL)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    auth.uid() = user_id OR 
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON public.subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 4) Ajouter colonnes manquantes à establishments (si elles n'existent pas)
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'FR';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';
ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS rating_avg_cached NUMERIC;

CREATE INDEX IF NOT EXISTS idx_establishments_org ON public.establishments(organization_id);

-- 5) Ajouter colonne scope à google_connections
ALTER TABLE public.google_connections ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'https://www.googleapis.com/auth/business.manage';

-- 6) Mise à jour RLS pour establishments (permettre accès via organization)
DROP POLICY IF EXISTS "Users can view their own establishments" ON public.establishments;
CREATE POLICY "Users can view their own establishments"
  ON public.establishments FOR SELECT
  USING (
    auth.uid() = user_id OR 
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create their own establishments" ON public.establishments;
CREATE POLICY "Users can create their own establishments"
  ON public.establishments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own establishments" ON public.establishments;
CREATE POLICY "Users can update their own establishments"
  ON public.establishments FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own establishments" ON public.establishments;
CREATE POLICY "Users can delete their own establishments"
  ON public.establishments FOR DELETE
  USING (
    auth.uid() = user_id OR 
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    )
  );

-- 7) Mise à jour RLS pour reviews (permettre accès via establishment)
DROP POLICY IF EXISTS "reviews:own" ON public.reviews;
CREATE POLICY "Users can view reviews for their establishments"
  ON public.reviews FOR SELECT
  USING (
    auth.uid() = user_id OR
    place_id IN (
      SELECT place_id FROM public.establishments WHERE user_id = auth.uid()
    ) OR
    place_id IN (
      SELECT e.place_id FROM public.establishments e
      JOIN public.organizations o ON e.organization_id = o.id
      WHERE o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reviews for their establishments"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- 8) Mise à jour RLS pour import_logs (permettre accès via establishment)
DROP POLICY IF EXISTS "Users can view their own import logs" ON public.import_logs;
CREATE POLICY "Users can view import logs for their establishments"
  ON public.import_logs FOR SELECT
  USING (
    auth.uid() = user_id OR
    place_id IN (
      SELECT place_id FROM public.establishments WHERE user_id = auth.uid()
    ) OR
    place_id IN (
      SELECT e.place_id FROM public.establishments e
      JOIN public.organizations o ON e.organization_id = o.id
      WHERE o.owner_user_id = auth.uid()
    )
  );

-- 9) Trigger pour updated_at sur nouvelles tables
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10) Fonction pour créer une organisation et subscription au signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Créer une organisation pour le nouvel utilisateur
  INSERT INTO public.organizations (owner_user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  RETURNING id INTO new_org_id;

  -- Ajouter l'utilisateur comme membre owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  -- Créer une subscription en trial de 14 jours
  INSERT INTO public.subscriptions (
    user_id,
    organization_id,
    plan_code,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    new_org_id,
    'TRIAL',
    'trialing',
    now(),
    now() + INTERVAL '14 days'
  );

  -- Créer un profil si la table existe
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Créer le trigger sur auth.users (si pas déjà existant)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11) Fonction pour vérifier l'expiration des subscriptions
CREATE OR REPLACE FUNCTION public.check_expired_subscriptions()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status IN ('trialing', 'active')
    AND current_period_end < now()
    AND NOT cancel_at_period_end;
END;
$$;