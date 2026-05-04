ALTER TABLE public.profiles
ADD COLUMN in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN important_updates_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN new_reviews_enabled BOOLEAN NOT NULL DEFAULT true;