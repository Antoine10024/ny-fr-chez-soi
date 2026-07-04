
-- 1. Enum for availability status (préparation booked/unavailable)
CREATE TYPE public.availability_status AS ENUM ('available', 'booked', 'unavailable');

-- 2. New table: one row = one availability period
CREATE TABLE public.listing_availabilities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status public.availability_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_availabilities_date_order CHECK (end_date >= start_date)
);

CREATE INDEX listing_availabilities_listing_id_idx ON public.listing_availabilities(listing_id);
CREATE INDEX listing_availabilities_dates_idx ON public.listing_availabilities(start_date, end_date);

-- 3. GRANTs
GRANT SELECT ON public.listing_availabilities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_availabilities TO authenticated;
GRANT ALL ON public.listing_availabilities TO service_role;

-- 4. RLS
ALTER TABLE public.listing_availabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read availabilities of approved listings"
  ON public.listing_availabilities
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_availabilities.listing_id
        AND l.status = 'approved'
    )
  );

-- 5. Migrate existing listings data (one row per listing from its current start/end dates)
INSERT INTO public.listing_availabilities (listing_id, start_date, end_date)
SELECT id, start_date, end_date FROM public.listings
WHERE start_date IS NOT NULL AND end_date IS NOT NULL;

-- 6. Drop old columns from listings (single source of truth)
DROP VIEW IF EXISTS public.public_listings;
ALTER TABLE public.listings DROP COLUMN start_date;
ALTER TABLE public.listings DROP COLUMN end_date;

-- 7. Recreate public_listings view with aggregated availabilities
CREATE VIEW public.public_listings AS
SELECT
  l.id,
  l.created_at,
  l.author_name,
  l.contact_type,
  l.contact_value,
  l.contact_label,
  l.neighborhood,
  l.housing_type,
  l.summary,
  l.description,
  l.practical_info,
  l.photos,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'start_date', a.start_date,
          'end_date', a.end_date,
          'status', a.status
        )
        ORDER BY a.start_date
      )
      FROM public.listing_availabilities a
      WHERE a.listing_id = l.id AND a.status = 'available'
    ),
    '[]'::jsonb
  ) AS availabilities
FROM public.listings l
WHERE l.status = 'approved';

GRANT SELECT ON public.public_listings TO anon, authenticated;
