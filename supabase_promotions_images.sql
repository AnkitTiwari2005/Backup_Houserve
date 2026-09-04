-- ==========================================
-- HOUSERVE: Fix promotions image_url (guaranteed clean data)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Add column if not exists
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Delete and re-insert all 3 promotions with image_url baked in from the start
DELETE FROM public.promotions;

INSERT INTO public.promotions (title, subtitle, cta_text, bg_gradient, image_url, link_path, is_active, sort_order) VALUES
(
  'Relax & Rejuvenate at Home',
  'Spa for women — Premium doorstep service',
  'Book Now',
  'linear-gradient(to top, rgba(20,60,30,0.85) 0%, rgba(20,60,30,0.3) 60%, transparent 100%)',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
  '/services?category=Spa',
  TRUE,
  1
),
(
  'AC Service Starting ₹499',
  'Split & Window AC — Same-day slots',
  'Book Now',
  'linear-gradient(to top, rgba(10,30,80,0.85) 0%, rgba(10,30,80,0.3) 60%, transparent 100%)',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800',
  '/services?category=AC Repair',
  TRUE,
  2
),
(
  'Expert Electricians Ready',
  'Wiring, MCB, switchboard repairs — Fast',
  'Book Now',
  'linear-gradient(to top, rgba(100,40,0,0.85) 0%, rgba(100,40,0,0.3) 60%, transparent 100%)',
  'https://images.unsplash.com/photo-1621905252507-b35242f8969d?auto=format&fit=crop&q=80&w=800',
  '/services?category=Electrical',
  TRUE,
  3
);
