import { useState } from 'react'
import { MonthGrid } from '@/components/calendar/month-grid'
import { MonthNav } from '@/components/calendar/month-nav'
import { eachDay, monthOf } from '@/lib/date'
import { initials } from '@/lib/initials'
import { statusClass, statusLabel } from '@/lib/mark'
import type { ISODate } from '@/types/date'
import type { Status } from '@/types/mark'
import { useTripMarks } from '../api/get-trip-marks'
import { useSaveMyTripMarks } from '../api/save-my-trip-marks'
import type { Member, Trip } from '../types'
import { DayPanel } from './day-panel'

type TripCalendarProps = {
  trip: Trip
  members: Member[]
  me: Member
}

const monthIndex = ({ year, month }: { year: number; month: number }) => year * 12 + month

// ปฏิทินในทริป: พื้นช่อง = Mark ของฉัน, ป้าย 2 ตัวอักษร = เพื่อนที่ระบุแล้ว (เขียวว่าง/แดงไม่ว่าง, ไม่ระบุไม่แสดง)
// กดวัน = เปิดแผงตั้งวันของฉัน และดูชื่อเต็มของเพื่อน
export function TripCalendar({ trip, members, me }: TripCalendarProps) {
  const { data: marks, isPending, error } = useTripMarks(trip.id)
  const saveMutation = useSaveMyTripMarks(trip.id, me.id)
  const [shown, setShown] = useState(() => monthOf(trip.confirmed_start ?? trip.start_date))
  const [selected, setSelected] = useState<ISODate | null>(null)

  if (isPending) {
    return <p className="text-gray-500">กำลังโหลดวันว่างของสมาชิก…</p>
  }
  if (error) {
    return <p className="text-red-700">โหลดวันว่างไม่สำเร็จ: {error.message}</p>
  }

  const statusOf = new Map<string, Status>(marks.map((m) => [`${m.member_id}|${m.day}`, m.status]))
  const get = (memberId: string, day: ISODate) => statusOf.get(`${memberId}|${day}`) ?? null
  const friends = members.filter((m) => m.id !== me.id)
  const confirmed = new Set(trip.confirmed_start && trip.confirmed_end ? eachDay(trip.confirmed_start, trip.confirmed_end) : [])
  const inRange = (day: ISODate) => day >= trip.start_date && day <= trip.end_date
  const first = monthOf(trip.start_date)
  const last = monthOf(trip.end_date)

  function move(delta: number) {
    setShown(({ year, month }) => {
      const d = new Date(year, month - 1 + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">กดวันเพื่อตั้งวันของฉัน และดูว่าใครว่าง</p>
      {saveMutation.error && <p className="text-sm text-red-700">บันทึกไม่สำเร็จ: {saveMutation.error.message}</p>}
      <MonthNav
        year={shown.year}
        month={shown.month}
        onPrev={monthIndex(shown) > monthIndex(first) ? () => move(-1) : undefined}
        onNext={monthIndex(shown) < monthIndex(last) ? () => move(1) : undefined}
      />
      <MonthGrid
        year={shown.year}
        month={shown.month}
        renderDay={(day, n) => {
          if (!inRange(day)) {
            return <div className="min-h-18 rounded border border-gray-100 bg-gray-50 p-0.5 text-left text-xs text-gray-300">{n}</div>
          }
          const mine = get(me.id, day)
          const isConfirmed = confirmed.has(day)
          return (
            <button
              type="button"
              aria-label={`${day} ${me.display_name}${isConfirmed ? ' (วันที่ยืนยัน)' : ''} ${statusLabel[mine ?? 'unknown']}`}
              aria-pressed={selected === day}
              onClick={() => setSelected(day)}
              className={`flex min-h-18 w-full flex-col items-start rounded border p-0.5 text-left text-xs ${statusClass(mine)} ${
                isConfirmed ? 'ring-2 ring-inset ring-blue-600' : ''
              } ${selected === day ? 'outline-2 outline-gray-900' : ''}`}
            >
              <span className="font-semibold">{n}</span>
              <span className="mt-0.5 flex flex-wrap gap-0.5">
                {friends.map((f) => {
                  const s = get(f.id, day)
                  if (s === null) return null
                  return (
                    <span
                      key={f.id}
                      role="img"
                      aria-label={`${day} ${f.display_name} ${statusLabel[s]}`}
                      className={`min-w-5 rounded-full px-0.5 text-center text-[9px] leading-4 text-white ${s === 'free' ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                      {initials(f.display_name)}
                    </span>
                  )
                })}
              </span>
            </button>
          )
        }}
      />
      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
        <span>พื้นช่อง = ของฉัน</span>
        <span className="text-green-700">● เพื่อนว่าง</span>
        <span className="text-red-700">● เพื่อนไม่ว่าง</span>
        {confirmed.size > 0 && <span className="text-blue-700">▢ วันที่ยืนยัน</span>}
      </div>
      {selected && (
        <DayPanel
          day={selected}
          mine={get(me.id, selected)}
          friends={friends.map((member) => ({ member, status: get(member.id, selected) }))}
          isConfirmed={confirmed.has(selected)}
          onSet={(status) => saveMutation.mutate([{ day: selected, status }])}
        />
      )}
    </div>
  )
}
