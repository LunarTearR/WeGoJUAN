import type { IconName } from '@/components/ui/icon'

export type NavKey = 'trips' | 'calendar'

// สองแท็บหลักของแอป: label ใช้ใน bottom nav (มือถือ) กับแถบข้าง (PC) · short ใช้ใน rail (แท็บเล็ต)
export const NAV_ITEMS: { key: NavKey; label: string; short: string; icon: IconName; href: string }[] = [
  { key: 'trips', label: 'ทริปของฉัน', short: 'ทริป', icon: 'trip', href: '/trips' },
  { key: 'calendar', label: 'ปฏิทินของฉัน', short: 'ปฏิทิน', icon: 'calendar', href: '/calendar' },
]

export const CREATE_HREF = '/trips/new'
export const CREATE_LABEL = 'สร้างทริป'
