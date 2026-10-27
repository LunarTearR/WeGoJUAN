import { useState } from 'react'
import { TextField } from '@/components/ui/text-field'
import { addDays, eachDay, formatThaiDay } from '@/lib/date'
import type { ISODate } from '@/types/date'
import type { Mark, MarkChange, Status } from '@/types/mark'

// ตรงกับ MaxReasonRunes / MaxChanges ฝั่ง Go
const MAX_REASON = 60
const MAX_DAYS = 366

type CalendarDayPanelProps = {
  day: ISODate
  mark: Mark | undefined
  saving: boolean
  onSave: (changes: MarkChange[]) => void
}

const options: { status: Status | null; label: string; on: string }[] = [
  { status: 'free', label: 'ว่าง', on: 'bg-green-600 text-white border-green-600' },
  { status: 'busy', label: 'ไม่ว่าง', on: 'bg-red-600 text-white border-red-600' },
  { status: null, label: 'ไม่ระบุ', on: 'bg-gray-700 text-white border-gray-700' },
]

// แผงแก้วันในปฏิทินส่วนตัว: เลือกสถานะ + เหตุผล (เฉพาะไม่ว่าง) + "ถึงวันที่" เพื่อใช้กับหลายวันพร้อมกัน
// ใช้กับช่วงวัน = ทับทุกวันในช่วงนั้น
export function CalendarDayPanel({ day, mark, saving, onSave }: CalendarDayPanelProps) {
  const [status, setStatus] = useState<Status | null>(mark?.status ?? null)
  const [reason, setReason] = useState(mark?.reason ?? '')
  const [until, setUntil] = useState('')

  const last = addDays(day, MAX_DAYS - 1)
  const error = until && until < day ? 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เลือก' : until > last ? `เลือกได้ไม่เกิน ${MAX_DAYS} วัน` : ''
  const days = until && !error ? eachDay(day, until) : [day]

  function save() {
    onSave(days.map((d) => ({ day: d, status, ...(status === 'busy' ? { reason: reason.trim() } : {}) })))
  }

  return (
    <section aria-label="วันที่เลือก" className="space-y-3 rounded border border-gray-200 p-3 text-sm">
      <p className="font-medium">{formatThaiDay(day)}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={status === o.status}
            onClick={() => setStatus(o.status)}
            className={`rounded border px-3 py-1 ${status === o.status ? o.on : 'border-gray-300'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {status === 'busy' && (
        <TextField
          label="เหตุผล (ไม่บังคับ · เห็นแค่คุณ)"
          maxLength={MAX_REASON}
          placeholder="เช่น ทำงาน"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      )}
      <TextField label="ถึงวันที่ (ไม่บังคับ)" type="date" min={day} max={last} value={until} onChange={(e) => setUntil(e.target.value)} />
      {error && <p className="text-red-700">{error}</p>}
      <button type="button" disabled={saving || !!error} onClick={save} className="rounded bg-gray-900 px-3 py-2 text-white disabled:opacity-50">
        บันทึก (จะเปลี่ยน {days.length} วัน)
      </button>
    </section>
  )
}
