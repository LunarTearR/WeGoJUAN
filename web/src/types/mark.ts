import type { ISODate } from './date'

// มีแค่ว่าง/ไม่ว่าง — วันที่ไม่มี Mark = ยังไม่ระบุ (Unknown) ไม่ใช่ว่าง ตรงกับฝั่ง Go
export type Status = 'free' | 'busy'

export type Mark = {
  day: ISODate
  status: Status
  reason?: string // เหตุผลส่วนตัว — มีเฉพาะในปฏิทินส่วนตัว และเฉพาะวันไม่ว่าง
}

// หนึ่งรายการของ PUT: status null = ลบ Mark ของวันนั้น · reason ใส่ได้เฉพาะ busy
export type MarkChange = {
  day: ISODate
  status: Status | null
  reason?: string
}
