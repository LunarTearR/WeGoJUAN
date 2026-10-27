import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { ISODate } from '@/types/date'
import type { Trip } from '../types'

export type TripDatesInput = {
  start_date: ISODate
  end_date: ISODate
  duration_days: number
}

export function updateTripDates(tripId: string, input: TripDatesInput) {
  return apiFetch<Trip>(`/api/v1/trips/${encodeURIComponent(tripId)}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function useUpdateTripDates(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TripDatesInput) => updateTripDates(tripId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
}
