import { env } from '@/config/env'
import type { ApiErrorBody } from '@/types/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// fetch wrapper ตัวเดียวของทั้งแอป: ใส่ base URL, header และแปลง error เป็น ApiError
// วันหลังที่มี auth ให้เพิ่ม Authorization header หรือ credentials ที่นี่ที่เดียว
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null
    throw new ApiError(res.status, body?.error ?? res.statusText)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}
