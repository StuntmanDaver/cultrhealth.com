-- Add coupon_code capture to waitlist and club_members signup flows
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
