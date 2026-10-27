import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { TripDetail } from '../types'

export function getTrip(tripId: string) {
  return apiFetch<TripDetail>(`/api/v1/trips/${encodeURIComponent(tripId)}`)
}

export function useTrip(tripId: string) {
  // 404 = ไม่มีทริปหรือไม่ได้เป็นสมาชิก ยิงซ้ำไปก็ไม่เปลี่ยน
  return useQuery({ queryKey: ['trips', tripId], queryFn: () => getTrip(tripId), retry: false })
}
