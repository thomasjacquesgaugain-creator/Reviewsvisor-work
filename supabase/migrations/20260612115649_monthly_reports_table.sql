create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  place_id text not null,
  report_month date not null,
  report_month_key text not null,
  report_month_label text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  report_data jsonb not null,
  status text not null default 'ready',
  email_sent_at timestamptz null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  error_message text null,
  constraint monthly_reports_status_check check (
    status = any (array['ready'::text, 'db_failed'::text, 'email_failed'::text, 'partial_failure'::text])
  ),
  constraint monthly_reports_establishment_month_key_key unique (establishment_id, report_month_key)
);

create index if not exists idx_monthly_reports_user_id_report_month
  on public.monthly_reports (user_id, report_month desc);

create index if not exists idx_monthly_reports_establishment_id_report_month
  on public.monthly_reports (establishment_id, report_month desc);

create trigger update_monthly_reports_updated_at
before update on public.monthly_reports
for each row
execute function public.update_updated_at_column();

alter table public.monthly_reports enable row level security;

create policy "Users can view their own monthly reports"
on public.monthly_reports
for select
to authenticated
using (auth.uid() = user_id);

grant all on table public.monthly_reports to authenticated;
grant all on table public.monthly_reports to service_role;