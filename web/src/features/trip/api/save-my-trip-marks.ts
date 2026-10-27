import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { MarkChange } from '@/types/mark'
import type { TripMark } from '../types'

export function saveMyTripMarks(tripId: string, changes: MarkChange[]) {
  return apiFetch<void>(`/api/v1/trips/${encodeURIComponent(tripId)}/marks/me`, {
    method: 'PUT',
    body: JSON.stringify(changes),
  })
}

// เอา change ของตัวเองไปทับ Mark เดิมของตัวเอง (ของคนอื่นไม่แตะ)
function applyMyChanges(marks: TripMark[], memberId: string, changes: MarkChange[]): TripMark[] {
  const changed = new Set(changes.map((c) => c.day))
  const kept = marks.filter((m) => m.member_id !== memberId || !changed.has(m.day))
  const added = changes.flatMap((c) => (c.status === null ? [] : [{ member_id: memberId, day: c.day, status: c.status }]))
  return [...kept, ...added]
}

export function useSaveMyTripMarks(tripId: string, memberId: string) {
  const queryClient = useQueryClient()
  const marksKey = ['trips', tripId, 'marks']
  const mutationKey = ['trips', tripId, 'marks', 'save']
  return useMutation<void, Error, MarkChange[]>({
    mutationKey,
    mutationFn: (changes: MarkChange[]) => saveMyTripMarks(tripId, changes),
    // ส่ง PUT ทีละอัน ให้ถึง server ตามลำดับที่กด (ดู useSaveMyMarks)
    scope: { id: `trip-marks-${tripId}` },
    // เปลี่ยนสีทันทีที่กด ไม่ต้องรอ server
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: marksKey })
      queryClient.setQueryData<TripMark[]>(marksKey, (old) => old && applyMyChanges(old, memberId, changes))
    },
    // อันสุดท้ายเสร็จค่อย invalidate ทั้ง prefix ของทริป ให้ช่วงวันที่แนะนำคำนวณใหม่ด้วย
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) === 1) {
        return queryClient.invalidateQueries({ queryKey: ['trips', tripId] })
      }
    },
  })
}
