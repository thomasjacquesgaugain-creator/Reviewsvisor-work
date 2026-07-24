ALTER TABLE smart_objectives
  ADD COLUMN IF NOT EXISTS start_time timestamptz,
  ADD COLUMN IF NOT EXISTS start_rating numeric(2,1);