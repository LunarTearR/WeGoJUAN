import { eachDay } from '@/lib/date'
import { useClearConfirmed } from '../api/confirm-dates'
import { useTripMarks } from '../api/get-trip-marks'
import type { Member, Trip } from '../types'

type ConfirmedDatesProps = {
  trip: Trip
  members: Member[]
  isOrganizer: boolean
}

// สถานะทริป: กำลังหาวัน / ยืนยันแล้ว + เตือนถ้ามีสมาชิกไม่ว่างในวันที่ยืนยัน
export function ConfirmedDates({ trip, members, isOrganizer }: ConfirmedDatesProps) {
  const { data: marks } = useTripMarks(trip.id)
  const clearMutation = useClearConfirmed(trip.id)

  if (!trip.confirmed_start || !trip.confirmed_end) {
    return <p className="inline-block rounded bg-gray-100 px-2 py-1 text-sm text-gray-700">กำลังหาวัน</p>
  }

  const days = new Set(eachDay(trip.confirmed_start, trip.confirmed_end))
  const busyIds = new Set((marks ?? []).filter((m) => m.status === 'busy' && days.has(m.day)).map((m) => m.member_id))
  const busyNames = members.filter((m) => busyIds.has(m.id)).map((m) => m.display_name)

  return (
    <div className="space-y-1 rounded border border-green-300 bg-green-50 p-3 text-sm">
      <p className="font-medium">
        ยืนยันแล้ว: {trip.confirmed_start} ถึง {trip.confirmed_end}
      </p>
      {busyNames.length > 0 && <p className="text-red-700">ไม่ว่างในวันที่ยืนยัน: {busyNames.join(', ')}</p>}
      {isOrganizer && (
        <button type="button" disabled={clearMutation.isPending} onClick={() => clearMutation.mutate()} className="text-xs underline">
          ยกเลิกวันที่ยืนยัน
        </button>
      )}
    </div>
  )
}
