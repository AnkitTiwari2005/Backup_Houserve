-- ==========================================
-- BOYS@WORK COMPLETE DATABASE SCHEMA (v3)
-- ==========================================

-- 1. PROFILES (Extended User Data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'customer', -- customer, technician, admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SERVICES (Available Offerings)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER ADDRESSES (Customer Saved Locations)
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL, -- 'Home', 'Work', 'Other'
  flat_number TEXT NOT NULL,
  building_name TEXT,
  street TEXT NOT NULL,
  landmark TEXT,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT, -- Added for contact details
  full_address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BOOKINGS (Service Orders)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_ref TEXT UNIQUE DEFAULT 'BW-' || upper(substring(gen_random_uuid()::text, 1, 8)),
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  service_id UUID REFERENCES public.services(id),
  technician_id UUID REFERENCES auth.users(id), -- Assigned technician
  status TEXT DEFAULT 'confirmed', -- confirmed, assigned, accepted, on_the_way, in_progress, completed, cancelled
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  address_id UUID REFERENCES public.user_addresses(id),
  address_snapshot JSONB, -- Permanent copy of address at time of booking
  special_instructions TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 50.00,
  gst_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_payment_status TEXT, -- pending, paid, failed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NOTIFICATIONS (User Alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- booking, support, promo, info
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- GRANTS & PERMISSIONS
-- ==========================================

-- Revoke broad permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Grant minimal needed permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: 
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Services: Everyone can read active services
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true);

-- User Addresses: Owned by user
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.user_addresses;
CREATE POLICY "Users can manage own addresses" ON public.user_addresses FOR ALL USING (auth.uid() = user_id);

-- Bookings: Owned by user
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
CREATE POLICY "Users can manage own bookings" ON public.bookings FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

-- Notifications: Owned by user
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Function to handle new user signup automatically
-- Added logs and more robust COALESCE for data mapping
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, avatar_url, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'), 
    NEW.email, 
    NEW.phone,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- INITIAL DATA (SEEDING)
-- ==========================================

DELETE FROM public.services;
INSERT INTO public.services (name, category, description, price, duration_minutes, image_url, sort_order)
VALUES 
('Full House Deep Cleaning', 'Cleaning', 'Professional deep cleaning for all rooms, bathrooms, and kitchen.', 2499.00, 240, 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=400', 1),
('AC Service (Window/Split)', 'AC Repair', 'Comprehensive AC servicing, filter cleaning, and gas check.', 499.00, 60, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400', 2),
('Bathroom Deep Cleaning', 'Cleaning', 'Stain removal and sanitization of tiles, fittings, and floor.', 699.00, 90, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400', 3),
('Full Home Painting', 'Painting', 'Premium plastic emulsion painting with wall putty and finish.', 8999.00, 1440, 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400', 4),
('Kitchen Deep Cleaning', 'Cleaning', 'Degreasing of chimneys, cabinets, and appliances surfaces.', 999.00, 120, 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=400', 5),
('Essential Plumbing Checkup', 'Plumbing', 'Inspection of all taps, pipes, and tanks with minor repairs.', 299.00, 45, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400', 6),
('Electrical Safety Inspection', 'Electrical', 'Testing of all switchboards, MCBs, and wiring health.', 349.00, 60, 'https://images.unsplash.com/photo-1621905252507-b35242f8969d?auto=format&fit=crop&q=80&w=400', 7),
('Full House Pest Control', 'Pest Control', 'Eco-friendly treatment for cockroaches, ants, and spiders.', 1299.00, 120, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400', 8);
