import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import { Icon, type IconName } from './icon'

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName
  label: string // ไม่มีข้อความบนปุ่ม จึงต้องมีชื่อภาษาไทยให้ screen reader เช่น "เดือนก่อนหน้า"
  plain?: boolean // ไม่มีกรอบ ใช้ในหัว sheet แบนเนอร์ และชิปสมาชิก
  size?: 'md' | 'sm'
}

export function IconButton({ icon, label, plain, size = 'md', className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={cx('wg-iconbtn', plain && 'wg-iconbtn--plain', size === 'sm' && 'wg-iconbtn--sm', className)}
      aria-label={label}
      {...props}
    >
      <Icon name={icon} size={size === 'sm' ? 18 : 22} />
    </button>
  )
}
