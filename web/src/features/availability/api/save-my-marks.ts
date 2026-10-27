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
  return useMutation({
    mutationFn: saveMyMarks,
    // เปลี่ยนสีทันทีที่กด ไม่ต้องรอ server — กดรัวๆ ก็ไล่สถานะถูก
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: key })
      queryClient.setQueriesData<Mark[]>({ queryKey: key }, (old) => old && applyChanges(old, changes))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
