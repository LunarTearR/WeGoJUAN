import { useState } from 'react'
import { CalendarLegend } from '@/components/calendar/calendar-legend'
import { DayCell } from '@/components/calendar/day-cell'
import { MonthGrid } from '@/components/calendar/month-grid'
import { MonthNav } from '@/components/calendar/month-nav'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { formatThaiDay, todayISO } from '@/lib/date'
import type { ISODate } from '@/types/date'
import type { Mark, MarkChange } from '@/types/mark'
import { useMyMarks } from '../api/get-my-marks'
import { useSaveMyMarks } from '../api/save-my-marks'
import { monthRange } from '../utils/month-range'
import { CalendarDayPanel } from './calendar-day-panel'

type MonthCalendarProps = {
  year: number
  month: number // 1-12
  selected: ISODate | null // วันที่เปิดแผงอยู่ (หน้าเป็นเจ้าของ เพราะสรุปไม่ว่างใน aside ก็เปิดวันได้)
  onSelect: (day: ISODate | null) => void
  onChangeMonth: (delta: number) => void
  onSaved?: (days: ISODate[]) => void // บันทึกวันไหนสำเร็จ (ใช้ชวน re-sync ทริป)
}

export function MonthCalendar({ year, month, selected, onSelect, onChangeMonth, onSaved }: MonthCalendarProps) {
  const { from, to } = monthRange(year, month)
  const { data: marks, isPending, error, refetch } = useMyMarks(from, to)
  const saveMutation = useSaveMyMarks()
  // อ่านวันนี้ครั้งเดียวตอน mount (เรียก new Date() ตรงๆ ตอน render ไม่ pure)
  const [today] = useState(todayISO)

  const markByDay = new Map<string, Mark>(marks?.map((m) => [m.day, m]))
  const inMonth = (day: ISODate) => day >= from && day <= to

  function save(changes: MarkChange[]) {
    // ชวน re-sync เฉพาะวันที่สถานะเปลี่ยนจริง — แก้แค่ Reason ไม่ต้อง Push ใหม่ (Push ไม่คัดลอก Reason)
    const changedDays = changes
      .filter((c) => !inMonth(c.day) || (markByDay.get(c.day)?.status ?? null) !== c.status)
      .map((c) => c.day)
    saveMutation.mutate(changes, {
      onSuccess: () => {
        if (changedDays.length > 0) onSaved?.(changedDays)
        onSelect(null)
      },
    })
  }

  function close() {
    saveMutation.reset() // error ของวันเดิมไม่ตามไปโผล่ตอนเปิดวันอื่น
    onSelect(null)
  }

  return (
    <div className="wg-stack">
      <MonthNav year={year} month={month} onPrev={() => onChangeMonth(-1)} onNext={() => onChangeMonth(1)} />

      {isPending && <p className="small wg-muted">กำลังโหลดวันว่าง…</p>}
      {error && (
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
      )}

      {marks && (
        <MonthGrid
          year={year}
          month={month}
          renderDay={(day, n) => {
            const mark = markByDay.get(day)
            return (
              <DayCell
                day={n}
                status={mark?.status}
                reason={mark?.reason}
                selected={selected === day}
                today={today === day}
                dateLabel={formatThaiDay(day)}
                onClick={() => onSelect(day)}
              />
            )
          }}
        />
      )}

      <CalendarLegend reason />

      {selected && (
        <CalendarDayPanel
          // เปลี่ยน key ตามสถานะ/เหตุผลที่บันทึกแล้ว → แผงเริ่มใหม่จากข้อมูลจริง ไม่ค้างเหตุผลที่ถูกลบไปแล้ว
          key={`${selected}|${markByDay.get(selected)?.status ?? ''}|${markByDay.get(selected)?.reason ?? ''}`}
          day={selected}
          mark={markByDay.get(selected)}
          saving={saveMutation.isPending}
          error={saveMutation.error}
          onSave={save}
          onClose={close}
        />
      )}
    </div>
  )
}
