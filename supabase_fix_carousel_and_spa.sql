-- ==========================================
-- HOUSERVE: Fix Carousel Images + Add Spa Services
-- Run this in your Supabase SQL Editor
-- ==========================================

-- STEP 1: Add image_url column to promotions (safe to re-run)
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- STEP 2: Update promotions with real service images
UPDATE public.promotions
SET image_url = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800'
WHERE sort_order = 1;

UPDATE public.promotions
SET image_url = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800'
WHERE sort_order = 2;

UPDATE public.promotions
SET image_url = 'https://images.unsplash.com/photo-1621905252507-b35242f8969d?auto=format&fit=crop&q=80&w=800'
WHERE sort_order = 3;

-- STEP 3: Add Spa services to services table
INSERT INTO public.services (name, category, description, price, duration_minutes, image_url, is_active, sort_order)
VALUES
  (
    'Full Body Spa & Massage',
    'Spa',
    'Relaxing full-body Swedish massage with aromatherapy oils. Ideal for stress relief and muscle recovery.',
    799.00, 60,
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=400',
    TRUE, 9
  ),
  (
    'Facial & Skin Treatment',
    'Spa',
    'Deep cleansing facial with exfoliation, face pack, and moisturising. Leaves skin glowing and refreshed.',
    499.00, 45,
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400',
    TRUE, 10
  ),
  (
    'Manicure & Pedicure',
    'Spa',
    'Complete hand and foot care — nail shaping, cuticle care, scrub, massage, and nail paint.',
    599.00, 75,
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=400',
    TRUE, 11
  ),
  (
    'Head & Scalp Massage',
    'Spa',
    'Therapeutic head massage with warm oil to relieve tension, improve circulation, and promote hair health.',
    399.00, 30,
    'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&q=80&w=400',
    TRUE, 12
  )
ON CONFLICT (name) DO NOTHING;
