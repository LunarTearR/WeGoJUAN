import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export function answerConfirmedOffer(tripId: string, accept: boolean) {
  return apiFetch<void>(`/api/v1/trips/${encodeURIComponent(tripId)}/confirmed-offer`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  })
}

export function useAnswerConfirmedOffer(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (accept: boolean) => answerConfirmedOffer(tripId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      // ตอบรับ = เขียนไม่ว่างลงปฏิทินส่วนตัว
      queryClient.invalidateQueries({ queryKey: ['availability', 'me'] })
    },
  })
}
