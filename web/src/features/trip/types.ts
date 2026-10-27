import type { ISODate } from '@/types/date'

// ตรงกับ tripResponse ฝั่ง Go
export type Trip = {
  id: string
  title: string
  start_date: ISODate // Date Range
  end_date: ISODate
  duration_days: number
  organizer_id: string
  invite_code: string
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
