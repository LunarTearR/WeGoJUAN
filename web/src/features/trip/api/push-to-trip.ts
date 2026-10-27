import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { ISODate } from '@/types/date'

export function pushToTrip(tripId: string, days: ISODate[]) {
  return apiFetch<void>(`/api/v1/trips/${encodeURIComponent(tripId)}/push`, {
    method: 'POST',
    body: JSON.stringify({ days }),
  })
}

export function usePushToTrip(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (days: ISODate[]) => pushToTrip(tripId, days),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips', tripId] }),
  })
}
