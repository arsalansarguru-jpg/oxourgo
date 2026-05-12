const LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar',
  license: 'Driving license',
  passport: 'Passport',
  selfie: 'Selfie',
}

export function formatKycDocumentType(type: string): string {
  return LABELS[type] ?? type.replace(/_/g, ' ')
}
