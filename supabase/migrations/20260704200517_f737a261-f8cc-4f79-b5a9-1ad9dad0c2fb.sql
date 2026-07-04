CREATE TABLE public.listing_inquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  visitor_first_name text NOT NULL,
  visitor_email text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  message text NOT NULL,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_inquiries_dates_check CHECK (end_date >= start_date)
);

GRANT INSERT ON public.listing_inquiries TO anon, authenticated;
GRANT ALL ON public.listing_inquiries TO service_role;

ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an inquiry for an approved listing"
  ON public.listing_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_inquiries.listing_id
        AND l.status = 'approved'
    )
  );

CREATE INDEX listing_inquiries_listing_id_idx
  ON public.listing_inquiries (listing_id, created_at DESC);

CREATE TRIGGER update_listing_inquiries_updated_at
  BEFORE UPDATE ON public.listing_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();