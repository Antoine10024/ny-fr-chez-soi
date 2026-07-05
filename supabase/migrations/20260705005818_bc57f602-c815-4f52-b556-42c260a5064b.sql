-- 1. Create borough enum
CREATE TYPE public.borough AS ENUM ('manhattan', 'brooklyn', 'queens', 'new_jersey', 'autre');

-- 2. Add borough column, temporarily nullable for backfill
ALTER TABLE public.listings ADD COLUMN borough public.borough;

-- 3. Backfill existing rows based on current neighborhood text
UPDATE public.listings SET borough = CASE
  WHEN neighborhood IN (
    'West Village','East Village','Lower East Side','SoHo','Chelsea','Midtown',
    'Upper West Side','Upper East Side','Harlem','Washington Heights',
    'Greenwich Village','Tribeca','Hell''s Kitchen','Flatiron','Gramercy',
    'Murray Hill','Kips Bay','Financial District','Battery Park City','Nolita',
    'NoHo','Chinatown','Roosevelt Island','Inwood'
  ) THEN 'manhattan'::public.borough
  WHEN neighborhood IN (
    'Williamsburg','Bushwick','Greenpoint','Park Slope','DUMBO','Bedford-Stuyvesant',
    'Bed-Stuy','Brooklyn Heights','Downtown Brooklyn','Fort Greene','Clinton Hill',
    'Prospect Heights','Crown Heights','Carroll Gardens','Cobble Hill','Boerum Hill',
    'Red Hook','Gowanus','Sunset Park'
  ) THEN 'brooklyn'::public.borough
  WHEN neighborhood IN (
    'Astoria','Long Island City','Sunnyside','Woodside','Jackson Heights','Elmhurst',
    'Forest Hills','Rego Park','Flushing','Ridgewood'
  ) THEN 'queens'::public.borough
  WHEN neighborhood IN (
    'Jersey City','Newport','Hoboken','Weehawken','Journal Square','Exchange Place'
  ) THEN 'new_jersey'::public.borough
  ELSE 'autre'::public.borough
END
WHERE borough IS NULL;

-- 4. Enforce NOT NULL with a default for future inserts
ALTER TABLE public.listings ALTER COLUMN borough SET NOT NULL;
ALTER TABLE public.listings ALTER COLUMN borough SET DEFAULT 'autre'::public.borough;

-- 5. Recreate public_listings view to expose borough
DROP VIEW IF EXISTS public.public_listings;
CREATE VIEW public.public_listings
WITH (security_invoker = true)
AS
SELECT
  id, created_at, author_name, contact_type, contact_value, contact_label,
  neighborhood, borough, housing_type, summary, description, practical_info, photos,
  COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', a.id, 'start_date', a.start_date, 'end_date', a.end_date, 'status', a.status
    ) ORDER BY a.start_date)
    FROM public.listing_availabilities a
    WHERE a.listing_id = l.id AND a.status = 'available'::public.availability_status
  ), '[]'::jsonb) AS availabilities
FROM public.listings l
WHERE status = 'approved'::public.listing_status;

GRANT SELECT ON public.public_listings TO anon, authenticated;