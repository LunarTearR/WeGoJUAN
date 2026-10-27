import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import { applyChanges } from '@/lib/mark'
import type { Mark, MarkChange } from '@/types/mark'

export function saveMyMarks(changes: MarkChange[]) {
  return apiFetch<void>('/api/v1/availability', { method: 'PUT', body: JSON.stringify(changes) })
}

export function useSaveMyMarks() {
  const queryClient = useQueryClient()
  const key = ['availability', 'me']
  return useMutation<void, Error, MarkChange[]>({
    mutationKey: key,
    mutationFn: saveMyMarks,
    // ส่ง PUT ทีละอัน — กดรัวๆ แล้วเน็ตช้า request ต้องถึง server ตามลำดับที่กด ไม่งั้นครั้งสุดท้ายโดนทับ
    scope: { id: 'availability-me' },
    // เปลี่ยนสีทันทีที่กด ไม่ต้องรอ server — กดรัวๆ ก็ไล่สถานะถูก
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: key })
      queryClient.setQueriesData<Mark[]>({ queryKey: key }, (old) => old && applyChanges(old, changes))
    },
    // refetch เฉพาะตอนอันสุดท้ายเสร็จ ไม่งั้นผลของอันก่อนหน้ามาทับสีที่เพิ่งกด
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: key }) === 1) {
        return queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}
