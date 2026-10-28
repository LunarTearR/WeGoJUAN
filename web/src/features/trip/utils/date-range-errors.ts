import { formatDayMonth } from '@/lib/date'
import type { ISODate } from '@/types/date'

export type DateRangeErrors = {
  start?: string
  end?: string
}

// ตรวจ Date Range ก่อนส่ง ให้ผลตรงกับ validateNewTrip ฝั่ง Go แต่บอกเป็นภาษาไทยใต้ช่องที่ผิด
// - วันเริ่มต้องไม่ก่อน Today — ยกเว้นตอนแก้ทริปที่เริ่มไปแล้ว วันเริ่มเดิม (currentStart) คงไว้ได้
// - วันสุดท้ายต้องไม่ก่อนวันเริ่ม (error อยู่ที่ช่องวันสุดท้ายเสมอ แม้คนเพิ่งแก้วันเริ่ม)
// ช่องที่ยังว่างไม่ตรวจ — required ของฟอร์มดูแลอยู่แล้ว
export function dateRangeErrors(start: ISODate, end: ISODate, today: ISODate, currentStart?: ISODate): DateRangeErrors {
  const errors: DateRangeErrors = {}
  if (start && start < today && start !== currentStart) {
    errors.start = `เลือกได้ตั้งแต่วันนี้ (${formatDayMonth(today)}) เป็นต้นไป`
  }
  if (start && end && end < start) {
    errors.end = `ต้องไม่ก่อนวันเริ่ม (${formatDayMonth(start)})`
  }
  return errors
}
