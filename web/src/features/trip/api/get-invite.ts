import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Invite } from '../types'

export function getInvite(code: string) {
  return apiFetch<Invite>(`/api/v1/invites/${encodeURIComponent(code)}`)
}

export function useInvite(code: string) {
  return useQuery({ queryKey: ['invites', code], queryFn: () => getInvite(code), retry: false })
}
