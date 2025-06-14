
-- Add is_paid and price columns to live_streams table (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'live_streams' AND column_name = 'is_paid') THEN
        ALTER TABLE public.live_streams ADD COLUMN is_paid BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'live_streams' AND column_name = 'price') THEN
        ALTER TABLE public.live_streams ADD COLUMN price DECIMAL(10,2);
    END IF;
END $$;
