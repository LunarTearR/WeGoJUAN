import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDayRange } from '@/lib/date'
import { useMyTrips } from '../api/get-my-trips'
import { TripCard } from './trip-card'

export function TripList() {
  const { data: trips, isPending, error, refetch } = useMyTrips()

  if (isPending) {
    return <p className="small wg-muted">กำลังโหลดทริป…</p>
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
  if (trips.length === 0) {
    return (
      <>
        <div className="wg-card">
          <EmptyState
            title="ยังไม่มีทริปเลย"
            action={
              <Button href="/trips/new" icon="plus">
                สร้างทริปแรก
              </Button>
            }
          >
            แก๊งเงียบไปนานแล้วนะ ชวนกันไปไหนสักที่ไหม?
          </EmptyState>
        </div>
        <Banner
          tone="info"
          mood="sleepy"
          title="เริ่มจากปฏิทินก่อนก็ได้"
          actions={
            <Button variant="secondary" size="sm" icon="calendar" href="/calendar">
              ระบุวันว่าง
            </Button>
          }
        >
          ระบุวันว่างในปฏิทินของฉันครั้งเดียว ใช้ได้กับทุกทริป
        </Banner>
      </>
    )
  }

  return (
    <ul className="wg-card-grid">
      {trips.map((t) => (
        <li key={t.id}>
          <TripCard
            title={t.title}
            rangeLabel={formatDayRange(t.start_date, t.end_date)}
            durationDays={t.duration_days}
            confirmedLabel={t.confirmed_start && t.confirmed_end ? formatDayRange(t.confirmed_start, t.confirmed_end) : undefined}
            href={`/trips/${t.id}`}
          />
        </li>
      ))}
    </ul>
  )
}
