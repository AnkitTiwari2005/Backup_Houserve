-- Houserve Service Catalog Synchronization Script (Final & Robust)
-- v1.3
-- Run this in your Supabase SQL Editor.

-- 1. Ensure the 'name' column is unique to support the UPSERT logic
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_name_key') THEN
        ALTER TABLE public.services ADD CONSTRAINT services_name_key UNIQUE (name);
    END IF;
END $$;

-- 2. Update existing categories to Houservere standards
UPDATE public.services SET category = 'Appliance Repair' WHERE category = 'AC Repair';
UPDATE public.services SET category = 'Electrical' WHERE category IN ('CCTV', 'Electronics');

-- 3. Inserting/Upserting the New Service List 
INSERT INTO public.services (name, category, price, duration_minutes, description, is_active, sort_order, image_url)
VALUES
-- Electrical
('Switch & Socket Repair', 'Electrical', 149, 30, 'Repair or replacement of switches and sockets.', true, 10, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800'),
('MCB/Fuse Repair', 'Electrical', 249, 45, 'Diagnostic and repair of MCB or fuse issues.', true, 20, 'https://images.unsplash.com/photo-1558002038-103792e0739d?auto=format&fit=crop&q=80&w=800'),
('Fan Installation & Repair', 'Electrical', 299, 60, 'Complete installation or repair of ceiling/wall fans.', true, 30, 'https://images.unsplash.com/photo-1565538411220-449ba37076ee?auto=format&fit=crop&q=80&w=800'),
('Light Installation (LED/Chandelier)', 'Electrical', 199, 30, 'Installation of LEDs, Chandeliers, or fancy lights.', true, 40, 'https://images.unsplash.com/photo-1513506496266-aa6c3a729c41?auto=format&fit=crop&q=80&w=800'),
('House Wiring', 'Electrical', 999, 180, 'Full or partial house wiring solutions.', true, 50, 'https://images.unsplash.com/photo-1454417020300-79de7a7591b3?auto=format&fit=crop&q=80&w=800'),
('Doorbell Installation', 'Electrical', 149, 20, 'Smart or traditional doorbell setup.', true, 60, 'https://images.unsplash.com/photo-1558210857-3932463fd6e4?auto=format&fit=crop&q=80&w=800'),
('CCTV Installation & Repair', 'Electrical', 499, 90, 'Security camera setup and maintenance.', true, 70, 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800'),
('Video Door Lock Installation', 'Electrical', 799, 120, 'Installation of smart video door locks.', true, 80, 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80&w=800'),
('Electrical Appliance Repair (basic)', 'Electrical', 349, 60, 'Basic repair for small electrical appliances.', true, 90, 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800'),

-- Appliance Repair
('Refrigerator Repair', 'Appliance Repair', 499, 60, 'Gas charging, compressor repair, or cooling issues.', true, 100, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800'),
('Washing Machine Repair', 'Appliance Repair', 399, 60, 'Top load, front load, or semi-automatic repair.', true, 110, 'https://images.unsplash.com/photo-1626806819282-2c1dc61a0e05?auto=format&fit=crop&q=80&w=800'),
('Microwave Repair', 'Appliance Repair', 349, 45, 'Heating or electrical issues in microwave ovens.', true, 120, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800'),
('RO Service & Repair', 'Appliance Repair', 449, 60, 'Filter replacement and complete RO servicing.', true, 130, 'https://images.unsplash.com/photo-1585837582845-93c68065b79d?auto=format&fit=crop&q=80&w=800'),
('Water Dispenser Repair', 'Appliance Repair', 299, 45, 'Repair of cooling or heating water dispensers.', true, 140, 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?auto=format&fit=crop&q=80&w=800'),
('Geyser Repair', 'Appliance Repair', 399, 60, 'Fixing heating issues or water leaks in geysers.', true, 150, 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800'),
('Induction Cooktop Repair', 'Appliance Repair', 249, 45, 'Circuit repair for induction cooktops.', true, 160, 'https://images.unsplash.com/photo-1556910110-ad5df30af474?auto=format&fit=crop&q=80&w=800'),
('Dishwasher Repair', 'Appliance Repair', 599, 90, 'Comprehensive repair for kitchen dishwashers.', true, 170, 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?auto=format&fit=crop&q=80&w=800'),

-- Carpentry
('Furniture Repair', 'Carpentry', 299, 60, 'General repair for chairs, tables, or wardrobes.', true, 180, 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800'),
('Furniture Assembly', 'Carpentry', 499, 120, 'Assembly of new furniture from IKEA or other brands.', true, 190, 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&q=80&w=800'),
('Door Repair & Installation', 'Carpentry', 399, 90, 'Fixing door alignment or installing new doors.', true, 200, 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=800'),
('Window Repair', 'Carpentry', 349, 60, 'Repair of wooden or glass windows.', true, 210, 'https://images.unsplash.com/photo-1521193556055-66258aa35a42?auto=format&fit=crop&q=80&w=800'),
('Curtain Rod Installation', 'Carpentry', 199, 30, 'Precision installation of curtain rods.', true, 220, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800'),
('Cabinet Fixing', 'Carpentry', 449, 90, 'Repair or adjustment of kitchen/room cabinets.', true, 230, 'https://images.unsplash.com/photo-1556911220-e15595ffc78f?auto=format&fit=crop&q=80&w=800'),

-- Painting
('Texture Painting', 'Painting', 1999, 240, 'Premium texture painting for highlights walls.', true, 240, 'https://images.unsplash.com/photo-1589939705384-5185138a0470?auto=format&fit=crop&q=80&w=800'),
('Waterproofing', 'Painting', 2499, 360, 'Solution for wall seepage and terrace leaks.', true, 250, 'https://images.unsplash.com/photo-1503708928676-1cb796a0891e?auto=format&fit=crop&q=80&w=800'),
('Wall Putty & Polish', 'Painting', 899, 180, 'Professional wall finishing and putty work.', true, 260, 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800'),

-- Cleaning
('Sofa Cleaning', 'Cleaning', 599, 90, 'Deep vacuuming and shampooing of sofa sets.', true, 270, 'https://images.unsplash.com/photo-1550963295-019d8a8a61c5?auto=format&fit=crop&q=80&w=800'),
('Carpet Cleaning', 'Cleaning', 499, 60, 'Industrial grade carpet cleaning.', true, 280, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&q=80&w=800'),
('Mattress Cleaning', 'Cleaning', 399, 60, 'Hygienic cleaning for all types of mattresses.', true, 290, 'https://images.unsplash.com/photo-1523413555809-0fb8a4a2c716?auto=format&fit=crop&q=80&w=800'),
('Office Cleaning', 'Cleaning', 2999, 480, 'Complete commercial space deep cleaning.', true, 300, 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=800')

ON CONFLICT (name) DO UPDATE SET 
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  image_url = EXCLUDED.image_url,
  updated_at = NOW();
