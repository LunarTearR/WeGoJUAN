import type { ISODate } from './date'

// มีแค่ว่าง/ไม่ว่าง — วันที่ไม่มี Mark = ยังไม่ระบุ (Unknown) ไม่ใช่ว่าง ตรงกับฝั่ง Go
export type Status = 'free' | 'busy'

export type Mark = {
  day: ISODate
  status: Status
}

// หนึ่งรายการของ PUT: status null = ลบ Mark ของวันนั้น
export type MarkChange = {
  day: ISODate
  status: Status | null
}
