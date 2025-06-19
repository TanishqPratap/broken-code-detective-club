
-- Enable RLS on merchandise table (it already exists but may not have RLS enabled)
ALTER TABLE public.merchandise ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for merchandise
CREATE POLICY "Anyone can view published merchandise" 
  ON public.merchandise 
  FOR SELECT 
  USING (is_published = true);

CREATE POLICY "Creators can view their own merchandise" 
  ON public.merchandise 
  FOR SELECT 
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create their own merchandise" 
  ON public.merchandise 
  FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own merchandise" 
  ON public.merchandise 
  FOR UPDATE 
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own merchandise" 
  ON public.merchandise 
  FOR DELETE 
  USING (auth.uid() = creator_id);

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Buyers can view their own orders" 
  ON public.orders 
  FOR SELECT 
  USING (auth.uid() = buyer_id);

CREATE POLICY "Creators can view orders for their merchandise" 
  ON public.orders 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT creator_id FROM public.merchandise WHERE id = orders.merchandise_id
    )
  );

CREATE POLICY "Authenticated users can create orders" 
  ON public.orders 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update their own orders" 
  ON public.orders 
  FOR UPDATE 
  USING (auth.uid() = buyer_id);

-- Create a function to notify creators of new orders
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  creator_id_var UUID;
  buyer_name TEXT;
  merchandise_name TEXT;
BEGIN
  -- Get creator ID and merchandise name
  SELECT creator_id, name INTO creator_id_var, merchandise_name
  FROM public.merchandise 
  WHERE id = NEW.merchandise_id;
  
  -- Get buyer's name
  SELECT COALESCE(display_name, username) INTO buyer_name
  FROM public.profiles 
  WHERE id = NEW.buyer_id;
  
  -- Create notification for creator
  PERFORM public.create_notification(
    creator_id_var,
    'order',
    'New Order Received',
    buyer_name || ' ordered ' || merchandise_name,
    NEW.buyer_id,
    NEW.id,
    'order',
    jsonb_build_object('amount', NEW.price, 'quantity', NEW.quantity)
  );
  
  RETURN NEW;
END;
$function$;

-- Create trigger for order notifications
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.notify_new_order();
