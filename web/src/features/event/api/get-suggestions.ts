import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Suggestion } from '../types'

export function getSuggestions(eventId: string) {
  return apiFetch<Suggestion[]>(`/api/v1/events/${encodeURIComponent(eventId)}/suggestions`)
}

export function useSuggestions(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'suggestions'],
    queryFn: () => getSuggestions(eventId),
  })
}
