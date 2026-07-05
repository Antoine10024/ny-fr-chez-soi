
-- 1. Drop obsolete policies on public.listings (public reads now go through the view; inserts go through service_role)
DROP POLICY IF EXISTS "Public can read approved listings" ON public.listings;
DROP POLICY IF EXISTS "Anyone can submit a pending listing" ON public.listings;

-- 2. Revoke all direct access from anon / authenticated / PUBLIC on the base table
REVOKE ALL ON public.listings FROM PUBLIC;
REVOKE ALL ON public.listings FROM anon;
REVOKE ALL ON public.listings FROM authenticated;

-- Keep service_role full access for server-side (admin) operations
GRANT ALL ON public.listings TO service_role;

-- Keep RLS enabled as a fail-closed safety layer
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 3. Recreate the public view WITHOUT sensitive/contact columns.
--    security_invoker=false so the view runs as its owner (postgres) and can
--    read the base table even though anon/authenticated have no direct grants.
DROP VIEW IF EXISTS public.public_listings;

CREATE VIEW public.public_listings
WITH (security_invoker=false) AS
SELECT
  l.id,
  l.created_at,
  l.author_name,
  l.neighborhood,
  l.borough,
  l.housing_type,
  l.category,
  l.summary,
  l.description,
  l.practical_info,
  l.photos,
  COALESCE(
    (SELECT jsonb_agg(
              jsonb_build_object(
                'id', a.id,
                'start_date', a.start_date,
                'end_date', a.end_date,
                'status', a.status
              ) ORDER BY a.start_date
            )
       FROM public.listing_availabilities a
      WHERE a.listing_id = l.id
        AND a.status = 'available'::availability_status),
    '[]'::jsonb
  ) AS availabilities
FROM public.listings l
WHERE l.status = 'approved'::listing_status;

-- 4. Grants on the view: read-only for anon and authenticated
REVOKE ALL ON public.public_listings FROM PUBLIC;
GRANT SELECT ON public.public_listings TO anon;
GRANT SELECT ON public.public_listings TO authenticated;
GRANT ALL ON public.public_listings TO service_role;
