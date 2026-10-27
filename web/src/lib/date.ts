import type { ISODate } from '@/types/date'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// วันนี้ตามเครื่องผู้ใช้ เป็น ISODate (ไม่ใช้ toISOString เพราะจะได้วันที่ของ UTC)
export function todayISO(): ISODate {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ทุกวันใน [from, to] รวมหัวท้าย — คำนวณบน UTC ล้วนเพื่อไม่ให้ timezone ทำวันเลื่อน
export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const end = Date.UTC(ty, tm - 1, td)
  const days: ISODate[] = []
  for (let t = Date.UTC(fy, fm - 1, fd); t <= end; t += 86_400_000) {
    const d = new Date(t)
    days.push(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`)
  }
  return days
}
