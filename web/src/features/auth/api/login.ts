import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Me } from '../types'

export type LoginInput = {
  email: string
  password: string
}

export async function login(input: LoginInput): Promise<Me> {
  const me = await apiFetch<Me>('/api/v1/users/login', { method: 'POST', body: JSON.stringify(input) })
  // เคยเข้าทริปแบบ Guest ในเครื่องนี้ → ย้ายที่นั่งและ Mark มาเป็นของบัญชี (ล้มเหลวก็ login ต่อได้)
  await apiFetch('/api/v1/trips/claim-guest', { method: 'POST' }).catch(() => undefined)
  return me
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
