import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { queryClient } from '@/lib/query-client'

// provider ระดับแอปทั้งหมดอยู่ที่นี่ (วันหลัง: AuthProvider, theme, toast)
export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
