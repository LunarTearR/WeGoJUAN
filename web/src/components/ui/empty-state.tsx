import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Face, type Mood } from './face'

type EmptyStateProps = {
  title: string // บอกตรง ๆ ว่าไม่มีอะไร
  children?: ReactNode // บรรทัดที่ใส่ความเป็นกันเอง (ดู docs/design/copy.md)
  action?: ReactNode // ปุ่มเดียว
  mood?: Mood // ตั้งต้น sleepy · ยังหาไม่เจอใช้ unknown
  size?: number
  className?: string
}

// หน้าหรือรายการที่ยังว่างอยู่: หน้าใหญ่ หัวข้อสั้น หนึ่งบรรทัด หนึ่งปุ่ม
export function EmptyState({ title, children, action, mood = 'sleepy', size = 72, className }: EmptyStateProps) {
  return (
    <div className={cx('wg-empty', className)}>
      <Face mood={mood} size={size} />
      <h2 className="wg-empty__title heading">{title}</h2>
      {children && <p className="wg-empty__text small">{children}</p>}
      {action && <div className="wg-empty__action">{action}</div>}
    </div>
  )
}
