import { eachDay } from '@/lib/date'
import { nextStatus, statusClass, statusLabel } from '@/lib/mark'
import type { Status } from '@/types/mark'
import { useTripMarks } from '../api/get-trip-marks'
import { useSaveMyTripMarks } from '../api/save-my-trip-marks'
import type { Member, Trip } from '../types'

type TripMarksGridProps = {
  trip: Trip
  members: Member[]
  me: Member
}

// แถว = วันใน Date Range, คอลัมน์ = สมาชิก — ทุกคนเห็นของกันและกันตามชื่อ แต่กดได้เฉพาะคอลัมน์ของตัวเอง
export function TripMarksGrid({ trip, members, me }: TripMarksGridProps) {
  const { data: marks, isPending, error } = useTripMarks(trip.id)
  const saveMutation = useSaveMyTripMarks(trip.id, me.id)

  if (isPending) {
    return <p className="text-gray-500">กำลังโหลดวันว่างของสมาชิก…</p>
  }
  if (error) {
    return <p className="text-red-700">โหลดวันว่างไม่สำเร็จ: {error.message}</p>
  }

  const statusOf = new Map<string, Status>(marks.map((m) => [`${m.member_id}|${m.day}`, m.status]))
  const days = eachDay(trip.start_date, trip.end_date)

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">กดช่องในคอลัมน์ของคุณเพื่อสลับ ว่าง → ไม่ว่าง → ยังไม่ระบุ</p>
      {saveMutation.error && <p className="text-sm text-red-700">บันทึกไม่สำเร็จ: {saveMutation.error.message}</p>}
      <div className="max-h-[70vh] overflow-auto rounded border border-gray-200">
        <table className="w-full border-separate border-spacing-1 text-sm">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className="text-left font-normal text-gray-500">วันที่</th>
              {members.map((m) => (
                <th key={m.id} className={`px-1 font-medium ${m.id === me.id ? 'underline' : ''}`}>
                  {m.display_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td className="whitespace-nowrap pr-2 text-gray-600">{day}</td>
                {members.map((m) => {
                  const status = statusOf.get(`${m.id}|${day}`) ?? null
                  const label = `${day} ${m.display_name} ${statusLabel[status ?? 'unknown']}`
                  const cls = `h-8 min-w-12 rounded border ${statusClass(status)}`
                  return (
                    <td key={m.id}>
                      {m.id === me.id ? (
                        <button
                          type="button"
                          aria-label={label}
                          onClick={() => saveMutation.mutate([{ day, status: nextStatus(status) }])}
                          className={`w-full ${cls}`}
                        />
                      ) : (
                        <div role="img" aria-label={label} className={cls} />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
