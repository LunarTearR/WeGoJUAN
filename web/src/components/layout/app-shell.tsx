import { NavLink, Outlet } from 'react-router'
import { ApiStatus } from './api-status'

// layout หลักของทุกหน้า: header ด้านบน แล้ว render หน้าปัจจุบันใน <Outlet />
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <NavLink to="/" className="font-semibold">
          myapp
        </NavLink>
        <ApiStatus />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
