import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

const tripPath = (tripId: string) => `/api/v1/trips/${encodeURIComponent(tripId)}`

export function useRemoveMember(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => apiFetch<void>(`${tripPath(tripId)}/members/${encodeURIComponent(memberId)}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips', tripId] }),
  })
}

export function useReplaceInviteLink(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<{ invite_code: string }>(`${tripPath(tripId)}/invite-link`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips', tripId] }),
  })
}

export function useDeleteTrip(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>(tripPath(tripId), { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['trips', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}

// ออกจากทริปเอง — ผู้จัดออกไม่ได้ (server ตอบ 400)
export function useLeaveTrip(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<void>(`${tripPath(tripId)}/members/me`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['trips', tripId] })
      queryClient.invalidateQueries({ queryKey: ['trips'] })
    },
  })
}
