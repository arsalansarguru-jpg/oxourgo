export type Destination = {
  id: string
  title: string
  description: string
  imageUrl: string
  /** Pre-fills `/fleet` text search (hub / neighbourhood). */
  fleetLocationQuery: string
}

export const destinations: Destination[] = [
  {
    id: 'gateway',
    title: 'Gateway of India',
    description: 'Heritage icon meets sea breeze—arrive in quiet luxury.',
    imageUrl:
      'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1200&q=80',
    fleetLocationQuery: 'Colaba',
  },
  {
    id: 'marine-drive',
    title: 'Marine Drive',
    description: 'The Queen’s Necklace glows best from a refined cabin.',
    imageUrl:
      'https://images.unsplash.com/photo-1595658658481-bf7bc8a1e29f?auto=format&fit=crop&w=1200&q=80',
    fleetLocationQuery: 'Marine Drive',
  },
  {
    id: 'colaba',
    title: 'Colaba',
    description: 'Cafés, culture, and cobblestones—park with concierge ease.',
    imageUrl:
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
    fleetLocationQuery: 'Colaba',
  },
  {
    id: 'bandra',
    title: 'Bandra',
    description: 'Sea-facing sunsets and creative energy—effortless urban glide.',
    imageUrl:
      'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1200&q=80',
    fleetLocationQuery: 'Bandra',
  },
]
