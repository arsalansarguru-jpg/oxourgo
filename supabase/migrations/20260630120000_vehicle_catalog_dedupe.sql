-- Soft-delete duplicate catalog vehicles (keep featured + newest per registration or brand+name).

with ranked as (
  select
    id,
    row_number() over (
      partition by case
        when nullif(trim(registration_number), '') is not null
          then lower(trim(registration_number))
        else lower(trim(brand)) || '|' || lower(trim(name))
      end
      order by featured desc nulls last, created_at desc nulls last
    ) as rn
  from public.vehicles
  where deleted_at is null
)
update public.vehicles v
set deleted_at = now()
from ranked r
where v.id = r.id
  and r.rn > 1;

-- Normalize catalog segments for common launch fleet (price-only SUV mis-tags).
update public.vehicles
set catalog_category = case
  when lower(trim(brand || ' ' || name)) ~ '(thar|creta|sonet|fortuner|scorpio|xuv|seltos|venue|harrier|hector|compass|safari|tucson|kodiaq|gloster)'
    then 'SUV'
  when price_per_day >= 10000 then 'Luxury'
  when price_per_day <= 3000 then 'Budget'
  when price_per_day >= 7000 then 'SUV'
  when price_per_day >= 4000 then 'Sedan'
  else coalesce(nullif(trim(catalog_category), ''), 'Hatchback')
end
where deleted_at is null
  and (
    catalog_category is null
    or trim(catalog_category) = ''
    or catalog_category = 'SUV' and lower(trim(brand || ' ' || name)) ~ '(creta|sonet)'
  );
