
-- Switch trigger function to SECURITY INVOKER (no elevated privileges needed)
CREATE OR REPLACE FUNCTION public.enforce_listing_insert_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.status := 'pending';
  NEW.moderation_token := gen_random_uuid();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.enforce_listing_insert_defaults() FROM PUBLIC, anon, authenticated;

-- Tighten the INSERT policy: explicit, not permissive-true
DROP POLICY IF EXISTS "Anyone can submit a listing" ON public.listings;
CREATE POLICY "Anyone can submit a pending listing"
ON public.listings
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending');

-- Storage policies for listing-photos: anyone can upload, only service_role reads (we'll sign URLs server-side)
CREATE POLICY "Anyone can upload listing photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'listing-photos');
