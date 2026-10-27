import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Trip } from '../types'

export function getMyTrips() {
  return apiFetch<Trip[]>('/api/v1/trips')
}

export function useMyTrips() {
  return useQuery({ queryKey: ['trips'], queryFn: getMyTrips })
}
