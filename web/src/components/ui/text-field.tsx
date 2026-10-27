import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

// input พร้อม label หน้าตาเดียวกันทุกฟอร์ม
export function TextField({ label, className = '', ...props }: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <input {...props} className={`mt-1 w-full rounded border border-gray-300 px-3 py-2 ${className}`} />
    </label>
  )
}
