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
}

const options: { status: Status | null; label: string; on: string }[] = [
  { status: 'free', label: 'ว่าง', on: 'bg-green-600 text-white border-green-600' },
  { status: 'busy', label: 'ไม่ว่าง', on: 'bg-red-600 text-white border-red-600' },
  { status: null, label: 'ไม่ระบุ', on: 'bg-gray-700 text-white border-gray-700' },
]

// แผงใต้ปฏิทินของวันที่เลือก: ตั้งวันของฉัน + ชื่อเต็มของเพื่อนที่ระบุแล้ว + ใครยังไม่ระบุ
export function DayPanel({ day, mine, friends, isConfirmed, onSet }: DayPanelProps) {
  const marked = friends.filter((f) => f.status !== null)
  const unknown = friends.filter((f) => f.status === null)

  return (
    <section aria-label="วันที่เลือก" className="space-y-2 rounded border border-gray-200 p-3 text-sm">
      <p className="font-medium">
        {formatThaiDay(day)}
        {isConfirmed && <span className="ml-2 text-xs text-blue-700">วันที่ยืนยัน</span>}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span>ของฉัน:</span>
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={mine === o.status}
            onClick={() => onSet(o.status)}
            className={`rounded border px-3 py-1 ${mine === o.status ? o.on : 'border-gray-300'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {marked.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span>เพื่อน:</span>
          {marked.map((f) => (
            <span key={f.member.id} className={`rounded-full px-2 py-0.5 text-white ${f.status === 'free' ? 'bg-green-600' : 'bg-red-600'}`}>
              {f.member.display_name} {statusLabel[f.status ?? 'unknown']}
            </span>
          ))}
        </div>
      )}
      {unknown.length > 0 && <p className="text-gray-500">ยังไม่ระบุ: {unknown.map((f) => f.member.display_name).join(', ')}</p>}
    </section>
  )
}
