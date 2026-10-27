import { Link } from 'react-router'
import type { ISODate } from '@/types/date'
import { useResyncTrips } from '../api/get-resync-trips'

// ชวน re-sync: ทริปที่เคย Push เป็น snapshot จะไม่เห็นวันที่เพิ่งแก้ จนกว่าจะ Push อีกครั้ง
type ResyncBannerProps = {
  days: ISODate[]
  onDismiss: () => void
  excludeTripId?: string // ไม่ชวน re-sync ทริปต้นทาง (เช่นทริปที่เพิ่งตอบรับวันยืนยัน — จะไปทริปนั้นเอง)
}

export function ResyncBanner({ days, onDismiss, excludeTripId }: ResyncBannerProps) {
  const { data } = useResyncTrips(days)
  const trips = data?.filter((t) => t.id !== excludeTripId)

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
