ALTER TABLE public.listing_availabilities
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_listing_availabilities_updated_at
BEFORE UPDATE ON public.listing_availabilities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();