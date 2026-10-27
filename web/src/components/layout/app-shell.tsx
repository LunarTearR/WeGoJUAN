import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router'
import { ApiStatus } from './api-status'

type AppShellProps = {
  actions?: ReactNode // มุมขวาของ header เช่นเมนูผู้ใช้ (ส่งมาจาก app เพราะ shared import feature ไม่ได้)
}

// layout หลักของทุกหน้า: header ด้านบน แล้ว render หน้าปัจจุบันใน <Outlet />
export function AppShell({ actions }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3">
        <nav className="flex items-center gap-4">
          <NavLink to="/" className="font-semibold">
            myapp
          </NavLink>
          <NavLink to="/" end className={({ isActive }) => `text-sm ${isActive ? 'underline' : ''}`}>
            ปฏิทินของฉัน
          </NavLink>
          <NavLink to="/trips" className={({ isActive }) => `text-sm ${isActive ? 'underline' : ''}`}>
            ทริปของฉัน
          </NavLink>
        </nav>
        <div className="flex items-center gap-4">
          {actions}
          <ApiStatus />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
