import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { useLayout } from './layout-context'

type PageLayoutProps = {
  header?: ReactNode // AppBar หรือหัวเรื่องของหน้าแท็บ
  children?: ReactNode // คอลัมน์หลัก เรียงห่างกัน space-6
  aside?: ReactNode // ของรอง: ข้างคอลัมน์หลักบน expanded, จอขวาตอน split, ใต้คอลัมน์หลักที่เหลือ
  asideLabel?: string
  className?: string
}

// จัดหัว คอลัมน์หลัก และ aside ของหน้าตาม layout — ระยะขอบทั้งหมดของหน้ามาจากที่นี่
export function PageLayout({ header, children, aside, asideLabel, className }: PageLayoutProps) {
  const layout = useLayout()
  return (
    <div
      className={cx(
        'wg-page',
        aside ? 'wg-page--aside' : undefined,
        // split: aside สูงพาดทั้งแถว header และ main — ถ้าแถวเป็น auto ทั้งคู่ ความสูงส่วนเกินจะไปดันแถว header ให้สูงจนเกิดช่องว่างใต้ AppBar
        layout === 'split' && 'grid-rows-[auto_1fr]',
        className,
      )}
    >
      {header && <div className="wg-page__header">{header}</div>}
      <div className="wg-page__main">{children}</div>
      {aside && (
        <aside className="wg-page__aside" aria-label={asideLabel}>
          {aside}
        </aside>
      )}
    </div>
  )
}
