import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { ISODate } from '@/types/date'

// start = Confirmed Dates ที่ User เห็นตอนตอบ — ถ้าผู้จัดเปลี่ยนไปแล้ว server ตอบ 409 ไม่เขียนอะไร
export function answerConfirmedOffer(tripId: string, accept: boolean, start: ISODate) {
  return apiFetch<void>(`/api/v1/trips/${encodeURIComponent(tripId)}/confirmed-offer`, {
    method: 'POST',
    body: JSON.stringify({ accept, start }),
  })
}

export function useAnswerConfirmedOffer(tripId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ accept, start }: { accept: boolean; start: ISODate }) => answerConfirmedOffer(tripId, accept, start),
    // 409 = วันเปลี่ยนแล้ว → โหลดทริปใหม่ให้เห็นวันล่าสุด
    onError: () => queryClient.invalidateQueries({ queryKey: ['trips', tripId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      // ตอบรับ = เขียนไม่ว่างลงปฏิทินส่วนตัว
      queryClient.invalidateQueries({ queryKey: ['availability', 'me'] })
    },
  })
}
