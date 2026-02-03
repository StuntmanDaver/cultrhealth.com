-- Create stripe_events table for idempotency tracking
CREATE TABLE IF NOT EXISTS stripe_events (
    id SERIAL PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_event_id ON stripe_events(event_id);
