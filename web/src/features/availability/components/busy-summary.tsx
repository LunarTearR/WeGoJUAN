import { Pill } from '@/components/ui/pill'
import { StatusIcon } from '@/components/ui/status-icon'
import { formatDayRange } from '@/lib/date'
import type { ISODate } from '@/types/date'
import { useMyMarks } from '../api/get-my-marks'
import { busyRuns } from '../utils/busy-runs'
import { monthRange } from '../utils/month-range'

type BusySummaryProps = {
  year: number
  month: number // 1-12
  onSelect: (day: ISODate) => void
}

// สรุปวันไม่ว่างของเดือนที่แสดง พร้อมเหตุผล (เห็นแค่เจ้าของ) — กดแถวเพื่อเปิดวันแรกของช่วงนั้น
// ใช้ query เดียวกับปฏิทิน (cache ร่วมกัน ไม่ยิงซ้ำ)
export function BusySummary({ year, month, onSelect }: BusySummaryProps) {
  const { from, to } = monthRange(year, month)
  const { data: marks } = useMyMarks(from, to)

  if (!marks) {
    return null
  }
  // ระหว่างบันทึกช่วงข้ามเดือน optimistic update อาจใส่วันเดือนอื่นมาในรายการชั่วคราว — สรุปเฉพาะเดือนที่แสดง
  const runs = busyRuns(marks.filter((m) => m.day >= from && m.day <= to))
  return (
    <section aria-labelledby="busy-summary-title" className="wg-card">
      <div className="wg-section-head items-center">
        <h2 id="busy-summary-title" className="heading">
          ไม่ว่างเดือนนี้
        </h2>
        <Pill tone="orange" icon="lock">
          เห็นแค่คุณ
        </Pill>
      </div>
      {runs.length === 0 ? (
        <p className="small wg-muted flex items-center gap-2">
          <StatusIcon kind="free" size={28} />
          เดือนนี้ว่างยาว ๆ เลย
        </p>
      ) : (
        <ul>
          {runs.map((r) => (
            <li key={r.from} className="border-line not-last:border-b">
              <button
                type="button"
                onClick={() => onSelect(r.from)}
                className="flex min-h-11 w-full cursor-pointer items-baseline gap-4 rounded-control py-3 text-left hover:bg-peach-50 focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none"
              >
                <span className="small w-24 shrink-0 font-semibold text-busy">{formatDayRange(r.from, r.to)}</span>
                {r.reason ? <span className="body">{r.reason}</span> : <span className="small wg-muted">(ไม่ระบุเหตุผล)</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
