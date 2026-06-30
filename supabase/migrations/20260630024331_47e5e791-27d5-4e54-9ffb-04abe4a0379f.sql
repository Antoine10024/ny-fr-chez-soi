GRANT SELECT ON public.public_listings TO anon, authenticated;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='listings' AND policyname='Public can read approved listings') THEN
    CREATE POLICY "Public can read approved listings" ON public.listings FOR SELECT TO anon, authenticated USING (status = 'approved');
  END IF;
END $$;