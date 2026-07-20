
create type onboarding_status as enum (
  'email_pending',
  'email_verified',
  'active'
);
 
alter table public.profiles
  add column if not exists onboarding_status onboarding_status not null default 'email_pending';