-- Create booking_items table to store multi-service orders (Audit Finding 2.3)
CREATE TABLE IF NOT EXISTS public.booking_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own booking items" 
    ON public.booking_items FOR SELECT 
    USING (
        booking_id IN (
            SELECT id FROM public.bookings WHERE customer_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own booking items" 
    ON public.booking_items FOR INSERT 
    WITH CHECK (
        booking_id IN (
            SELECT id FROM public.bookings WHERE customer_id = auth.uid()
        )
    );

-- Allow service role full access
CREATE POLICY "Service role full access on booking_items"
    ON public.booking_items FOR ALL
    USING (true);
