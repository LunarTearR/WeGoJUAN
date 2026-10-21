import type { ISODate } from '@/types/date'

export type Status = 'free' | 'busy' | 'maybe'

// วันที่ไม่มี Mark = ยังไม่ระบุ (ไม่ใช่ว่าง) — ตรงกับฝั่ง Go
export type Mark = {
  day: ISODate
  status: Status
}
