import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Me } from '../types'

export type LoginInput = {
  email: string
  password: string
}

export function login(input: LoginInput) {
  return apiFetch<Me>('/api/v1/users/login', { method: 'POST', body: JSON.stringify(input) })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (me) => {
      queryClient.setQueryData(['me'], me)
      // ข้อมูลที่ cache ไว้ตอนเป็น Guest/ไม่ได้ login ไม่ตรงกับตัวตนใหม่แล้ว
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
    },
  })
}
