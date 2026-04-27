-- Migration 059: Update Jonas Machado commission rate to 20%
UPDATE creators SET commission_rate = 20.00, updated_at = NOW()
WHERE lower(email) = 'jonasmachaddo@gmail.com';
