import { formatDayRange } from '@/lib/date'
import type { ISODate } from '@/types/date'
import type { BusyRun } from '../utils/busy-runs'

// สรุปวันไม่ว่างของเดือนที่แสดง พร้อมเหตุผล — กดแถวเพื่อเปิดวันแรกของช่วงนั้น
export function BusySummary({ runs, onSelect }: { runs: BusyRun[]; onSelect: (day: ISODate) => void }) {
  return (
    <section aria-label="ไม่ว่างเดือนนี้" className="space-y-1 text-sm">
      <h3 className="font-medium">ไม่ว่างเดือนนี้</h3>
      {runs.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีวันไม่ว่างในเดือนนี้</p>
      ) : (
        <ul className="space-y-1">
          {runs.map((r) => (
            <li key={r.from}>
              <button type="button" onClick={() => onSelect(r.from)} className="w-full rounded px-2 py-1 text-left hover:bg-gray-50">
                <span className="text-red-700">{formatDayRange(r.from, r.to)}</span> ·{' '}
                {r.reason ? r.reason : <span className="text-gray-500">(ไม่ระบุเหตุผล)</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
