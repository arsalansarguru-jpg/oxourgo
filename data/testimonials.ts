export type Testimonial = {
  id: string
  name: string
  role: string
  quote: string
  rating: number
  verifiedLabel: string
  initials: string
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Arjun Mehta',
    role: 'Entrepreneur',
    quote:
      'Exceptional service! The BMW I rented was spotless and the booking process was seamless. Perfect for my business trips in Mumbai.',
    rating: 5,
    verifiedLabel: 'Verified booking · Mar 2026',
    initials: 'AM',
  },
  {
    id: '2',
    name: 'Priya Sharma',
    role: 'Travel Blogger',
    quote:
      'Oxour Go made my Mumbai trip unforgettable. The Audi Q7 was a dream to drive, and the 24/7 support team was incredibly helpful.',
    rating: 5,
    verifiedLabel: 'Verified booking · Jan 2026',
    initials: 'PS',
  },
  {
    id: '3',
    name: 'Rajesh Kumar',
    role: 'Tech Professional',
    quote:
      'Premium quality cars at transparent prices. No hidden charges, verified vehicles, and instant booking. Highly recommended!',
    rating: 5,
    verifiedLabel: 'Verified booking · Feb 2026',
    initials: 'RK',
  },
]
