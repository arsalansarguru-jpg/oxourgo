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
    imageUrl: '/media/destinations/gateway-of-india.png',
    fleetLocationQuery: 'Colaba',
  },
  {
    id: 'marine-drive',
    title: 'Marine Drive',
    description: 'The Queen’s Necklace glows best from a refined cabin.',
    imageUrl: '/media/destinations/marine-drive.png',
    fleetLocationQuery: 'Marine Drive',
  },
  {
    id: 'colaba',
    title: 'Colaba',
    description: 'Cafés, culture, and cobblestones—park with concierge ease.',
    imageUrl: '/media/destinations/colaba.png',
    fleetLocationQuery: 'Colaba',
  },
  {
    id: 'bandra',
    title: 'Bandra',
    description: 'Sea-facing sunsets and creative energy—effortless urban glide.',
    imageUrl: '/media/destinations/bandra.png',
    fleetLocationQuery: 'Bandra',
  },
]
