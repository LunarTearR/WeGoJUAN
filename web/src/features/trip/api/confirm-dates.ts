import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { ISODate } from '@/types/date'
import type { Trip } from '../types'

export function confirmDates(tripId: string, start: ISODate) {
  return apiFetch<Trip>(`/api/v1/trips/${encodeURIComponent(tripId)}/confirmed`, {
    method: 'PUT',
    body: JSON.stringify({ start }),
  })
}

export function clearConfirmed(tripId: string) {
  return apiFetch<void>(`/api/v1/trips/${encodeURIComponent(tripId)}/confirmed`, { method: 'DELETE' })
}

export function useConfirmDates(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (start: ISODate) => confirmDates(tripId, start),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
}

export function useClearConfirmed(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clearConfirmed(tripId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
}
