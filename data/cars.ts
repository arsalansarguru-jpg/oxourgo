import type { Car } from '@/types/car'

export const cars: Car[] = [
  {
    id: 'bmw-5-series',
    name: 'BMW 5 Series',
    status: 'Available',
    category: 'Luxury',
    rating: 4.9,
    reviews: 156,
    fuel: 'Petrol',
    transmission: 'Auto',
    seats: 5,
    pricePerDay: 8500,
    featured: true,
    imageUrl:
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Executive luxury sedan with refined dynamics, panoramic glass, and intuitive cockpit technology—ideal for business corridors and evening drives along Marine Drive.',
    specs: {
      Engine: '2.0L TwinPower Turbo',
      Power: '248 bhp',
      '0–100 km/h': '6.1s',
      Range: 'City + highway mixed',
      Boot: '530 L',
    },
    securityDeposit: 50000,
    unavailableDates: ['2026-05-15', '2026-05-16'],
  },
  {
    id: 'audi-q7',
    name: 'Audi Q7',
    status: 'Available',
    category: 'SUV',
    rating: 4.8,
    reviews: 203,
    fuel: 'Diesel',
    transmission: 'Auto',
    seats: 7,
    pricePerDay: 9500,
    featured: true,
    imageUrl:
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Spacious quattro SUV with air suspension comfort, three-row flexibility, and a commanding presence for Juhu sunsets and airport transfers.',
    specs: {
      Engine: '3.0L TDI',
      Power: '286 bhp',
      'Drive': 'Quattro AWD',
      Boot: '865 L (5-seat)',
      Tow: 'Not included',
    },
    securityDeposit: 60000,
    unavailableDates: ['2026-05-20'],
  },
  {
    id: 'mercedes-c-class',
    name: 'Mercedes C-Class',
    status: 'Available',
    category: 'Sedan',
    rating: 4.9,
    reviews: 187,
    fuel: 'Petrol',
    transmission: 'Auto',
    seats: 5,
    pricePerDay: 7500,
    featured: true,
    imageUrl:
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Modern luxury sedan with MBUX intelligence, serene cabin isolation, and precise steering for Bandra–Worli Sea Link cruises.',
    specs: {
      Engine: '1.5L + EQ Boost',
      Power: '204 bhp',
      Screen: '11.9" portrait MBUX',
      Sound: 'Burmester optional',
      Safety: 'ADAS package',
    },
    securityDeposit: 45000,
  },
  {
    id: 'range-rover-sport',
    name: 'Range Rover Sport',
    status: 'Available',
    category: 'SUV',
    rating: 4.9,
    reviews: 94,
    fuel: 'Petrol',
    transmission: 'Auto',
    seats: 5,
    pricePerDay: 14500,
    featured: false,
    imageUrl:
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1606016159991-234b0c4d5c5e?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Commanding SUV presence with Terrain Response, plush Windsor leather, and a floating glass cabin for statement arrivals.',
    specs: {
      Engine: '3.0L I6 MHEV',
      Power: '400 bhp',
      Wading: '900 mm',
      Suspension: 'Electronic air',
    },
    securityDeposit: 85000,
  },
  {
    id: 'honda-city',
    name: 'Honda City',
    status: 'Available',
    category: 'Sedan',
    rating: 4.6,
    reviews: 412,
    fuel: 'Petrol',
    transmission: 'Auto',
    seats: 5,
    pricePerDay: 2800,
    featured: false,
    imageUrl:
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Efficient automatic sedan with spacious rear seating—perfect for city hops and client meetings on a sensible budget.',
    specs: {
      Engine: '1.5L i-VTEC',
      Mileage: 'City optimized',
      Infotainment: '8" touchscreen',
      ADAS: 'Honda Sensing (trim)',
    },
    securityDeposit: 15000,
    unavailableDates: ['2026-05-11'],
  },
  {
    id: 'maruti-swift',
    name: 'Maruti Swift',
    status: 'Available',
    category: 'Hatchback',
    rating: 4.5,
    reviews: 528,
    fuel: 'Petrol',
    transmission: 'Manual',
    seats: 5,
    pricePerDay: 1800,
    featured: false,
    imageUrl:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Nimble hatchback with great visibility for Mumbai traffic. Manual control when you want maximum efficiency.',
    specs: {
      Engine: '1.2L DualJet',
      Transmission: '5-speed MT',
      Efficiency: 'High city MPG',
      Parking: 'Compact footprint',
    },
    securityDeposit: 10000,
  },
  {
    id: 'porsche-macan',
    name: 'Porsche Macan',
    status: 'Unavailable',
    category: 'Luxury',
    rating: 5.0,
    reviews: 48,
    fuel: 'Petrol',
    transmission: 'Auto',
    seats: 5,
    pricePerDay: 18500,
    featured: false,
    imageUrl:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80',
    ],
    description:
      'Sports SUV DNA with razor responses—currently reserved for an extended corporate lease.',
    specs: {
      Engine: '2.0L Turbo',
      Power: '265 bhp',
      Chassis: 'PASM optional',
    },
    securityDeposit: 100000,
  },
]

export function getCarById(id: string) {
  return cars.find((c) => c.id === id)
}

export const fleetFilters = [
  'SUV',
  'Sedan',
  'Hatchback',
  'Luxury',
  'Budget',
  'Automatic',
  'Manual',
] as const

export type FleetFilterId = (typeof fleetFilters)[number]
