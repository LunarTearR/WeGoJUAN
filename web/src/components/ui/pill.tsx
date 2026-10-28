import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon, type IconName } from './icon'
import { StatusIcon, type StatusKind } from './status-icon'

type PillProps = {
  // solid = ยืนยันแล้ว/ผู้จัด/ลงตัวที่สุด · orange = เห็นแค่คุณ · neutral = กำลังหาวัน/แขก
  // outline = ป้ายขาว (ตั้งต้นเมื่อมี status เช่นสถานะของเพื่อน) · free/busy = ป้ายสีของสถานะ · honey = รออัปเดต
  tone?: 'solid' | 'orange' | 'neutral' | 'outline' | 'free' | 'busy' | 'honey'
  icon?: IconName
  status?: StatusKind // ไอคอนสถานะ 18px ด้านหน้า เช่นสถานะของเพื่อน
  children?: ReactNode
  className?: string
}

// ป้ายเล็กสำหรับสถานะและบทบาท — อ่านอย่างเดียว อย่าทำให้ดูเหมือนปุ่ม
export function Pill({ tone, icon, status, children, className }: PillProps) {
  return (
    <span className={cx('wg-pill', `wg-pill--${tone ?? (status ? 'outline' : 'orange')}`, status && 'wg-pill--status', 'caption', className)}>
      {icon && <Icon name={icon} size={14} />}
      {status && <StatusIcon kind={status} size={18} />}
      {children}
    </span>
  )
}
