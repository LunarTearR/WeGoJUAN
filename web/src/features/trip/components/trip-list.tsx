import { Link } from 'react-router'
import { useMyTrips } from '../api/get-my-trips'

export function TripList() {
  const { data: trips, isPending, error } = useMyTrips()

  if (isPending) {
    return <p className="text-gray-500">กำลังโหลดทริป…</p>
  }
  if (error) {
    return <p className="text-red-700">โหลดทริปไม่สำเร็จ: {error.message}</p>
  }
  if (trips.length === 0) {
    return <p>ยังไม่มีทริป ลองสร้างทริปแรกดู</p>
  }

  return (
    <ul className="space-y-2">
      {trips.map((t) => (
        <li key={t.id}>
          <Link to={`/trips/${t.id}`} className="block rounded border border-gray-200 p-3 hover:bg-gray-50">
            <span className="font-medium">{t.title}</span>
            <span className="block text-sm text-gray-600">
              {t.start_date} ถึง {t.end_date} · ไป {t.duration_days} วัน
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
