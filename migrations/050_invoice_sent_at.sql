-- Track when a QuickBooks invoice was actually sent to the customer.
-- Previously the Timeline used approved_at as a proxy, which was wrong when QB failed.
ALTER TABLE club_orders
  ADD COLUMN IF NOT EXISTS invoice_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Back-fill: orders already at invoice_sent/needs_payment/paid/shipped/fulfilled
-- that succeeded through QB can safely use approved_at as a best-effort timestamp.
UPDATE club_orders
SET invoice_sent_at = approved_at
WHERE invoice_sent_at IS NULL
  AND approved_at IS NOT NULL
  AND status IN ('invoice_sent', 'needs_payment', 'paid', 'shipped', 'fulfilled');
