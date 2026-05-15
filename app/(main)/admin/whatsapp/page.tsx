import { AdminWhatsAppConversations } from '@/components/admin/whatsapp/admin-whatsapp-conversations'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/Button'
import { adminCountWhatsAppBookings, adminListWhatsAppConversations } from '@/lib/admin/data/whatsapp'

export const dynamic = 'force-dynamic'

export default async function AdminWhatsAppPage() {
  const [conversations, whatsappBookingsCount] = await Promise.all([
    adminListWhatsAppConversations({ status: 'active', limit: 50 }),
    adminCountWhatsAppBookings(),
  ])

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operations"
        title="WhatsApp"
        description="Conversation tracking and channel attribution — same database, availability engine, and booking lifecycle as the website."
      />

      <div className="flex flex-wrap gap-3">
        <Button to="/admin/bookings?source=whatsapp" variant="secondary">
          WhatsApp bookings
        </Button>
      </div>

      <AdminWhatsAppConversations conversations={conversations} whatsappBookingsCount={whatsappBookingsCount} />
    </div>
  )
}
