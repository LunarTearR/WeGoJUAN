import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { ISODate } from '@/types/date'
import type { Mark } from '../types'

export function getMyMarks(from: ISODate, to: ISODate) {
  return apiFetch<Mark[]>(`/api/v1/availability?from=${from}&to=${to}`)
}

export function useMyMarks(from: ISODate, to: ISODate) {
  return useQuery({
    queryKey: ['availability', 'me', from, to],
    queryFn: () => getMyMarks(from, to),
  })
}
