ALTER TABLE smart_objectives
  ADD COLUMN IF NOT EXISTS ai_justification  jsonb,
  ADD COLUMN IF NOT EXISTS expected_result   jsonb,
  ADD COLUMN IF NOT EXISTS review_frequency  text
    CHECK (review_frequency IN ('every_week','every_2_weeks','every_4_weeks','every_3_months'));