import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Suggestion } from '../types'

export function getSuggestions(tripId: string) {
  return apiFetch<Suggestion[]>(`/api/v1/trips/${encodeURIComponent(tripId)}/suggestions`)
}

// key อยู่ใต้ ['trips', tripId] → พอแก้ Mark ในทริปก็คำนวณใหม่เอง
export function useSuggestions(tripId: string) {
  return useQuery({ queryKey: ['trips', tripId, 'suggestions'], queryFn: () => getSuggestions(tripId) })
}
