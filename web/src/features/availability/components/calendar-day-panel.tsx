import { useState } from 'react'
import { useLayout } from '@/components/layout/layout-context'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { StatusPicker } from '@/components/ui/status-picker'
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
  error: Error | null
  onSave: (changes: MarkChange[]) => void
  onClose: () => void
}

// แผงแก้วันในปฏิทินส่วนตัว: เลือกสถานะ + เหตุผล (เฉพาะไม่ว่าง) + "ถึงวันที่" เพื่อใช้กับหลายวันพร้อมกัน
// ใช้กับช่วงวัน = ทับทุกวันในช่วงนั้น · มือถือเป็นแผ่นล่าง, PC เป็นลิ้นชักขวาที่ไม่บังปฏิทิน
export function CalendarDayPanel({ day, mark, saving, error, onSave, onClose }: CalendarDayPanelProps) {
  const [status, setStatus] = useState<Status | null>(mark?.status ?? null)
  const [reason, setReason] = useState(mark?.reason ?? '')
  const [until, setUntil] = useState('')
  const layout = useLayout()
  // ลิ้นชักบน PC / จอขวาของ Duo ไม่มีฉากมืดให้แตะปิด จึงมีปุ่มยกเลิกคู่กับบันทึก
  const docked = layout === 'expanded' || layout === 'split'

  const last = addDays(day, MAX_DAYS - 1)
  const untilError = until && until < day ? 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เลือก' : until > last ? `เลือกได้ไม่เกิน ${MAX_DAYS} วัน` : ''
  const days = until && !untilError ? eachDay(day, until) : [day]

  function save() {
    onSave(days.map((d) => ({ day: d, status, ...(status === 'busy' ? { reason: reason.trim() } : {}) })))
  }

  return (
    <Sheet
      open
      placement="side"
      title={formatThaiDay(day, true)}
      onClose={onClose}
      footer={
        <>
          {docked && (
            <Button variant="secondary" onClick={onClose}>
              ยกเลิก
            </Button>
          )}
          <Button loading={saving} disabled={Boolean(untilError)} onClick={save}>
            บันทึก (จะเปลี่ยน {days.length} วัน)
          </Button>
        </>
      }
    >
      <div className="wg-stack">
        {error && (
          <Banner tone="danger" title="อุ๊ย บันทึกไม่สำเร็จ">
            {error.message}
          </Banner>
        )}
        <StatusPicker value={status} onChange={setStatus} />
        {status === 'busy' && (
          <TextField
            label="เหตุผล (ไม่บังคับ · เห็นแค่คุณ)"
            maxLength={MAX_REASON}
            placeholder="เช่น ทำงาน, งานแต่งเพื่อน"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}
        <TextField
          label="ถึงวันที่ (ไม่บังคับ)"
          type="date"
          min={day}
          max={last}
          value={until}
          onChange={(e) => setUntil(e.target.value)}
          hint="ตั้งหลายวันพร้อมกันได้"
          error={untilError}
        />
      </div>
    </Sheet>
  )
}
