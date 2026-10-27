import { nextStatus, statusClass, statusLabel } from '@/lib/mark'
import type { Status } from '@/types/mark'
import { useMyMarks } from '../api/get-my-marks'
import { useSaveMyMarks } from '../api/save-my-marks'
import { monthRange } from '../utils/month-range'

type MonthCalendarProps = {
  year: number
  month: number // 1-12
  onChangeMonth: (delta: number) => void
}

const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export function MonthCalendar({ year, month, onChangeMonth }: MonthCalendarProps) {
  const { from, to } = monthRange(year, month)
  const { data: marks, isPending, error } = useMyMarks(from, to)
  const saveMutation = useSaveMyMarks()

  const title = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
  const leadingBlanks = new Date(year, month - 1, 1).getDay() // ปฏิทินเริ่มวันอาทิตย์
  const daysInMonth = new Date(year, month, 0).getDate()
  const statusByDay = new Map<string, Status>(marks?.map((m) => [m.day, m.status]))
  const mm = String(month).padStart(2, '0')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChangeMonth(-1)} className="rounded border border-gray-300 px-3 py-1" aria-label="เดือนก่อนหน้า">
          ‹
        </button>
        <h2 className="font-medium">{title}</h2>
        <button type="button" onClick={() => onChangeMonth(1)} className="rounded border border-gray-300 px-3 py-1" aria-label="เดือนถัดไป">
          ›
        </button>
      </div>

      {isPending && <p className="text-gray-500">กำลังโหลดวันว่าง…</p>}
      {error && <p className="text-red-700">โหลดวันว่างไม่สำเร็จ: {error.message}</p>}
      {saveMutation.error && <p className="text-red-700">บันทึกไม่สำเร็จ: {saveMutation.error.message}</p>}

      {marks && (
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map((w) => (
            <div key={w} className="text-xs text-gray-500">
              {w}
            </div>
          ))}
          {Array.from({ length: leadingBlanks }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = `${year}-${mm}-${String(i + 1).padStart(2, '0')}`
            const status = statusByDay.get(day) ?? null
            return (
              <button
                key={day}
                type="button"
                aria-label={`${day} ${statusLabel[status ?? 'unknown']}`}
                onClick={() => saveMutation.mutate([{ day, status: nextStatus(status) }])}
                className={`aspect-square rounded border text-sm ${statusClass(status)}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
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
