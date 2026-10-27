import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { ISODate } from '@/types/date'
import type { Trip } from '../types'

export function getResyncTrips(days: ISODate[]) {
  return apiFetch<Trip[]>(`/api/v1/trips/resync?days=${days.join(',')}`)
}

// ทริปที่เคย Push แล้วทับวันที่เพิ่งแก้ในปฏิทินส่วนตัว
export function useResyncTrips(days: ISODate[]) {
  return useQuery({
    queryKey: ['trips', 'resync', days],
    queryFn: () => getResyncTrips(days),
    enabled: days.length > 0,
  })
}
