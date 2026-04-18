-- ==========================================
-- RAZORPAY MIGRATION: Add Razorpay columns to bookings table
-- Run this in Supabase SQL Editor to migrate existing DB
-- Non-destructive: Old Stripe columns preserved for historical data
-- ==========================================

-- Add new Razorpay columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Migrate existing Stripe payment status data to the new generic column
UPDATE public.bookings 
SET payment_status = stripe_payment_status 
WHERE stripe_payment_status IS NOT NULL 
  AND (payment_status IS NULL OR payment_status = 'pending');

-- Optional: Create index on razorpay_order_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_order_id ON public.bookings(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_razorpay_payment_id ON public.bookings(razorpay_payment_id);

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration complete. New columns added: razorpay_order_id, razorpay_payment_id, payment_status';
  RAISE NOTICE 'Old columns preserved: stripe_payment_intent_id, stripe_payment_status';
END $$;
