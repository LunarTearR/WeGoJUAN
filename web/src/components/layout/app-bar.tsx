import type { ReactNode } from 'react'
import { IconButton } from '@/components/ui/icon-button'
import { cx } from '@/lib/cx'
import { Wordmark } from './wordmark'

type AppBarProps = {
  title?: string // ไม่ใส่ = แถบของหน้าแท็บ แสดงชื่อแอปแทน
  subtitle?: string // ในทริป: ช่วงวันที่และจำนวนวัน
  onBack?: () => void
  backLabel?: string
  actions?: ReactNode
  homeHref?: string
  className?: string
}

// แถบบน: มือถือติดขอบบน (หลบ Dynamic Island ด้วย --wg-safe-top)
// ตั้งแต่ medium แถบหน้าแท็บจะซ่อน (rail/แถบข้างมีชื่อแอปแล้ว) ส่วนแถบในทริปกลายเป็นหัวหน้า
export function AppBar({ title, subtitle, onBack, backLabel = 'กลับ', actions, homeHref, className }: AppBarProps) {
  return (
    <header className={cx('wg-appbar', onBack && 'wg-appbar--back', !title && 'wg-appbar--home', className)}>
      {onBack && <IconButton icon="chevron-left" plain label={backLabel} onClick={onBack} />}
      <div className="wg-appbar__main">
        {title ? (
          <>
            <h1 className="wg-appbar__title heading">{title}</h1>
            {subtitle && <p className="wg-appbar__sub caption">{subtitle}</p>}
          </>
        ) : (
          <Wordmark href={homeHref} />
        )}
      </div>
      {actions && <div className="wg-appbar__actions">{actions}</div>}
    </header>
  )
}
