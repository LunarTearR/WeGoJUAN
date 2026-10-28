import { useState } from 'react'
import { CalendarLegend } from '@/components/calendar/calendar-legend'
import { DayCell } from '@/components/calendar/day-cell'
import { MonthGrid } from '@/components/calendar/month-grid'
import { MonthNav } from '@/components/calendar/month-nav'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { eachDay, formatThaiDay, monthOf, todayISO } from '@/lib/date'
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

// ปฏิทินในทริป: พื้นช่อง = Mark ของฉัน, ป้าย 2 ตัวอักษร = เพื่อนที่ระบุแล้ว (กลมว่าง/เหลี่ยมไม่ว่าง, ไม่ระบุไม่แสดง)
// กดวัน = เปิดแผงตั้งวันของฉัน และดูชื่อเต็มของเพื่อน · ไม่มีเหตุผลส่วนตัวในทริปเด็ดขาด
export function TripCalendar({ trip, members, me }: TripCalendarProps) {
  const { data: marks, isPending, error, refetch } = useTripMarks(trip.id)
  const saveMutation = useSaveMyTripMarks(trip.id, me.id)
  const [shown, setShown] = useState(() => monthOf(trip.confirmed_start ?? trip.start_date))
  const [selected, setSelected] = useState<ISODate | null>(null)
  // อ่านวันนี้ครั้งเดียวตอน mount (เรียก new Date() ตรงๆ ตอน render ไม่ pure)
  const [today] = useState(todayISO)

  if (isPending) {
    return <p className="small wg-muted">กำลังนับหัวเพื่อน…</p>
  }
  if (error) {
    return (
      <Banner
        tone="danger"
        title="โหลดไม่สำเร็จ"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            ลองอีกครั้ง
          </Button>
        }
      >
        {error.message}
      </Banner>
    )
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
    <div className="wg-stack">
      <p className="small wg-muted">แตะวันเพื่อตั้งวันของฉัน แล้วดูว่าใครว่างบ้าง</p>
      {saveMutation.error && (
        <Banner tone="danger" title="อุ๊ย บันทึกไม่สำเร็จ">
          {saveMutation.error.message}
        </Banner>
      )}
      <MonthNav
        year={shown.year}
        month={shown.month}
        onPrev={monthIndex(shown) > monthIndex(first) ? () => move(-1) : undefined}
        onNext={monthIndex(shown) < monthIndex(last) ? () => move(1) : undefined}
      />
      <MonthGrid
        year={shown.year}
        month={shown.month}
        renderDay={(day, n) =>
          inRange(day) ? (
            <DayCell
              day={n}
              variant="trip"
              status={get(me.id, day)}
              friends={friends.map((f) => ({ name: f.display_name, status: get(f.id, day) }))}
              confirmed={confirmed.has(day)}
              selected={selected === day}
              today={today === day}
              dateLabel={formatThaiDay(day)}
              onClick={() => setSelected(day)}
            />
          ) : (
            <DayCell day={n} variant="trip" outside />
          )
        }
      />
      <CalendarLegend trip confirmed={confirmed.size > 0} />
      {selected && (
        <DayPanel
          day={selected}
          mine={get(me.id, selected)}
          friends={friends.map((member) => ({ member, status: get(member.id, selected) }))}
          isConfirmed={confirmed.has(selected)}
          onSet={(status) => saveMutation.mutate([{ day: selected, status }])}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
