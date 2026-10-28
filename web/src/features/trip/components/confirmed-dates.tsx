import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { StatusIcon } from '@/components/ui/status-icon'
import { eachDay, formatWeekdayRange } from '@/lib/date'
import { useClearConfirmed } from '../api/confirm-dates'
import { useTripMarks } from '../api/get-trip-marks'
import type { Member, Trip } from '../types'

type ConfirmedDatesProps = {
  trip: Trip
  members: Member[]
  isOrganizer: boolean
}

// สถานะทริปบนสุดของหน้า: การ์ดเส้นประ "กำลังหาวัน" หรือการ์ดส้ม "ยืนยันแล้ว!" (การ์ดส้มอันเดียวของหน้า)
// + เตือนถ้ามีสมาชิกไม่ว่างในวันที่ยืนยัน ให้ผู้จัดตามต่อ
export function ConfirmedDates({ trip, members, isOrganizer }: ConfirmedDatesProps) {
  const { data: marks } = useTripMarks(trip.id)
  const clearMutation = useClearConfirmed(trip.id)

  if (!trip.confirmed_start || !trip.confirmed_end) {
    return (
      <div className="wg-finding">
        <StatusIcon kind="finding" size={40} />
        <div className="wg-finding__body">
          <p className="body-strong">กำลังหาวัน</p>
          <p className="wg-finding__hint small">ช่วยกันระบุวันว่าง แล้วผู้จัดจะเลือกช่วงที่ลงตัวที่สุด</p>
        </div>
      </div>
    )
  }

  const days = new Set(eachDay(trip.confirmed_start, trip.confirmed_end))
  const busyIds = new Set((marks ?? []).filter((m) => m.status === 'busy' && days.has(m.day)).map((m) => m.member_id))
  const busyNames = members.filter((m) => busyIds.has(m.id)).map((m) => m.display_name)

  return (
    <section className="wg-confirmed" aria-label="วันที่ยืนยัน">
      <StatusIcon kind="confirmed" size={56} stamp />
      <div className="wg-confirmed__body">
        <p className="wg-confirmed__eyebrow small font-semibold">ยืนยันแล้ว!</p>
        <p className="wg-confirmed__dates title">{formatWeekdayRange(trip.confirmed_start, trip.confirmed_end)}</p>
        <p className="wg-confirmed__note small">จดไว้เลย ห้ามเทนะ</p>
        {busyNames.length > 0 && <p className="wg-confirmed__warn small">ไม่ว่างในวันที่ยืนยัน: {busyNames.join(', ')}</p>}
        {isOrganizer && (
          <Button variant="ghost" size="sm" loading={clearMutation.isPending} onClick={() => clearMutation.mutate()}>
            ยกเลิกวันที่ยืนยัน
          </Button>
        )}
        {clearMutation.error && (
          <Banner tone="danger" className="mt-2">
            ยกเลิกไม่สำเร็จ: {clearMutation.error.message}
          </Banner>
        )}
      </div>
    </section>
  )
}
