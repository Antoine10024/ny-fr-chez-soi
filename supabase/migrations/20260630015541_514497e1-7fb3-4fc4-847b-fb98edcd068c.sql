
-- Enum for housing types
CREATE TYPE public.housing_type AS ENUM ('chambre', 'studio', '1-bed', '2-bed', 'autre');
CREATE TYPE public.contact_type AS ENUM ('email', 'whatsapp', 'facebook', 'instagram', 'telegram', 'autre');
CREATE TYPE public.listing_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  status public.listing_status NOT NULL DEFAULT 'pending',

  author_name text NOT NULL,
  author_email text NOT NULL,

  contact_type public.contact_type NOT NULL,
  contact_value text NOT NULL,
  contact_label text,

  neighborhood text NOT NULL,
  housing_type public.housing_type NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,

  summary text NOT NULL,
  description text NOT NULL,
  practical_info text,

  photos text[] NOT NULL DEFAULT '{}',

  moderation_token uuid NOT NULL DEFAULT gen_random_uuid()
);

CREATE INDEX listings_status_idx ON public.listings (status, start_date);
CREATE INDEX listings_moderation_token_idx ON public.listings (moderation_token);

-- Public view: only approved, only safe columns
CREATE VIEW public.public_listings
WITH (security_invoker = true)
AS
SELECT
  id,
  created_at,
  author_name,
  contact_type,
  contact_value,
  contact_label,
  neighborhood,
  housing_type,
  start_date,
  end_date,
  summary,
  description,
  practical_info,
  photos
FROM public.listings
WHERE status = 'approved';

-- Grants
GRANT INSERT ON public.listings TO anon, authenticated;
GRANT ALL ON public.listings TO service_role;
GRANT SELECT ON public.public_listings TO anon, authenticated;
GRANT ALL ON public.public_listings TO service_role;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a new listing; force status to pending via trigger
CREATE POLICY "Anyone can submit a listing"
ON public.listings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies for anon/authenticated -> service_role only

-- Trigger: force status pending on insert, regenerate moderation token
CREATE OR REPLACE FUNCTION public.enforce_listing_insert_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.status := 'pending';
  NEW.moderation_token := gen_random_uuid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_listing_insert_defaults
BEFORE INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_listing_insert_defaults();
