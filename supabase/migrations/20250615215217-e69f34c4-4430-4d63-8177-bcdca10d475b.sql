
-- Table for merchandise orders/sales
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchandise_id UUID NOT NULL REFERENCES merchandise(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- e.g. pending, paid, shipped
  shipping_address TEXT,
  digital_delivery_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow buyer to SELECT their own orders
CREATE POLICY "Buyer can view own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = buyer_id);

-- Allow creators to view orders for their own merchandise
CREATE POLICY "Creator can view product orders"
  ON public.orders
  FOR SELECT
  USING (
    (SELECT creator_id FROM merchandise WHERE id = merchandise_id) = auth.uid()
    OR auth.uid() = buyer_id
  );

-- Allow buyers to INSERT their own orders
CREATE POLICY "Buyer can place order"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Allow creators to UPDATE status/etc for their own merchandise
CREATE POLICY "Creator can update order for their merchandise"
  ON public.orders
  FOR UPDATE
  USING (
    (SELECT creator_id FROM merchandise WHERE id = merchandise_id) = auth.uid()
  );

-- Allow buyers to UPDATE (cancel) their own orders
CREATE POLICY "Buyer can update own order"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = buyer_id);

-- (Optional) Only admins or creators can DELETE (not buyers)
CREATE POLICY "Creator can delete order for their merchandise"
  ON public.orders
  FOR DELETE
  USING (
    (SELECT creator_id FROM merchandise WHERE id = merchandise_id) = auth.uid()
  );
