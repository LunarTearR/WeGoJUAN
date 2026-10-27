import { Navigate, Outlet, useLocation } from 'react-router'
import { useMe } from '../api/get-me'

// layout route: หน้าลูกทั้งหมดต้อง login ก่อน ไม่งั้นพาไปหน้า login แล้วค่อยกลับมาที่เดิม
export function RequireUser() {
  const { data: me, isPending, error } = useMe()
  const { pathname, search } = useLocation()

  if (isPending) {
    return <p className="text-gray-500">กำลังโหลด…</p>
  }
  if (error) {
    return <p className="text-red-700">โหลดข้อมูลผู้ใช้ไม่สำเร็จ: {error.message}</p>
  }
  if (!me) {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
  }
  return <Outlet />
}
