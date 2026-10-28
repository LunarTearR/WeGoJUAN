import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Face, type Mood } from './face'
import { IconButton } from './icon-button'

type BannerTone = 'info' | 'honey' | 'success' | 'danger'

// หน้าตั้งต้นของแต่ละโทน: info = ชวนกันวัน · honey = เตือนให้อัปเดต · success = บันทึกแล้ว · danger = error
const BANNER_MOOD: Record<BannerTone, Mood> = {
  info: 'party',
  honey: 'unknown',
  success: 'free',
  danger: 'busy',
}

type BannerProps = {
  tone?: BannerTone
  mood?: Mood | null // ทับหน้าตั้งต้นของโทน · null = ไม่มีหน้า
  title?: ReactNode
  children?: ReactNode // หนึ่งถึงสองประโยค
  actions?: ReactNode // ปุ่ม size="sm"
  onDismiss?: () => void
  className?: string
}

// ข้อความในหน้า วางใต้สถานะทริป ไม่เกินสองอันต่อหน้า
// danger ใช้ role="alert" ให้ screen reader อ่านทันที ที่เหลือใช้ role="status"
export function Banner({ tone = 'info', mood, title, children, actions, onDismiss, className }: BannerProps) {
  const face = mood === undefined ? BANNER_MOOD[tone] : mood
  return (
    <div className={cx('wg-banner', `wg-banner--${tone}`, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      {face && <Face mood={face} size={32} />}
      <div className="wg-banner__body">
        {title && <p className="wg-banner__title body-strong">{title}</p>}
        {children && <div className="wg-banner__text small">{children}</div>}
        {actions && <div className="wg-banner__actions">{actions}</div>}
      </div>
      {onDismiss && <IconButton icon="close" plain size="sm" label="ปิด" onClick={onDismiss} className="wg-banner__close" />}
    </div>
  )
}
