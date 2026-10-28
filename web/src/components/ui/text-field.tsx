import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '@/lib/cx'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string // แสดงเสมอ ห้ามใช้ placeholder แทน · ช่องไม่บังคับใส่ "(ไม่บังคับ)" ในนี้
  hint?: ReactNode
  error?: ReactNode // แทนที่ hint, ขอบเป็นสี danger และตั้ง aria-invalid — บอกว่าต้องทำอะไรต่อ
}

// input สูง 48px ตัวอักษร 16px (iOS จะได้ไม่ซูมตอนแตะ) หน้าตาเดียวกันทุกฟอร์ม
export function TextField({ label, hint, error, className, id, ...props }: TextFieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined
  return (
    <div className={cx('wg-field', className)}>
      <label className="wg-field__label small font-medium" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className="wg-field__input body"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-err`} className="wg-field__error small">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="wg-field__hint small">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
