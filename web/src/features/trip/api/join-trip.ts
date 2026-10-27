import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { JoinResult } from '../types'

export function joinTrip(code: string, displayName: string) {
  return apiFetch<JoinResult>(`/api/v1/invites/${encodeURIComponent(code)}/join`, {
    method: 'POST',
    body: JSON.stringify({ display_name: displayName }),
  })
}

export function useJoinTrip(code: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (displayName: string) => joinTrip(code, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['invites', code] })
    },
  })
}
