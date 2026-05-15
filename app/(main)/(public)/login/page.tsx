import { redirect } from 'next/navigation'

import { getBusinessWhatsAppUrl } from '@/lib/business-contact'
import { softLaunchInquiryMessageForPath } from '@/lib/soft-launch/disabled-routes'

export const dynamic = 'force-dynamic'

/** Account sign-in is paused — inquiries via WhatsApp. */
export default function LoginPage() {
  redirect(getBusinessWhatsAppUrl(softLaunchInquiryMessageForPath('/login')))
}
