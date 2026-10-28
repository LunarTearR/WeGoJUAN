import { IconButton } from '@/components/ui/icon-button'

type MonthNavProps = {
  year: number
  month: number // 1-12
  onPrev?: () => void // ไม่ส่ง = ปุ่มกดไม่ได้ (เช่นสุดช่วงวันของทริป)
  onNext?: () => void
}

// หัวเดือนของทั้งสองปฏิทิน: ชื่อเดือนแบบ th-TH ("ธันวาคม 2569") อ่านออกเสียงให้ทุกครั้งที่เปลี่ยน
export function MonthNav({ year, month, onPrev, onNext }: MonthNavProps) {
  const title = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
  return (
    <div className="wg-monthnav">
      <IconButton icon="chevron-left" label="เดือนก่อนหน้า" onClick={onPrev} disabled={!onPrev} />
      <h2 className="wg-monthnav__title heading" aria-live="polite">
        {title}
      </h2>
      <IconButton icon="chevron-right" label="เดือนถัดไป" onClick={onNext} disabled={!onNext} />
    </div>
  )
}
