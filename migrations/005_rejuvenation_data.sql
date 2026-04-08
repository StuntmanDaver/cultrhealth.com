-- Migration: Rejuvenation Data Infrastructure
-- Purpose: Support longitudinal tracking for Altos Labs acquisition positioning
-- Creates tables for daily logs, biomarker entries, and protocol outcomes

-- =============================================================================
-- DAILY LOG TABLE
-- Captures daily subjective and objective metrics from users ("Bio-Explorers")
-- =============================================================================

CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID NOT NULL,
  healthie_patient_id TEXT,
  
  -- Core metrics
  log_date DATE NOT NULL,
  energy_level SMALLINT CHECK (energy_level >= 1 AND energy_level <= 10),
  mood_rating SMALLINT CHECK (mood_rating >= 1 AND mood_rating <= 10),
  sleep_quality SMALLINT CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  sleep_hours DECIMAL(3, 1),
  stress_level SMALLINT CHECK (stress_level >= 1 AND stress_level <= 10),
  
  -- Physical metrics (optional daily tracking)
  weight_kg DECIMAL(5, 2),
  resting_hr INTEGER,
  hrv_ms INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  
  -- Wearable data (Oura, Apple Health, etc.)
  wearable_source TEXT,
  wearable_sleep_score INTEGER,
  wearable_readiness_score INTEGER,
  wearable_activity_score INTEGER,
  deep_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  steps INTEGER,
  
  -- Protocol adherence
  protocol_id UUID,
  protocol_adherence_pct SMALLINT CHECK (protocol_adherence_pct >= 0 AND protocol_adherence_pct <= 100),
  supplements_taken JSONB DEFAULT '[]'::jsonb,
  peptides_administered JSONB DEFAULT '[]'::jsonb,
  
  -- Free-form notes
  notes TEXT,
  symptoms_reported TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one log per user per day
  UNIQUE(user_id, log_date)
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logs_protocol ON daily_logs(protocol_id) WHERE protocol_id IS NOT NULL;

-- =============================================================================
-- BIOMARKER ENTRY TABLE
-- Stores normalized lab results from Healthie or direct uploads
-- Links to the data-normalization.ts pipeline
-- =============================================================================

CREATE TABLE IF NOT EXISTS biomarker_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID NOT NULL,
  healthie_patient_id TEXT,
  
  -- Biomarker identification (matches lib/resilience.ts BIOMARKER_DEFINITIONS)
  biomarker_id TEXT NOT NULL,
  biomarker_name TEXT NOT NULL,
  category TEXT NOT NULL, -- inflammation, metabolic, hormonal, longevity
  
  -- Values
  value DECIMAL(12, 4) NOT NULL,
  unit TEXT NOT NULL,
  
  -- Original data (before normalization)
  original_value TEXT,
  original_unit TEXT,
  original_name TEXT,
  
  -- Data quality
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')) DEFAULT 'high',
  conversion_applied BOOLEAN DEFAULT FALSE,
  
  -- Source tracking
  source TEXT, -- 'healthie', 'direct_upload', 'wearable', etc.
  lab_company TEXT,
  reference_range TEXT,
  
  -- Timing
  measured_at DATE NOT NULL,
  
  -- Scoring (from resilience engine)
  score INTEGER CHECK (score >= 0 AND score <= 100),
  status TEXT CHECK (status IN ('optimal', 'acceptable', 'suboptimal', 'critical')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate entries for same biomarker on same date
  UNIQUE(user_id, biomarker_id, measured_at)
);

-- Indexes for analytics and time-series queries
CREATE INDEX IF NOT EXISTS idx_biomarker_user_date ON biomarker_entries(user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_biomarker_id ON biomarker_entries(biomarker_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_category ON biomarker_entries(category);

-- =============================================================================
-- PROTOCOL OUTCOME TABLE
-- Tracks results of each protocol as an "N-of-1" experiment
-- Links to protocol-templates.ts
-- =============================================================================

CREATE TABLE IF NOT EXISTS protocol_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID NOT NULL,
  healthie_patient_id TEXT,
  
  -- Protocol identification
  protocol_id UUID NOT NULL,
  protocol_version TEXT NOT NULL,
  protocol_type TEXT NOT NULL, -- 'template', 'symptom', 'custom'
  template_id TEXT, -- Links to PROTOCOL_TEMPLATES if applicable
  symptom_ids TEXT[], -- Links to SYMPTOM_PROTOCOLS if applicable
  
  -- Timing
  started_at DATE NOT NULL,
  ended_at DATE,
  duration_weeks INTEGER,
  
  -- Expected outcomes (from protocol generation)
  expected_outcomes JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ biomarkerId, targetValue, direction, timeframeWeeks }]
  
  -- Actual outcomes
  actual_outcomes JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ biomarkerId, baselineValue, endValue, percentChange }]
  
  -- Success metrics
  success_score INTEGER CHECK (success_score >= 0 AND success_score <= 100),
  goals_met INTEGER DEFAULT 0,
  goals_total INTEGER DEFAULT 0,
  
  -- Resilience score tracking
  baseline_resilience_score INTEGER,
  end_resilience_score INTEGER,
  resilience_delta INTEGER, -- end - baseline (positive = improvement)
  
  -- Phenotype tracking
  baseline_phenotype TEXT,
  end_phenotype TEXT,
  
  -- Adherence
  average_adherence_pct SMALLINT,
  total_log_days INTEGER DEFAULT 0,
  
  -- User feedback
  user_effectiveness_rating SMALLINT CHECK (user_effectiveness_rating >= 1 AND user_effectiveness_rating <= 10),
  user_would_repeat BOOLEAN,
  user_notes TEXT,
  
  -- Side effects / adverse events
  side_effects_reported TEXT[],
  adverse_events JSONB,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'completed', 'abandoned', 'paused')) DEFAULT 'active',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for outcome analysis
CREATE INDEX IF NOT EXISTS idx_protocol_outcomes_user ON protocol_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_protocol_outcomes_status ON protocol_outcomes(status);
CREATE INDEX IF NOT EXISTS idx_protocol_outcomes_template ON protocol_outcomes(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_protocol_outcomes_dates ON protocol_outcomes(started_at, ended_at);

-- =============================================================================
-- RESILIENCE SCORE HISTORY TABLE
-- Stores calculated resilience scores over time for trend analysis
-- =============================================================================

CREATE TABLE IF NOT EXISTS resilience_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification
  user_id UUID NOT NULL,
  healthie_patient_id TEXT,
  
  -- Overall score
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100) NOT NULL,
  grade TEXT NOT NULL, -- A+, A, B+, B, C+, C, D, F
  
  -- Category scores
  category_scores JSONB NOT NULL,
  -- Structure: { inflammation: 75, metabolic: 82, hormonal: 68, longevity: 71 }
  
  -- Data completeness
  data_completeness INTEGER CHECK (data_completeness >= 0 AND data_completeness <= 100),
  biomarkers_used INTEGER,
  
  -- Age metrics
  chronological_age INTEGER,
  biological_age DECIMAL(5, 2),
  age_gap DECIMAL(5, 2), -- biological - chronological (negative = younger)
  
  -- Phenotype classification
  primary_phenotype TEXT,
  secondary_phenotypes TEXT[],
  phenotype_confidence DECIMAL(3, 2),
  
  -- Strengths and priorities
  top_strengths TEXT[],
  priority_areas TEXT[],
  
  -- Linked protocol (if score was taken during a protocol)
  protocol_outcome_id UUID REFERENCES protocol_outcomes(id),
  
  -- Timing
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for time-series analysis
CREATE INDEX IF NOT EXISTS idx_resilience_user_date ON resilience_scores(user_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_resilience_phenotype ON resilience_scores(primary_phenotype);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE daily_logs IS 'Daily subjective/objective health metrics for longitudinal tracking (Bio-Explorer data)';
COMMENT ON TABLE biomarker_entries IS 'Normalized lab results from Healthie API and direct uploads, linked to BIOMARKER_DEFINITIONS';
COMMENT ON TABLE protocol_outcomes IS 'N-of-1 experiment tracking for each protocol, measuring pre/post changes';
COMMENT ON TABLE resilience_scores IS 'Historical resilience scores for trend analysis and ML model training';

COMMENT ON COLUMN daily_logs.wearable_source IS 'Source of wearable data: oura, apple_health, whoop, garmin, etc.';
COMMENT ON COLUMN biomarker_entries.confidence IS 'Data quality: high (direct match), medium (unit converted), low (no unit info)';
COMMENT ON COLUMN protocol_outcomes.success_score IS 'Calculated score based on goals_met/goals_total and resilience_delta';
COMMENT ON COLUMN resilience_scores.age_gap IS 'Negative values indicate biological age younger than chronological age';
