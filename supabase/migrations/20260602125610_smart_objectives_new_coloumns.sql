
ALTER TABLE smart_objectives
  ADD COLUMN IF NOT EXISTS synthesis    jsonb,
  ADD COLUMN IF NOT EXISTS action_plan  jsonb;