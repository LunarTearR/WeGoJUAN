import { useState } from 'react'
import { useLayout } from '@/components/layout/layout-context'
import { Initials } from '@/components/ui/initials'
import { cx } from '@/lib/cx'
import { statusLabel } from '@/lib/mark'
import type { Status } from '@/types/mark'

type DayCellProps = {
  day: number
  status?: Status | null // สถานะของฉัน · null = ยังไม่ระบุ
  variant?: 'personal' | 'trip'
  friends?: { name: string; status: Status | null }[] // trip เท่านั้น — คนที่ยังไม่ระบุจะไม่มีป้าย
  maxFriends?: number // ไม่ส่ง = ตาม layout: 4 compact/split, 6 medium, 8 expanded
  selected?: boolean
  today?: boolean
  confirmed?: boolean // อยู่ในวันที่ยืนยันของทริป
  reason?: string // ปฏิทินส่วนตัวเท่านั้น: เหตุผลส่วนตัว — ห้ามส่งเข้าช่องของทริป
  outside?: boolean // นอกเดือนหรือนอกช่วงวันของทริป: กดไม่ได้
  onClick?: () => void
  dateLabel?: string // วันที่สำหรับ aria-label เช่น "ศ. 5 ธ.ค."
  className?: string
}

// หนึ่งวันในปฏิทิน: สีพื้นคือสถานะของฉัน — ว่าง = เขียวอมฟ้าทึบ · ไม่ว่าง = ชมพูมีลายเฉียง · ยังไม่ระบุ = ขาวขอบประ
// สามลายต่างกัน สถานะจึงไม่ได้บอกด้วยสีอย่างเดียว · ในทริปมีป้ายชื่อย่อของเพื่อนด้วย
export function DayCell({
  day,
  status = null,
  variant = 'personal',
  friends = [],
  maxFriends,
  selected,
  today,
  confirmed,
  reason,
  outside,
  onClick,
  dateLabel,
  className,
}: DayCellProps) {
  const key = status ?? 'unknown'
  const layout = useLayout()
  // สีพื้นเด้งหนึ่งครั้งเมื่อสถานะเปลี่ยน (ไม่เด้งตอนวาดครั้งแรก)
  const [shownKey, setShownKey] = useState(key)
  const [changed, setChanged] = useState(false)
  if (shownKey !== key) {
    setShownKey(key)
    setChanged(true)
  }

  if (outside) {
    return (
      <div className={cx('wg-day', `wg-day--${variant}`, 'wg-day--outside', className)} aria-hidden>
        <span className="wg-day__n day-number">{day}</span>
      </div>
    )
  }

  const marked = friends.filter((f) => f.status !== null)
  const max = maxFriends ?? (layout === 'expanded' ? 8 : layout === 'medium' ? 6 : 4)
  const shown = marked.length > max ? marked.slice(0, max - 1) : marked
  const extra = marked.length - shown.length
  const label =
    `${dateLabel ?? day} ของฉัน ${statusLabel[key]}` + (confirmed ? ' (วันที่ยืนยัน)' : '') + (reason ? ` (${reason})` : '')

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={Boolean(selected)}
      aria-label={label}
      className={cx(
        'wg-day',
        `wg-day--${variant}`,
        `wg-day--${key}`,
        selected && 'is-selected',
        confirmed && 'is-confirmed',
        today && 'is-today',
        className,
      )}
    >
      {/* key ตามสถานะ: เปลี่ยนสถานะ = span ใหม่ ให้ animation เด้งเล่นซ้ำได้ */}
      <span key={`bg-${key}`} className={cx('wg-day__bg', changed && 'wg-pop')} />
      <span className="wg-day__n day-number">{day}</span>
      {variant === 'trip' && marked.length > 0 && (
        <span className="wg-day__friends">
          {shown.map((f) => (
            <Initials key={f.name} name={f.name} status={f.status ?? undefined} />
          ))}
          {extra > 0 && (
            <span className="wg-initials wg-initials--more micro" aria-label={`และอีก ${extra} คน`}>
              +{extra}
            </span>
          )}
        </span>
      )}
      {/* เหตุผล: จุดเล็กบนตารางแคบ เขียนเป็นข้อความบนตารางกว้าง (CSS สลับให้) */}
      {reason && <span className="wg-day__reason" aria-hidden />}
      {reason && (
        <span className="wg-day__reason-text caption" aria-hidden>
          {reason}
        </span>
      )}
      {confirmed && <span className="wg-day__flag" aria-hidden />}
    </button>
  )
}
