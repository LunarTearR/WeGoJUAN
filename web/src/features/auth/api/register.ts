import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Me } from '../types'
import { login } from './login'

export type RegisterInput = {
  display_name: string
  email: string
  password: string
}

// ฝั่ง Go ไม่ตั้ง cookie ตอนสมัคร จึง login ต่อทันทีด้วย email/password เดิม (login ย้ายที่นั่ง Guest ให้ด้วย)
export async function register(input: RegisterInput): Promise<Me> {
  await apiFetch<unknown>('/api/v1/users/register', { method: 'POST', body: JSON.stringify(input) })
  return login({ email: input.email, password: input.password })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (me) => {
      queryClient.setQueryData(['me'], me)
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'me' })
    },
  })
}
