import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Icon } from './icon'

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode
  description?: ReactNode // บรรทัดรอง เช่นเหตุผลส่วนตัว
}

// แถวติ๊ก (เช่นเลือกวันที่จะ Push) — หลายแถวต่อกันมีเส้นคั่น ติ๊กแล้วเติมสีส้มพร้อมเครื่องหมายถูก
export function Checkbox({ label, description, className, ...props }: CheckboxProps) {
  return (
    <label className={cx('wg-check', className)}>
      <span className="wg-check__box">
        <input type="checkbox" {...props} />
        <Icon name="check" />
      </span>
      <span className="wg-check__text">
        <span className="body block">{label}</span>
        {description && <span className="wg-check__desc small block">{description}</span>}
      </span>
    </label>
  )
}
