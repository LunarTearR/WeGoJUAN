import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { IconButton } from './icon-button'
import { StatusIcon, type StatusKind } from './status-icon'

type BannerTone = 'info' | 'honey' | 'success' | 'danger'

// ไอคอนตั้งต้นของแต่ละโทน: info = ชวนกันวัน · honey = เตือนให้อัปเดต · success = บันทึกแล้ว · danger = error
const BANNER_ICON: Record<BannerTone, StatusKind> = {
  info: 'confirmed',
  honey: 'finding',
  success: 'free',
  danger: 'busy',
}

type BannerProps = {
  tone?: BannerTone
  icon?: StatusKind | null // ทับไอคอนตั้งต้นของโทน · null = ไม่มีไอคอน
  title?: ReactNode
  children?: ReactNode // หนึ่งถึงสองประโยค
  actions?: ReactNode // ปุ่ม size="sm"
  onDismiss?: () => void
  className?: string
}

// ข้อความในหน้า วางใต้สถานะทริป ไม่เกินสองอันต่อหน้า
// danger ใช้ role="alert" ให้ screen reader อ่านทันที ที่เหลือใช้ role="status"
export function Banner({ tone = 'info', icon, title, children, actions, onDismiss, className }: BannerProps) {
  const kind = icon === undefined ? BANNER_ICON[tone] : icon
  return (
    <div className={cx('wg-banner', `wg-banner--${tone}`, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      {kind && <StatusIcon kind={kind} size={32} />}
      <div className="wg-banner__body">
        {title && <p className="wg-banner__title body-strong">{title}</p>}
        {children && <div className="wg-banner__text small">{children}</div>}
        {actions && <div className="wg-banner__actions">{actions}</div>}
      </div>
      {onDismiss && <IconButton icon="close" plain size="sm" label="ปิด" onClick={onDismiss} className="wg-banner__close" />}
    </div>
  )
}
