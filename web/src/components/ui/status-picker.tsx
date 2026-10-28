import { cx } from '@/lib/cx'
import type { Status } from '@/types/mark'
import { StatusIcon, type StatusKind } from './status-icon'

const OPTIONS: { status: Status | null; key: StatusKind; label: string }[] = [
  { status: 'free', key: 'free', label: 'ว่าง' },
  { status: 'busy', key: 'busy', label: 'ไม่ว่าง' },
  { status: null, key: 'unknown', label: 'ไม่ระบุ' }, // ล้าง Mark ของวันนั้น — ไม่มี "อาจจะ"
]

type StatusPickerProps = {
  value: Status | null
  onChange: (status: Status | null) => void
  disabled?: boolean
  className?: string
}

// ปุ่มใหญ่สามปุ่มพร้อมไอคอนสถานะสำหรับตั้งวันของฉัน (radio group): อันที่เลือกเติมสีของสถานะและไอคอนเด้ง
export function StatusPicker({ value, onChange, disabled, className }: StatusPickerProps) {
  return (
    <div className={cx('wg-seg', className)} role="radiogroup" aria-label="สถานะของฉัน">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.status}
          disabled={disabled}
          className={cx('wg-seg__opt', `wg-seg__opt--${o.key}`)}
          onClick={() => onChange(o.status)}
        >
          <StatusIcon kind={o.key} size={28} />
          <span className="small font-semibold">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
