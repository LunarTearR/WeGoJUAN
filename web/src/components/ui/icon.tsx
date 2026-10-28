import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export type IconName =
  | 'trip'
  | 'calendar'
  | 'plus'
  | 'users'
  | 'copy'
  | 'share'
  | 'refresh'
  | 'flag'
  | 'sparkle'
  | 'lock'
  | 'edit'
  | 'trash'
  | 'exit'
  | 'check'
  | 'close'
  | 'more'
  | 'chevron-left'
  | 'chevron-right'

// เส้นบนตาราง 24px — ความหนาเส้น หัวมน และสีมาจาก .wg-icon ใน components.css
const ICONS: Record<IconName, ReactNode> = {
  'chevron-left': <path d="M15 5.5 8.5 12l6.5 6.5" />,
  'chevron-right': <path d="M9 5.5 15.5 12 9 18.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5 9.5 17 19 7.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  copy: (
    <>
      <rect x={9} y={9} width={11} height={11} rx={3} />
      <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
    </>
  ),
  calendar: (
    <>
      <rect x={3.5} y={5} width={17} height={15.5} rx={3.5} />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  trip: (
    <>
      <rect x={3.5} y={7.5} width={17} height={12.5} rx={3} />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M8.5 7.5V20M15.5 7.5V20" />
    </>
  ),
  share: <path d="M12 15V4M8 8l4-4 4 4M5 13v4.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V13" />,
  refresh: <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4" />,
  more: (
    <>
      <circle cx={6} cy={12} r={1.6} className="wg-fill" />
      <circle cx={12} cy={12} r={1.6} className="wg-fill" />
      <circle cx={18} cy={12} r={1.6} className="wg-fill" />
    </>
  ),
  users: (
    <>
      <circle cx={9} cy={8} r={3.5} />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </>
  ),
  flag: <path d="M5.5 21V4M5.5 4.5h11l-2.2 4 2.2 4h-11" />,
  lock: (
    <>
      <rect x={5} y={10.5} width={14} height={10} rx={2.5} />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" />
      <path d="M18.5 16.5v4M16.5 18.5h4" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  trash: <path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5L17.5 7M10 11v6M14 11v6" />,
  exit: <path d="M10 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H10M15 8l4 4-4 4M19 12H9.5" />,
}

type IconProps = {
  name: IconName
  size?: number
  title?: string // มี = รูปที่มีความหมาย ให้ screen reader อ่าน · ไม่มี = ตกแต่ง ซ่อนไว้
  className?: string
}

// flag = ยืนยันแล้ว, sparkle = ช่วงที่ลงตัวที่สุด, lock = ของส่วนตัว (เหตุผล) — อย่าใช้ปนความหมาย
export function Icon({ name, size = 24, title, className }: IconProps) {
  return (
    <svg
      className={cx('wg-icon', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  )
}
