import { useQuery } from '@tanstack/react-query'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { Me } from '../types'

// 401 = ยังไม่ได้ login → คืน null แทน error ให้หน้าจอตัดสินใจเองว่าจะพาไป login ไหม
export async function getMe(): Promise<Me | null> {
  try {
    return await apiFetch<Me>('/api/v1/users/me')
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null
    }
    throw err
  }
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: getMe, retry: false })
}
