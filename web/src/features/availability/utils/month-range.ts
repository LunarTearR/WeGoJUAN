import type { ISODate } from '@/types/date'

// คืนวันแรกและวันสุดท้ายของเดือน เป็น ISODate (month: 1-12)
// สร้าง string เองโดยไม่ผ่าน toISOString() เพื่อไม่ให้ timezone ทำวันเลื่อน
export function monthRange(year: number, month: number): { from: ISODate; to: ISODate } {
  const lastDay = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, '0')
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}
