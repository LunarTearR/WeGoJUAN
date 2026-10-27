import { useState } from 'react'
import { MonthCalendar } from '@/features/availability/components/month-calendar'
import { ResyncBanner } from '@/features/trip/components/resync-banner'

export function CalendarRoute() {
  // อ่านวันที่ปัจจุบันครั้งเดียวตอน mount (เรียก new Date() ตรงๆ ตอน render ไม่ pure)
  const [shown, setShown] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  })

  // วันที่แก้ไปแล้วในรอบนี้ — ใช้ถามว่าทริปไหนควร re-sync
  const [changedDays, setChangedDays] = useState<string[]>([])

  function addChangedDays(days: string[]) {
    setChangedDays((prev) => [...new Set([...prev, ...days])].sort())
  }

  function changeMonth(delta: number) {
    setShown(({ year, month }) => {
      const d = new Date(year, month - 1 + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    })
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">ปฏิทินของฉัน</h1>
      <p className="text-sm text-gray-600">กดวันเพื่อตั้งว่าง/ไม่ว่าง ใส่เหตุผลส่วนตัว หรือเลือก "ถึงวันที่" เพื่อตั้งหลายวันพร้อมกัน</p>
      <ResyncBanner days={changedDays} onDismiss={() => setChangedDays([])} />
      <MonthCalendar year={shown.year} month={shown.month} onChangeMonth={changeMonth} onSaved={addChangedDays} />
    </section>
  )
}
