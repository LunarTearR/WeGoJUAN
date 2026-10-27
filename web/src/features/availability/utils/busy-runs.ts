import { addDays } from '@/lib/date'
import type { ISODate } from '@/types/date'
import type { Mark } from '@/types/mark'

export type BusyRun = {
  from: ISODate
  to: ISODate
  reason: string // "" = ไม่ระบุเหตุผล
}

// รวมวันไม่ว่างที่ติดกันและเหตุผลเดียวกันเป็นช่วงเดียว: 15–19 workday, 21 (ไม่ระบุเหตุผล)
export function busyRuns(marks: Mark[]): BusyRun[] {
  const busy = marks.filter((m) => m.status === 'busy').sort((a, b) => a.day.localeCompare(b.day))
  const runs: BusyRun[] = []
  for (const m of busy) {
    const reason = m.reason ?? ''
    const last = runs.at(-1)
    if (last && last.reason === reason && addDays(last.to, 1) === m.day) {
      last.to = m.day
    } else {
      runs.push({ from: m.day, to: m.day, reason })
    }
  }
  return runs
}
