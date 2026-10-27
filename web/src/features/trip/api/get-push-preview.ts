import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { PushDay } from '../types'

export function getPushPreview(tripId: string) {
  return apiFetch<PushDay[]>(`/api/v1/trips/${encodeURIComponent(tripId)}/push-preview`)
}

export function usePushPreview(tripId: string) {
  // ต้องเทียบกับปฏิทินล่าสุดทุกครั้งที่เปิด
  return useQuery({ queryKey: ['trips', tripId, 'push-preview'], queryFn: () => getPushPreview(tripId), staleTime: 0 })
}
