import { useState } from 'react'
import { Outlet, useLocation, useMatches, useParams } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import type { NavKey } from '@/components/layout/nav-items'
import type { RecentTrip } from '@/components/layout/side-nav'
import { useMe } from '@/features/auth/api/get-me'
import { AccountSheet } from '@/features/auth/components/account-sheet'
import { useMyTrips } from '@/features/trip/api/get-my-trips'

// ตั้งใน handle ของ route ใน router.tsx
// bottomNav: false = หน้าที่มีทางออกของตัวเอง (ปุ่มกลับในทริป, ปุ่มหลักติดล่างของฟอร์ม) ไม่ต้องมี BottomNav บนมือถือ
export type ShellHandle = { bottomNav?: boolean }

// layout ของทุกหน้า: ประกอบ AppShell (shared) เข้ากับผู้ใช้และทริป (feature) ซึ่ง shared import เองไม่ได้
export function AppLayout() {
  const { pathname } = useLocation()
  const { tripId } = useParams()
  const bottomNav = !useMatches().some((m) => (m.handle as ShellHandle | undefined)?.bottomNav === false)
  const { data: me } = useMe()
  const { data: trips } = useMyTrips(Boolean(me))
  const [accountOpen, setAccountOpen] = useState(false)

  const active: NavKey | undefined = pathname.startsWith('/calendar') ? 'calendar' : pathname.startsWith('/trips') ? 'trips' : undefined
  // API เรียงทริปใหม่สุดก่อน → สามอันแรกคือทริปล่าสุด
  const recent: RecentTrip[] | undefined = trips?.slice(0, 3).map((trip) => ({
    key: trip.id,
    title: trip.title,
    status: trip.confirmed_start ? 'confirmed' : 'finding',
    href: `/trips/${trip.id}`,
    active: trip.id === tripId,
  }))

  return (
    <AppShell active={active} user={me?.display_name} onUserClick={() => setAccountOpen(true)} trips={recent} bottomNav={bottomNav}>
      <Outlet />
      <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} />
    </AppShell>
  )
}
