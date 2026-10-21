import { useState } from 'react'
import { MonthCalendar } from '@/features/availability/components/month-calendar'

export function CalendarRoute() {
  // อ่านวันที่ปัจจุบันครั้งเดียวตอน mount (เรียก new Date() ตรงๆ ตอน render ไม่ pure)
  const [today] = useState(() => new Date())
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">ปฏิทินของฉัน</h1>
      <MonthCalendar year={today.getFullYear()} month={today.getMonth() + 1} />
    </section>
  )
}
