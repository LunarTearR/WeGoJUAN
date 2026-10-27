import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // ข้อมูลถือว่าสดอยู่ 30 วินาที ไม่ต้องยิงซ้ำทุกครั้งที่ component mount
      retry: 1,
    },
  },
})
