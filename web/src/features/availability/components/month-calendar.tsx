import { useState } from 'react'
import { MonthGrid } from '@/components/calendar/month-grid'
import { MonthNav } from '@/components/calendar/month-nav'
import { statusClass, statusLabel } from '@/lib/mark'
import type { ISODate } from '@/types/date'
import type { Mark, MarkChange } from '@/types/mark'
import { useMyMarks } from '../api/get-my-marks'
import { useSaveMyMarks } from '../api/save-my-marks'
import { busyRuns } from '../utils/busy-runs'
import { monthRange } from '../utils/month-range'
import { BusySummary } from './busy-summary'
import { CalendarDayPanel } from './calendar-day-panel'

type MonthCalendarProps = {
  year: number
  month: number // 1-12
  onChangeMonth: (delta: number) => void
  onSaved?: (days: ISODate[]) => void // บันทึกวันไหนสำเร็จ (ใช้ชวน re-sync ทริป)
}

export function MonthCalendar({ year, month, onChangeMonth, onSaved }: MonthCalendarProps) {
  const { from, to } = monthRange(year, month)
  const { data: marks, isPending, error } = useMyMarks(from, to)
  const saveMutation = useSaveMyMarks()
  const [selected, setSelected] = useState<ISODate | null>(null)

  const markByDay = new Map<string, Mark>(marks?.map((m) => [m.day, m]))
  const inMonth = (day: ISODate) => day >= from && day <= to
  // ระหว่างบันทึกช่วงข้ามเดือน optimistic update อาจใส่วันเดือนอื่นมาในรายการชั่วคราว — สรุปเฉพาะเดือนที่แสดง
  const monthMarks = marks?.filter((m) => inMonth(m.day))

  function save(changes: MarkChange[]) {
    // ชวน re-sync เฉพาะวันที่สถานะเปลี่ยนจริง — แก้แค่ Reason ไม่ต้อง Push ใหม่ (Push ไม่คัดลอก Reason)
    const changedDays = changes
      .filter((c) => !inMonth(c.day) || (markByDay.get(c.day)?.status ?? null) !== c.status)
      .map((c) => c.day)
    saveMutation.mutate(changes, {
      onSuccess: () => {
        if (changedDays.length > 0) onSaved?.(changedDays)
      },
    })
  }

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
            const mark = markByDay.get(day)
            const status = mark?.status ?? null
            return (
              <button
                type="button"
                // "(เหตุผล)" อยู่กลางเพื่อให้คำสุดท้ายเป็นสถานะเสมอ
                aria-label={`${day}${mark?.reason ? ` (${mark.reason})` : ''} ${statusLabel[status ?? 'unknown']}`}
                aria-pressed={selected === day}
                onClick={() => setSelected(day)}
                className={`relative aspect-square w-full rounded border text-sm ${statusClass(status)} ${selected === day ? 'outline-2 outline-gray-900' : ''}`}
              >
                {n}
                {mark?.reason && <span data-reason-dot className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-white" />}
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
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" /> มีเหตุผล
        </span>
      </div>

      {selected && (
        <CalendarDayPanel
          // เปลี่ยน key ตามสถานะ/เหตุผลที่บันทึกแล้ว → แผงเริ่มใหม่จากข้อมูลจริง ไม่ค้างเหตุผลที่ถูกลบไปแล้ว
          key={`${selected}|${markByDay.get(selected)?.status ?? ''}|${markByDay.get(selected)?.reason ?? ''}`}
          day={selected}
          mark={markByDay.get(selected)}
          saving={saveMutation.isPending}
          onSave={save}
        />
      )}

      {monthMarks && <BusySummary runs={busyRuns(monthMarks)} onSelect={setSelected} />}
    </div>
  )
}
