export type SupportMessageRow = {
  id: string
  conversationId: string
  senderRole: 'customer' | 'staff' | 'system'
  body: string
  createdAt: string
}

export type SupportConversationRow = {
  id: string
  userId: string
  status: string
  lastMessageAt: string
}
