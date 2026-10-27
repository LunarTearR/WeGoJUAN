import { Link } from 'react-router'
import type { ISODate } from '@/types/date'
import { useResyncTrips } from '../api/get-resync-trips'

// ชวน re-sync: ทริปที่เคย Push เป็น snapshot จะไม่เห็นวันที่เพิ่งแก้ จนกว่าจะ Push อีกครั้ง
export function ResyncBanner({ days, onDismiss }: { days: ISODate[]; onDismiss: () => void }) {
  const { data: trips } = useResyncTrips(days)

  if (!trips || trips.length === 0) {
    return null
  }
  return (
    <div className="space-y-1 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
      <p>ปฏิทินเปลี่ยนแล้ว — อัปเดตไปยังทริป:</p>
      <ul className="list-inside list-disc">
        {trips.map((t) => (
          <li key={t.id}>
            <Link to={`/trips/${t.id}?push=1`} className="underline">
              {t.title}
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onDismiss} className="text-xs underline">
        ปิด
      </button>
    </div>
  )
}
