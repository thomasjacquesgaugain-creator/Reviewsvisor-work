-- Créer la table google_connections pour stocker les tokens OAuth
CREATE TABLE IF NOT EXISTS public.google_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;

-- Policies pour google_connections
CREATE POLICY "Users can view their own google connections"
  ON public.google_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own google connections"
  ON public.google_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own google connections"
  ON public.google_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own google connections"
  ON public.google_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Ajouter colonnes Google à la table establishments (si elle existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'establishments') THEN
    ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS google_account_id TEXT;
    ALTER TABLE public.establishments ADD COLUMN IF NOT EXISTS google_location_id TEXT;
  END IF;
END $$;

-- Modifier la table reviews pour supporter les avis Google
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_id_ext TEXT UNIQUE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS language_code TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_profile_url TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS owner_reply_text TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS owner_reply_time TIMESTAMPTZ;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS create_time TIMESTAMPTZ;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS update_time TIMESTAMPTZ;

-- Créer index sur review_id_ext pour performance UPSERT
CREATE INDEX IF NOT EXISTS idx_reviews_ext_id ON public.reviews(review_id_ext);
CREATE INDEX IF NOT EXISTS idx_reviews_place_create ON public.reviews(place_id, create_time);

-- Créer la table import_logs pour tracer les synchronisations
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  inserted_count INT DEFAULT 0,
  updated_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour import_logs
CREATE POLICY "Users can view their own import logs"
  ON public.import_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import logs"
  ON public.import_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index pour récupérer les derniers imports rapidement
CREATE INDEX IF NOT EXISTS idx_import_logs_user_place ON public.import_logs(user_id, place_id, started_at DESC);

-- Trigger pour updated_at sur google_connections
CREATE TRIGGER update_google_connections_updated_at
  BEFORE UPDATE ON public.google_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();