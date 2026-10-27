import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

export function logout() {
  return apiFetch<void>('/api/v1/users/logout', { method: 'POST' })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null)
      // ทิ้งข้อมูลอื่นของคนเดิมทั้งหมด ไม่ให้ค้างไปโผล่ตอนคนถัดไป login
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
    },
  })
}
