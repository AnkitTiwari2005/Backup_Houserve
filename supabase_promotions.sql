-- ==========================================
-- HOUSERVE: PROMOTIONS TABLE (Dynamic Home Carousel)
-- Run this in your Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_text TEXT DEFAULT 'Book Now',
  -- bg_color: Tailwind-style gradient or hex for the card background
  bg_gradient TEXT DEFAULT 'linear-gradient(135deg, #F3732A 0%, #1A1A2E 100%)',
  -- Link to a service category filter when banner is tapped
  link_path TEXT DEFAULT '/services',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read active promotions
GRANT SELECT ON public.promotions TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
CREATE POLICY "Anyone can view active promotions"
  ON public.promotions FOR SELECT
  USING (is_active = true);

-- Seed data matching the reference screenshots
INSERT INTO public.promotions (title, subtitle, cta_text, bg_gradient, link_path, sort_order) VALUES
(
  'Relax & Rejuvenate at Home',
  'Spa for women — Premium doorstep service',
  'Book Now',
  'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
  '/services?category=Spa',
  1
),
(
  'AC Service Starting ₹499',
  'Split & Window AC — Same-day slots',
  'Book Now',
  'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
  '/services?category=AC Repair',
  2
),
(
  'Expert Electricians Ready',
  'Wiring, MCB, switchboard repairs — Fast',
  'Book Now',
  'linear-gradient(135deg, #F3732A 0%, #D95F1A 100%)',
  '/services?category=Electrical',
  3
);
