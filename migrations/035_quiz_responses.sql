-- Migration 035: Quiz Responses table for analytics
-- Stores completed quiz responses with answers, recommendation, and conversion tracking

CREATE TABLE IF NOT EXISTS quiz_responses (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  answers JSONB NOT NULL,
  recommended_tier TEXT NOT NULL,
  recommended_therapy TEXT,
  clicked_join BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_responses_completed_at ON quiz_responses (completed_at);
CREATE INDEX idx_quiz_responses_tier ON quiz_responses (recommended_tier);
