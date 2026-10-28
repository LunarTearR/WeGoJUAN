import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Trip } from '../types'

export function getMyTrips() {
  return apiFetch<Trip[]>('/api/v1/trips')
}

// enabled = false ตอนยังไม่ได้ login (เช่นแถบข้างของ Guest) ไม่งั้นได้ 401
export function useMyTrips(enabled = true) {
  return useQuery({ queryKey: ['trips'], queryFn: getMyTrips, enabled })
}
