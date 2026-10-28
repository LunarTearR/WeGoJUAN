import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { PageTitle } from '@/components/layout/page-title'
import { HomeAppBar } from '@/app/home-app-bar'
import { BusySummary } from '@/features/availability/components/busy-summary'
import { MonthCalendar } from '@/features/availability/components/month-calendar'
import { ResyncBanner } from '@/features/trip/components/resync-banner'
import type { ISODate } from '@/types/date'

export function CalendarRoute() {
  // อ่านวันที่ปัจจุบันครั้งเดียวตอน mount (เรียก new Date() ตรงๆ ตอน render ไม่ pure)
  const [shown, setShown] = useState(() => {
    const today = new Date()
    return { year: today.getFullYear(), month: today.getMonth() + 1 }
  })
  const [selected, setSelected] = useState<ISODate | null>(null)

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

  // main = เดือน · aside = สรุปไม่ว่างส่วนตัว (ข้างเดือนบน PC, ใต้เดือนบนมือถือ, ถูกลิ้นชักวันแทนที่ตอนเปิดวัน)
  return (
    <PageLayout
      header={<HomeAppBar />}
      aside={<BusySummary year={shown.year} month={shown.month} onSelect={setSelected} />}
      asideLabel="ไม่ว่างเดือนนี้"
    >
      <PageTitle title="ปฏิทินของฉัน">ตั้งครั้งเดียว ใช้ได้กับทุกทริป</PageTitle>
      <ResyncBanner days={changedDays} onDismiss={() => setChangedDays([])} />
      <MonthCalendar
        year={shown.year}
        month={shown.month}
        selected={selected}
        onSelect={setSelected}
        onChangeMonth={changeMonth}
        onSaved={addChangedDays}
      />
    </PageLayout>
  )
}
