import { MonthGrid } from '@/components/calendar/month-grid'
import { MonthNav } from '@/components/calendar/month-nav'
import { nextStatus, statusClass, statusLabel } from '@/lib/mark'
import type { Status } from '@/types/mark'
import { useMyMarks } from '../api/get-my-marks'
import { useSaveMyMarks } from '../api/save-my-marks'
import { monthRange } from '../utils/month-range'

type MonthCalendarProps = {
  year: number
  month: number // 1-12
  onChangeMonth: (delta: number) => void
  onSaved?: (day: string) => void // บันทึกวันไหนสำเร็จ (ใช้ชวน re-sync ทริป)
}

export function MonthCalendar({ year, month, onChangeMonth, onSaved }: MonthCalendarProps) {
  const { from, to } = monthRange(year, month)
  const { data: marks, isPending, error } = useMyMarks(from, to)
  const saveMutation = useSaveMyMarks()

  const statusByDay = new Map<string, Status>(marks?.map((m) => [m.day, m.status]))

  return (
    <div className="space-y-3">
      <MonthNav year={year} month={month} onPrev={() => onChangeMonth(-1)} onNext={() => onChangeMonth(1)} />

      {isPending && <p className="text-gray-500">กำลังโหลดวันว่าง…</p>}
      {error && <p className="text-red-700">โหลดวันว่างไม่สำเร็จ: {error.message}</p>}
      {saveMutation.error && <p className="text-red-700">บันทึกไม่สำเร็จ: {saveMutation.error.message}</p>}

      {marks && (
        <MonthGrid
          year={year}
          month={month}
          renderDay={(day, n) => {
            const status = statusByDay.get(day) ?? null
            return (
              <button
                type="button"
                aria-label={`${day} ${statusLabel[status ?? 'unknown']}`}
                onClick={() => saveMutation.mutate([{ day, status: nextStatus(status) }], { onSuccess: () => onSaved?.(day) })}
                className={`aspect-square w-full rounded border text-sm ${statusClass(status)}`}
              >
                {n}
              </button>
            )
          }}
        />
      )}

      <div className="flex gap-4 text-sm">
        {(['free', 'busy', null] as const).map((s) => (
          <span key={s ?? 'unknown'} className="flex items-center gap-1">
            <span className={`inline-block h-4 w-4 rounded border ${statusClass(s)}`} />
            {statusLabel[s ?? 'unknown']}
          </span>
        ))}
      </div>
    </div>
  )
}
