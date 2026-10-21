import type { ISODate } from '@/types/date'

// ตรงกับ windowResponse ฝั่ง Go
export type Suggestion = {
  start: ISODate
  end: ISODate
  available: string[]
  busy: string[]
  unknown: string[]
}
