-- Fleet segment for public filters (H1). Falls back to price-tier mapping in app when null.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS catalog_category text;

COMMENT ON COLUMN public.vehicles.catalog_category IS 'Public catalog segment: SUV, Sedan, Hatchback, Luxury, Budget';

UPDATE public.vehicles
SET catalog_category = 'SUV'
WHERE catalog_category IS NULL
  AND (
    lower(name) LIKE '%thar%'
    OR lower(name) LIKE '%creta%'
    OR lower(name) LIKE '%sonet%'
    OR lower(brand) LIKE '%mahindra%' AND lower(name) LIKE '%thar%'
  );
