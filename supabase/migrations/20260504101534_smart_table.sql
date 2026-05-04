-- supabase/migrations/032_smart_objectives.sql

CREATE TABLE smart_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id),
  place_id         TEXT NOT NULL,

  -- Source tracing (from Pareto + Ishikawa)
  pareto_cause        TEXT NOT NULL,       -- e.g. "Waiting Time"
  pareto_percentage   NUMERIC,             -- e.g. 27.9 (% of negative reviews)
  pareto_count        INT,                 -- raw mention count from top_issues

  -- Ishikawa / Questionnaire
  ishikawa_top_category TEXT,              -- e.g. "Outils & systèmes"
  questionnaire_scores  JSONB,            -- { manpower:3, method:2, machine:4, ... }
  effort                TEXT DEFAULT 'Medium'
    CHECK (effort IN ('Low', 'Medium', 'High')),
  effort_source         TEXT DEFAULT 'auto_detected'
    CHECK (effort_source IN ('auto_detected', 'user_questionnaire')),

  -- Impact (from spec §7.2 — % of negative reviews)
  impact TEXT DEFAULT 'Medium'
    CHECK (impact IN ('Low', 'Medium', 'High')),
  quadrant TEXT
    CHECK (quadrant IN ('quick_win', 'strategic', 'minor', 'avoid')),

  -- SMART fields
  problem        TEXT NOT NULL,            -- S: specific problem statement
  kpi_label      TEXT NOT NULL,            -- M: what metric to track
  current_value  NUMERIC NOT NULL,         -- M: e.g. 12 negative mentions
  target_value   NUMERIC NOT NULL,         -- M: e.g. 6 (50% reduction)
  unit           TEXT DEFAULT 'negative reviews',
  relevance_note TEXT,                     -- R: why it matters
  actions        JSONB DEFAULT '[]',       -- A: [{text, frequency, completed}]
  deadline       DATE NOT NULL,            -- T: target date
  duration_months INT DEFAULT 3,           -- T: how long

  -- Computed vs user-adjusted tracking
  computed_target          NUMERIC,        -- Math.ceil(count * 0.5) — never changes
  computed_deadline_months INT,            -- from effort lookup table
  target_source TEXT DEFAULT 'computed'
    CHECK (target_source IN ('computed', 'user_adjusted')),
  deadline_source TEXT DEFAULT 'computed'
    CHECK (deadline_source IN ('computed', 'user_adjusted')),

  -- Progress tracking (updated by PDCA CHECK)
  current_progress NUMERIC,               -- current value as of last check
  status TEXT DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'completed', 'overdue')),
  priority TEXT DEFAULT 'high'
    CHECK (priority IN ('high', 'medium', 'low')),

  -- AI metadata
  ai_generated   BOOLEAN DEFAULT true,
  ai_confidence  NUMERIC CHECK (ai_confidence BETWEEN 0 AND 1),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_smart_place_id
  ON smart_objectives(place_id);

CREATE INDEX idx_smart_user_id
  ON smart_objectives(user_id);

CREATE INDEX idx_smart_pareto_cause
  ON smart_objectives(pareto_cause);

-- RLS
ALTER TABLE smart_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_smart_objectives"
  ON smart_objectives
  FOR ALL
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_smart_objectives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER smart_objectives_updated_at
  BEFORE UPDATE ON smart_objectives
  FOR EACH ROW
  EXECUTE FUNCTION update_smart_objectives_updated_at();