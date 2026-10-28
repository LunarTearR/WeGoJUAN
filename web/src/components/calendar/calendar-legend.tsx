import { Initials } from '@/components/ui/initials'
import { cx } from '@/lib/cx'

type CalendarLegendProps = {
  trip?: boolean // เพิ่มคำว่าฉัน/เพื่อน และป้ายสองรูปทรงของเพื่อน
  confirmed?: boolean // เพิ่มกรอบวันที่ยืนยัน
  reason?: boolean // เพิ่มจุดเหตุผลส่วนตัว
  className?: string
}

// คำอธิบายใต้ปฏิทิน — บนมือถือต้องมีเสมอ
export function CalendarLegend({ trip, confirmed, reason, className }: CalendarLegendProps) {
  return (
    <div className={cx('wg-legend', 'caption', className)}>
      <span className="wg-legend__item">
        <span className="wg-legend__swatch wg-legend__swatch--free" />
        {trip ? 'ฉันว่าง' : 'ว่าง'}
      </span>
      <span className="wg-legend__item">
        <span className="wg-legend__swatch wg-legend__swatch--busy" />
        {trip ? 'ฉันไม่ว่าง' : 'ไม่ว่าง'}
      </span>
      <span className="wg-legend__item">
        <span className="wg-legend__swatch wg-legend__swatch--unknown" />
        ยังไม่ระบุ
      </span>
      {trip && (
        <>
          <span className="wg-legend__item">
            <Initials name="เพื่อน" status="free" label="ป้ายเพื่อนว่าง" />
            เพื่อนว่าง
          </span>
          <span className="wg-legend__item">
            <Initials name="เพื่อน" status="busy" label="ป้ายเพื่อนไม่ว่าง" />
            เพื่อนไม่ว่าง
          </span>
        </>
      )}
      {confirmed && (
        <span className="wg-legend__item">
          <span className="wg-legend__swatch wg-legend__swatch--confirmed" />
          วันที่ยืนยัน
        </span>
      )}
      {reason && (
        <span className="wg-legend__item">
          <span className="wg-legend__dot" />
          มีเหตุผล
        </span>
      )}
    </div>
  )
}
