import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { StatusIcon, type StatusKind } from './status-icon'

type EmptyStateProps = {
  title: string // บอกตรง ๆ ว่าไม่มีอะไร
  children?: ReactNode // บรรทัดที่ใส่ความเป็นกันเอง (ดู docs/design/copy.md)
  action?: ReactNode // ปุ่มเดียว
  icon?: StatusKind // ตั้งต้น calendar · ยังหาวันไม่เจอใช้ finding · หาไม่เจอ/ใช้ไม่ได้ใช้ busy
  size?: number
  className?: string
}

// หน้าหรือรายการที่ยังว่างอยู่: ไอคอนใหญ่ หัวข้อสั้น หนึ่งบรรทัด หนึ่งปุ่ม
export function EmptyState({ title, children, action, icon = 'calendar', size = 72, className }: EmptyStateProps) {
  return (
    <div className={cx('wg-empty', className)}>
      <StatusIcon kind={icon} size={size} />
      <h2 className="wg-empty__title heading">{title}</h2>
      {children && <p className="wg-empty__text small">{children}</p>}
      {action && <div className="wg-empty__action">{action}</div>}
    </div>
  )
}
