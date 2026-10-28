import type { ISODate } from '@/types/date'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// ไทยเป็น UTC+7 ตลอดปี ไม่มี DST — ตรงกับ thailand ใน backend/internal/trip/dates.go
const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000

// Today = วันที่ปัจจุบันในไทย ไม่ว่าเครื่องจะตั้ง timezone ไหน (ตรงกับ Today() ฝั่ง Go)
// ไม่งั้นคนที่อยู่ต่างประเทศเลือกวันที่ฟอร์มยอมแต่ server ปฏิเสธ หรือกลับกัน
export function todayISO(): ISODate {
  const t = new Date(Date.now() + THAILAND_OFFSET_MS)
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
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

// "อา. 6 ธ.ค." (withYear: "อา. 6 ธ.ค. 2569") — คำนวณบน UTC เพื่อไม่ให้ timezone ทำวันเลื่อน
export function formatThaiDay(day: ISODate, withYear = false): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Intl.DateTimeFormat('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

function formatPart(day: ISODate, part: 'month' | 'weekday'): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Intl.DateTimeFormat('th-TH', { [part]: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))
}

// "28 ต.ค." — วันที่สั้นในข้อความ error
export function formatDayMonth(day: ISODate): string {
  return `${Number(day.split('-')[2])} ${formatPart(day, 'month')}`
}

// ช่วงวัน: "15–19 ธ.ค." · วันเดียว "21 ธ.ค." · ข้ามเดือน "30 ม.ค. – 2 ก.พ."
export function formatDayRange(from: ISODate, to: ISODate): string {
  const d1 = Number(from.split('-')[2])
  const d2 = Number(to.split('-')[2])
  if (from === to) return formatDayMonth(from)
  if (from.slice(0, 7) === to.slice(0, 7)) return `${d1}–${d2} ${formatPart(from, 'month')}`
  return `${d1} ${formatPart(from, 'month')} – ${d2} ${formatPart(to, 'month')}`
}

// ช่วงวันพร้อมวันในสัปดาห์ (วันที่ยืนยัน, ช่วงที่แนะนำ): "ศ. 5 – อา. 7 ธ.ค." · ข้ามเดือน "ศ. 30 ม.ค. – จ. 2 ก.พ."
export function formatWeekdayRange(from: ISODate, to: ISODate): string {
  if (from === to) return formatThaiDay(from)
  if (from.slice(0, 7) === to.slice(0, 7)) return `${formatPart(from, 'weekday')} ${Number(from.split('-')[2])} – ${formatThaiDay(to)}`
  return `${formatThaiDay(from)} – ${formatThaiDay(to)}`
}

// ISODate ถัดไป n วัน (UTC ล้วน)
export function addDays(day: ISODate, n: number): ISODate {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}
