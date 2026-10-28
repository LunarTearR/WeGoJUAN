import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
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
    <Banner
      tone="honey"
      title="ปฏิทินเปลี่ยนแล้ว"
      onDismiss={onDismiss}
      actions={trips.map((t) => (
        <Button key={t.id} variant="secondary" size="sm" icon="refresh" href={`/trips/${t.id}?push=1`}>
          {t.title}
        </Button>
      ))}
    >
      อัปเดตไปยังทริปเหล่านี้ด้วยไหม?
    </Banner>
  )
}
