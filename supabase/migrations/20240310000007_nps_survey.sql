-- NPS Survey: add columns to users and create nps_responses table

ALTER TABLE users
  ADD COLUMN nps_dismissed_at timestamptz NULL,
  ADD COLUMN nps_submitted_at timestamptz NULL;

CREATE TABLE nps_responses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score      int  NOT NULL CHECK (score >= 0 AND score <= 10),
  comment    text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_nps_responses_user ON nps_responses(user_id);
