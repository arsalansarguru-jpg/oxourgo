import { getFeaturedVehiclesForHome } from '@/lib/fleet/get-featured-vehicles-home'
import { HomeView } from '@/features/home/home-view'

export async function HomePageContent() {
  const result = await getFeaturedVehiclesForHome()
  return <HomeView featuredCars={result.cars} featuredLoadFailed={false} />
}
