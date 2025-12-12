-- Add price_coins column to merchandise table for coin-based pricing
ALTER TABLE public.merchandise ADD COLUMN price_coins integer;

-- Comment explaining the column
COMMENT ON COLUMN public.merchandise.price_coins IS 'Price in coins set by the creator';