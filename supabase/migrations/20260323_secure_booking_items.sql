-- FIX: Enable RLS and Permissions for booking_items (Audit v3.0 Fix #2.3)

-- 1. Enable RLS
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;

-- 2. Grant permissions to authenticated users
GRANT ALL ON booking_items TO authenticated;
GRANT ALL ON booking_items TO service_role;

-- 3. Policy: Users can view their own booking items via their bookings
CREATE POLICY "Users can view their own booking items" 
ON booking_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_items.booking_id 
    AND bookings.customer_id = auth.uid()
  )
);

-- 4. Policy: Users can insert their own booking items
CREATE POLICY "Users can insert their own booking items" 
ON booking_items FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = booking_items.booking_id 
    AND bookings.customer_id = auth.uid()
  )
);
