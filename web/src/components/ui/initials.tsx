import { cx } from '@/lib/cx'
import { initials } from '@/lib/initials'
import { statusLabel } from '@/lib/mark'
import type { Status } from '@/types/mark'

type InitialsProps = {
  name: string
  status?: Status // ป้ายในช่องปฏิทิน: ว่าง = กลมสีเขียวอมฟ้า · ไม่ว่าง = เหลี่ยมมนสีชมพู (ต่างทั้งรูปทรงและสี)
  size?: 'md' | 'lg' // ใส่ = รูปย่อชื่อกลม 32 / 40px แทนป้ายในช่อง
  label?: string
  decorative?: boolean // มีชื่อเขียนอยู่ข้าง ๆ แล้ว ซ่อนจาก screen reader
  className?: string
}

// ชื่อย่อสองตัวอักษรที่มองเห็น (สระไทยไม่ขาดครึ่ง): ป้ายเล็กในช่องปฏิทินทริป หรือรูปย่อชื่อ
export function Initials({ name, status = 'free', size, label, decorative, className }: InitialsProps) {
  const text = initials(name)
  if (size) {
    return (
      <span
        className={cx('wg-avatar', size === 'lg' && 'wg-avatar--lg', 'caption font-semibold', className)}
        title={name}
        aria-hidden={decorative || undefined}
      >
        {text}
      </span>
    )
  }
  return (
    <span
      className={cx('wg-initials', `wg-initials--${status}`, 'micro', className)}
      role="img"
      aria-label={label ?? `${name} ${statusLabel[status]}`}
    >
      {text}
    </span>
  )
}
