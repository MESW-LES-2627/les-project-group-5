-- 002: saved settings and game progress of an account.
-- Run by hand after 001 (see docs/adr/001-database-choice.md). Never edit it after it has been run.

-- One set of settings per account (US-E5-07).
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  dominant_hand text NOT NULL CHECK (dominant_hand IN ('Left', 'Right')),
  camera_preview boolean NOT NULL,
  -- The root note of the scale, one of the 12 note names.
  scale_root text NOT NULL CHECK (scale_root IN ('C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B')),
  scale_type text NOT NULL CHECK (scale_type IN ('major', 'natural_minor')),
  layout text NOT NULL CHECK (layout IN ('pad_grid', 'piano')),
  -- The slider from Low (0) to High (1) (US-E4-04).
  sensitivity real NOT NULL CHECK (sensitivity BETWEEN 0 AND 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Progress that belongs to the account as a whole.
CREATE TABLE game_progress (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  -- Exercises passed in a row (US-E5-09).
  streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One row per unlocked exercise (US-E5-06, US-E5-10).
-- The exercises themselves live in the code, so we store only their id.
CREATE TABLE exercise_progress (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  exercise_id text NOT NULL,
  -- NULL while the exercise is unlocked but not passed yet; otherwise the best result, 1 to 3 stars.
  best_stars smallint CHECK (best_stars BETWEEN 1 AND 3),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);

-- Same reason as in 001: keep Supabase's own web API from reading these tables.
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
