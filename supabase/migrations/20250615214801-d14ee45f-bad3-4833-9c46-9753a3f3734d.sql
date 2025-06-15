
-- Create a merchandise table for creator products
CREATE TABLE public.merchandise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  is_digital BOOLEAN NOT NULL DEFAULT false,
  digital_download_url TEXT,
  inventory INTEGER DEFAULT 0, -- For physical products
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security for merchandise
ALTER TABLE public.merchandise ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT (view) merchandise
CREATE POLICY "Public can view merchandise"
  ON public.merchandise
  FOR SELECT
  USING (true);

-- Allow creators to INSERT their own merchandise
CREATE POLICY "Creator can insert own merchandise"
  ON public.merchandise
  FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Allow creators to UPDATE their own merchandise
CREATE POLICY "Creator can update own merchandise"
  ON public.merchandise
  FOR UPDATE
  USING (auth.uid() = creator_id);

-- Allow creators to DELETE their own merchandise
CREATE POLICY "Creator can delete own merchandise"
  ON public.merchandise
  FOR DELETE
  USING (auth.uid() = creator_id);
