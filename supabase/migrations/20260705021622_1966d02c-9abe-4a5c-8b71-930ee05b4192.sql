CREATE OR REPLACE VIEW public.public_listings
WITH (security_invoker=true) AS
SELECT
  id,
  created_at,
  author_name,
  contact_type,
  contact_value,
  contact_label,
  neighborhood,
  borough,
  housing_type,
  summary,
  description,
  practical_info,
  photos,
  COALESCE(
    (SELECT jsonb_agg(
       jsonb_build_object(
         'id', a.id,
         'start_date', a.start_date,
         'end_date', a.end_date,
         'status', a.status
       )
       ORDER BY a.start_date
     )
     FROM listing_availabilities a
     WHERE a.listing_id = l.id AND a.status = 'available'::availability_status),
    '[]'::jsonb
  ) AS availabilities,
  category
FROM listings l
WHERE status = 'approved'::listing_status;