-- KYC: resubmission workflow + customer-visible rejection reasons.
-- Preserves profiles.kyc_status architecture; app sync recomputes from kyc_documents.

-- ---------------------------------------------------------------------------
-- kyc_documents: extend status + add rejection_reason
-- ---------------------------------------------------------------------------
alter table public.kyc_documents drop constraint if exists kyc_documents_status_check;

alter table public.kyc_documents
  add constraint kyc_documents_status_check check (
    status in (
      'pending',
      'reviewing',
      'approved',
      'rejected',
      'resubmission_required'
    )
  );

alter table public.kyc_documents add column if not exists rejection_reason text;

comment on column public.kyc_documents.rejection_reason is
  'Customer-visible explanation when status is rejected or resubmission_required; optional internal context may still use reviewer_note.';

comment on column public.kyc_documents.reviewer_note is
  'Optional staff-only note; not shown to customers when rejection_reason is set.';

-- ---------------------------------------------------------------------------
-- profiles: allow resubmission_required aggregate status
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_kyc_status_check;

alter table public.profiles
  add constraint profiles_kyc_status_check check (
    kyc_status in (
      'not_started',
      'pending',
      'approved',
      'rejected',
      'resubmission_required'
    )
  );
