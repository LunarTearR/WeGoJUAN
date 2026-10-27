import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { TripMark } from '../types'

export function getTripMarks(tripId: string) {
  return apiFetch<TripMark[]>(`/api/v1/trips/${encodeURIComponent(tripId)}/marks`)
}

export function useTripMarks(tripId: string) {
  return useQuery({ queryKey: ['trips', tripId, 'marks'], queryFn: () => getTripMarks(tripId) })
}
