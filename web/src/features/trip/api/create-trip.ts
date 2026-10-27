import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { NewTripInput, Trip } from '../types'

export function createTrip(input: NewTripInput) {
  return apiFetch<Trip>('/api/v1/trips', { method: 'POST', body: JSON.stringify(input) })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
}
