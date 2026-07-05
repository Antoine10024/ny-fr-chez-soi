CREATE TYPE public.listing_category AS ENUM ('sejour_temporaire', 'reprise_bail', 'colocation');

ALTER TABLE public.listings
  ADD COLUMN category public.listing_category NOT NULL DEFAULT 'sejour_temporaire';

CREATE INDEX listings_category_idx ON public.listings (category);