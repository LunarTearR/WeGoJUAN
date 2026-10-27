import { Link } from 'react-router'
import { TripList } from '@/features/trip/components/trip-list'

export function TripsRoute() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ทริปของฉัน</h1>
        <Link to="/trips/new" className="rounded bg-gray-900 px-3 py-2 text-sm text-white">
          สร้างทริป
        </Link>
      </div>
      <TripList />
    </section>
  )
}
