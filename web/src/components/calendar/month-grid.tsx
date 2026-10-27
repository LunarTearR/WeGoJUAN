import type { ReactNode } from 'react'
import type { ISODate } from '@/types/date'

const weekdays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

type MonthGridProps = {
  year: number
  month: number // 1-12
  renderDay: (day: ISODate, dayOfMonth: number) => ReactNode
}

// ตารางเดือนเริ่มวันอาทิตย์ — แต่ละช่องวาดเองผ่าน renderDay (ใช้ทั้งปฏิทินส่วนตัวและปฏิทินในทริป)
export function MonthGrid({ year, month, renderDay }: MonthGridProps) {
  const leadingBlanks = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, '0')

  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {weekdays.map((w) => (
        <div key={w} className="text-xs text-gray-500">
          {w}
        </div>
      ))}
      {Array.from({ length: leadingBlanks }, (_, i) => (
        <div key={`blank-${i}`} />
      ))}
      {Array.from({ length: daysInMonth }, (_, i) => {
        const day = `${year}-${mm}-${String(i + 1).padStart(2, '0')}`
        return <div key={day}>{renderDay(day, i + 1)}</div>
      })}
    </div>
  )
}
