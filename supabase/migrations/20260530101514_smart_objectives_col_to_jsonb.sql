-- Drop defaults
ALTER TABLE smart_objectives
ALTER COLUMN pareto_cause DROP DEFAULT,
ALTER COLUMN problem DROP DEFAULT,
ALTER COLUMN kpi_label DROP DEFAULT,
ALTER COLUMN unit DROP DEFAULT,
ALTER COLUMN relevance_note DROP DEFAULT,
ALTER COLUMN actions DROP DEFAULT;

-- Convert text -> jsonb
ALTER TABLE smart_objectives
ALTER COLUMN pareto_cause TYPE jsonb USING pareto_cause::jsonb,
ALTER COLUMN problem TYPE jsonb USING problem::jsonb,
ALTER COLUMN kpi_label TYPE jsonb USING kpi_label::jsonb,
ALTER COLUMN unit TYPE jsonb USING unit::jsonb,
ALTER COLUMN relevance_note TYPE jsonb USING relevance_note::jsonb,
ALTER COLUMN actions TYPE jsonb USING actions::jsonb;

-- Re-add defaults if you want them
ALTER TABLE smart_objectives
ALTER COLUMN pareto_cause SET DEFAULT '{}'::jsonb,
ALTER COLUMN problem SET DEFAULT '{}'::jsonb,
ALTER COLUMN kpi_label SET DEFAULT '{}'::jsonb,
ALTER COLUMN unit SET DEFAULT '{}'::jsonb,
ALTER COLUMN relevance_note SET DEFAULT '{}'::jsonb,
ALTER COLUMN actions SET DEFAULT '[]'::jsonb;