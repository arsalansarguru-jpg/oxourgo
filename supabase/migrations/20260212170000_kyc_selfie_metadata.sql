-- KYC: selfie document type + optional file metadata for audit and UX.

alter table public.kyc_documents drop constraint if exists kyc_documents_document_type_check;
alter table public.kyc_documents
  add constraint kyc_documents_document_type_check
  check (document_type in ('aadhaar', 'license', 'passport', 'selfie'));

alter table public.kyc_documents add column if not exists byte_size bigint;
alter table public.kyc_documents add column if not exists content_type text;
alter table public.kyc_documents add column if not exists original_filename text;

comment on column public.kyc_documents.byte_size is 'Declared upload size in bytes (client-reported).';
comment on column public.kyc_documents.content_type is 'MIME type at upload time.';
comment on column public.kyc_documents.original_filename is 'Sanitized client filename for support reference.';
