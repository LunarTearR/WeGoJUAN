import { Pill } from '@/components/ui/pill'
import { Sheet } from '@/components/ui/sheet'
import { StatusPicker } from '@/components/ui/status-picker'
import { formatThaiDay } from '@/lib/date'
import { statusLabel } from '@/lib/mark'
import type { ISODate } from '@/types/date'
import type { Status } from '@/types/mark'
import type { Member } from '../types'

type DayPanelProps = {
  day: ISODate
  mine: Status | null
  friends: { member: Member; status: Status | null }[]
  isConfirmed: boolean
  onSet: (status: Status | null) => void
  onClose: () => void
}

// แผงวันที่เลือกในทริป: ตั้งวันของฉัน (บันทึกทันทีที่แตะ) + ชื่อเต็มของเพื่อนที่ระบุแล้ว + ใครยังไม่ระบุ
// มือถือเป็นแผ่นล่าง, PC เป็นลิ้นชักขวาที่ไม่บังปฏิทิน
export function DayPanel({ day, mine, friends, isConfirmed, onSet, onClose }: DayPanelProps) {
  const marked = friends.filter((f) => f.status !== null)
  const unknown = friends.filter((f) => f.status === null)

  return (
    <Sheet open placement="side" title={formatThaiDay(day)} icon={isConfirmed ? 'confirmed' : undefined} onClose={onClose}>
      <div className="wg-stack">
        <p className="small wg-muted">{isConfirmed ? 'วันที่ยืนยัน · วันของฉัน' : 'วันของฉัน'}</p>
        <StatusPicker value={mine} onChange={onSet} />
        {marked.length > 0 && (
          <div>
            <p className="small wg-muted mb-2">เพื่อน</p>
            <div className="wg-row">
              {marked.map((f) => (
                <Pill key={f.member.id} status={f.status ?? undefined}>
                  {f.member.display_name}
                  <span className="sr-only"> {statusLabel[f.status ?? 'unknown']}</span>
                </Pill>
              ))}
            </div>
          </div>
        )}
        {unknown.length > 0 && <p className="small wg-muted">ยังไม่ระบุ: {unknown.map((f) => f.member.display_name).join(', ')}</p>}
      </div>
    </Sheet>
  )
}
