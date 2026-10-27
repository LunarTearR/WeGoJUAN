import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { Me } from '../types'
import { login } from './login'

export type RegisterInput = {
  display_name: string
  email: string
  password: string
}

// ฝั่ง Go ไม่ตั้ง cookie ตอนสมัคร จึง login ต่อทันทีด้วย email/password เดิม
export async function register(input: RegisterInput): Promise<Me> {
  await apiFetch<unknown>('/api/v1/users/register', { method: 'POST', body: JSON.stringify(input) })
  const me = await login({ email: input.email, password: input.password })
  // Guest ที่สมัครบนเครื่องเดิม → ย้ายที่นั่งและ Mark มาเป็นของบัญชี (ล้มเหลวก็สมัครต่อได้)
  // ทำเฉพาะตอนสมัคร ไม่ทำตอน login — คน login บนเครื่องเพื่อนต้องไม่ยึดที่นั่ง Guest ของเพื่อน
  await apiFetch('/api/v1/trips/claim-guest', { method: 'POST' }).catch(() => undefined)
  return me
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
