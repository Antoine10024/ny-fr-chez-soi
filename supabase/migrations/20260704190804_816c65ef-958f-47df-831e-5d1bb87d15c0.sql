ALTER TABLE public.listings
  ADD COLUMN management_token uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.listings
  ADD CONSTRAINT listings_management_token_key UNIQUE (management_token);