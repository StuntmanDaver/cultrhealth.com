-- Migration 010: Consult Requests Table
-- Stores consultation scheduling requests from members

CREATE TABLE IF NOT EXISTS consult_requests (
  id SERIAL PRIMARY KEY,
  customer_email VARCHAR(255) NOT NULL,
  preferred_date DATE,
  preferred_time VARCHAR(50),
  reason VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consult_requests_email ON consult_requests(lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_consult_requests_status ON consult_requests(status);
