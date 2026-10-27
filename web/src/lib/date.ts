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

// ปี/เดือน (1-12) ของ ISODate
export function monthOf(day: ISODate): { year: number; month: number } {
  const [y, m] = day.split('-').map(Number)
  return { year: y, month: m }
}

// "อา. 6 ธ.ค." — คำนวณบน UTC เพื่อไม่ให้ timezone ทำวันเลื่อน
export function formatThaiDay(day: ISODate): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Intl.DateTimeFormat('th-TH', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}

// ช่วงวันในเดือนเดียวกัน: "15–19 ธ.ค." หรือ "21 ธ.ค." ถ้าวันเดียว
export function formatDayRange(from: ISODate, to: ISODate): string {
  const [y, m, d1] = from.split('-').map(Number)
  const d2 = Number(to.split('-')[2])
  const month = new Intl.DateTimeFormat('th-TH', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d1)))
  return d1 === d2 ? `${d1} ${month}` : `${d1}–${d2} ${month}`
}

// ISODate ถัดไป n วัน (UTC ล้วน)
export function addDays(day: ISODate, n: number): ISODate {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}
