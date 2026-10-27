import { useState } from 'react'
import { MonthCalendar } from '@/features/availability/components/month-calendar'

export function CalendarRoute() {
  // อ่านวันที่ปัจจุบันครั้งเดียวตอน mount (เรียก new Date() ตรงๆ ตอน render ไม่ pure)
  const [shown, setShown] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  })

  function changeMonth(delta: number) {
    setShown(({ year, month }) => {
      const d = new Date(year, month - 1 + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">ปฏิทินของฉัน</h1>
      <p className="text-sm text-gray-600">กดวันเพื่อสลับ ว่าง → ไม่ว่าง → ยังไม่ระบุ</p>
      <MonthCalendar year={shown.year} month={shown.month} onChangeMonth={changeMonth} />
    </section>
  )
}
