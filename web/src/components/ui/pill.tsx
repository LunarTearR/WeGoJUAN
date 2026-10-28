import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Face, type Mood } from './face'
import { Icon, type IconName } from './icon'

type PillProps = {
  // solid = ยืนยันแล้ว/ผู้จัด/ลงตัวที่สุด · orange = เห็นแค่คุณ · neutral = กำลังหาวัน/แขก
  // free/busy = สถานะของเพื่อน (คู่กับ face) · honey = รออัปเดต
  tone?: 'solid' | 'orange' | 'neutral' | 'free' | 'busy' | 'honey'
  icon?: IconName
  face?: Mood
  children?: ReactNode
  className?: string
}

// ป้ายเล็กสำหรับสถานะและบทบาท — อ่านอย่างเดียว อย่าทำให้ดูเหมือนปุ่ม
export function Pill({ tone = 'orange', icon, face, children, className }: PillProps) {
  return (
    <span className={cx('wg-pill', `wg-pill--${tone}`, 'caption', className)}>
      {icon && <Icon name={icon} size={14} />}
      {face && <Face mood={face} size={16} />}
      {children}
    </span>
  )
}
