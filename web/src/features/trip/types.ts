import type { ISODate } from '@/types/date'
import type { Status } from '@/types/mark'

// ตรงกับ tripResponse ฝั่ง Go
export type Trip = {
  id: string
  title: string
  start_date: ISODate // Date Range
  end_date: ISODate
  duration_days: number
  organizer_id: string
  invite_code: string
  confirmed_start: ISODate | null // null = กำลังหาวัน (Finding Dates)
  confirmed_end: ISODate | null
}

// ตรงกับ memberResponse ฝั่ง Go
export type Member = {
  id: string
  display_name: string
  is_organizer: boolean
  is_guest: boolean
}

export type TripDetail = {
  trip: Trip
  members: Member[]
  me: Member
  // สิ่งที่ควรถามคนนี้ตอนเปิดทริป (Guest เป็น false เสมอ)
  prompts: {
    repush: boolean
    confirmed_offer: boolean
  }
}

export type NewTripInput = {
  title: string
  start_date: ISODate
  end_date: ISODate
  duration_days: number
}

// ตรงกับ inviteResponse ฝั่ง Go — ตั้งใจไม่มีสมาชิกหรือ Mark
export type Invite = {
  trip_id: string
  title: string
  start_date: ISODate
  end_date: ISODate
  duration_days: number
  is_member: boolean
}

export type JoinResult = {
  trip_id: string
  member: Member
}

// ตรงกับ markResponse ของทริปฝั่ง Go
export type TripMark = {
  member_id: string
  day: ISODate
  status: Status
}

// ตรงกับ windowResponse ฝั่ง Go — เรียงแล้ว: Busy น้อยสุด → Available มากสุด → เริ่มเร็วสุด
export type Suggestion = {
  start: ISODate
  end: ISODate
  available: string[] // member ID
  busy: string[]
  unknown: string[]
}

// ตรงกับ pushDayResponse ฝั่ง Go — เฉพาะวันที่ทริปกับปฏิทินส่วนตัวไม่ตรงกัน (null = ยังไม่ระบุ)
export type PushDay = {
  day: ISODate
  trip_status: Status | null
  calendar_status: Status | null
  calendar_reason?: string // เหตุผลส่วนตัวของตัวเอง — เห็นแค่เจ้าของ
}
