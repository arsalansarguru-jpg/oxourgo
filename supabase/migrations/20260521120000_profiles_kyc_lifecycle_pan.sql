-- Profile KYC lifecycle columns + PAN document type.
-- Booking eligibility uses kyc_status + verification_tier (app sync keeps them aligned).

-- ---------------------------------------------------------------------------
-- kyc_documents: allow PAN uploads
-- ---------------------------------------------------------------------------
alter table public.kyc_documents drop constraint if exists kyc_documents_document_type_check;
alter table public.kyc_documents
  add constraint kyc_documents_document_type_check
  check (document_type in ('aadhaar', 'license', 'passport', 'selfie', 'pan'));

-- ---------------------------------------------------------------------------
-- profiles: coarse lifecycle for UX and booking gates
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists kyc_status text not null default 'not_started'
  check (kyc_status in ('not_started', 'pending', 'approved', 'rejected'));

alter table public.profiles add column if not exists kyc_submitted_at timestamptz;
alter table public.profiles add column if not exists kyc_approved_at timestamptz;

comment on column public.profiles.kyc_status is 'KYC lifecycle for UX; synced from kyc_documents by the app.';
comment on column public.profiles.kyc_submitted_at is 'Timestamp of first KYC document upload (cleared if no documents remain).';
comment on column public.profiles.kyc_approved_at is 'When the KYC gate last cleared (license + selfie + govt ID).';

-- Backfill from existing rows (safe to re-run)
update public.profiles p
set
  kyc_status = case
    when p.verification_tier = 'verified' then 'approved'
    when exists (select 1 from public.kyc_documents k where k.user_id = p.user_id) then 'pending'
    else 'not_started'
  end,
  kyc_submitted_at = (
    select min(k.created_at) from public.kyc_documents k where k.user_id = p.user_id
  ),
  kyc_approved_at = case
    when p.verification_tier = 'verified' then coalesce(
      (
        select max(k.reviewed_at)
        from public.kyc_documents k
        where k.user_id = p.user_id and k.status = 'approved' and k.reviewed_at is not null
      ),
      p.updated_at
    )
    else null
  end
where true;

-- Storage: KYC bucket remains private; path prefix = auth uid (see 20260212140000).
-- Admin review uses the Supabase service role (bypasses RLS) for signed URLs.
