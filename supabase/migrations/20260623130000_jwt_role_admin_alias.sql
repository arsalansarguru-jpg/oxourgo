-- Normalize legacy JWT role value `admin` → ops_admin for RLS helpers (mirrors lib/auth/roles.ts).

create or replace function public.jwt_oxour_app_role ()
  returns text
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select nullif(
    trim(
      coalesce(
        auth.jwt() -> 'app_metadata' ->> 'oxour_role',
        auth.jwt() -> 'app_metadata' ->> 'role',
        auth.jwt() -> 'user_metadata' ->> 'oxour_role',
        auth.jwt() -> 'user_metadata' ->> 'role',
        ''
      )
    ),
    ''
  );
$$;

create or replace function public.jwt_oxour_app_role_normalized ()
  returns text
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select case lower(public.jwt_oxour_app_role ())
    when 'admin' then 'ops_admin'
    when 'administrator' then 'ops_admin'
    when 'super_admin' then 'ops_admin'
    when 'fleet_host' then 'fleet_manager'
    else public.jwt_oxour_app_role ()
  end;
$$;

create or replace function public.is_ops_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role_normalized () in ('ops_admin', 'super_admin');
$$;

create or replace function public.is_admin_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role_normalized () in (
    'ops_admin',
    'super_admin',
    'fleet_manager',
    'fleet_host',
    'finance_manager',
    'kyc_reviewer',
    'support_agent'
  );
$$;

create or replace function public.is_fleet_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role_normalized () in ('ops_admin', 'super_admin', 'fleet_manager', 'fleet_host');
$$;

create or replace function public.is_finance_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role_normalized () in ('ops_admin', 'super_admin', 'finance_manager');
$$;

create or replace function public.is_kyc_staff ()
  returns boolean
  language sql
  stable
  security invoker
  set search_path = public
as $$
  select public.jwt_oxour_app_role_normalized () in ('ops_admin', 'super_admin', 'kyc_reviewer');
$$;

comment on function public.jwt_oxour_app_role_normalized is 'Canonical Oxour app role for RLS (legacy aliases normalized).';

grant execute on function public.jwt_oxour_app_role_normalized () to anon, authenticated;
