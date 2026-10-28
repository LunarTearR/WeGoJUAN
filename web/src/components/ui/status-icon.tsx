import { Calendar, CalendarClock, Check, MoreHorizontal, Ticket, X, type LucideIcon } from 'lucide-react'
import { cx } from '@/lib/cx'

// สถานะทริป: finding = กำลังหาวัน · confirmed = ยืนยันแล้ว · calendar = ยังไม่มีอะไร (empty state)
// สถานะของคน: free = ว่าง · busy = ไม่ว่าง · unknown = ยังไม่ระบุ
export type StatusKind = 'finding' | 'confirmed' | 'calendar' | 'free' | 'busy' | 'unknown'

const KINDS: Record<StatusKind, { Icon: LucideIcon; label: string }> = {
  finding: { Icon: CalendarClock, label: 'กำลังหาวัน' },
  confirmed: { Icon: Ticket, label: 'ยืนยันแล้ว' },
  calendar: { Icon: Calendar, label: 'ปฏิทิน' },
  free: { Icon: Check, label: 'ว่าง' },
  busy: { Icon: X, label: 'ไม่ว่าง' },
  unknown: { Icon: MoreHorizontal, label: 'ยังไม่ระบุ' },
}

// ไอคอนกับความหนาเส้นตามขนาดวงกลม ให้เส้นดูหนาราว 2px ตั้งแต่ป้าย 18px ถึง hero 88px
function iconMetrics(size: number): { icon: number; stroke: number } {
  if (size <= 20) return { icon: Math.round(size * 0.62), stroke: 3 }
  if (size <= 32) return { icon: Math.round(size * 0.56), stroke: 2.5 }
  if (size <= 48) return { icon: Math.round(size * 0.52), stroke: 2.25 }
  return { icon: Math.round(size * 0.5), stroke: 2 }
}

type StatusIconProps = {
  kind: StatusKind
  size?: number // เส้นผ่านศูนย์กลางวงกลม: 18 ในป้าย, 24 ในรายการเมนู, 28 ใน picker, 32 แบนเนอร์/หัว sheet, 40–56 การ์ด, 72–88 empty state
  // ไม่ใส่ = ตกแต่ง (มีคำอยู่ข้าง ๆ แล้ว) ซ่อนจาก screen reader · '' = ใช้ชื่อไทยของสถานะ · ข้อความ = อ่านตามนั้น เช่น "Nat ว่าง"
  title?: string
  stamp?: boolean // ประทับลงหนึ่งครั้งตอนแสดง ใช้ตอนยืนยันวันแล้ว
  className?: string
}

// ไอคอน lucide-react ในวงกลม บอกสถานะทริปหรือสถานะของคน — หนึ่งอันต่อการ์ด แบนเนอร์ หรือหัว sheet
// ห้ามใช้ไอคอนเปล่า ๆ แทนสถานะ และห้ามเปลี่ยนสีของแต่ละ kind (สีมาจาก .wg-status--* ใน components.css)
export function StatusIcon({ kind, size = 32, title, stamp, className }: StatusIconProps) {
  const { Icon, label: kindLabel } = KINDS[kind]
  const { icon, stroke } = iconMetrics(size)
  const label = title === undefined ? undefined : title || kindLabel
  return (
    <span
      className={cx('wg-status', `wg-status--${kind}`, stamp && 'wg-status--stamp', className)}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Icon size={icon} strokeWidth={stroke} aria-hidden />
    </span>
  )
}
