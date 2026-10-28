import { Navigate, Outlet, useLocation } from 'react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { Banner } from '@/components/ui/banner'
import { useMe } from '../api/get-me'

// layout route: หน้าลูกทั้งหมดต้อง login ก่อน ไม่งั้นพาไปหน้า login แล้วค่อยกลับมาที่เดิม
export function RequireUser() {
  const { data: me, isPending, error } = useMe()
  const { pathname, search } = useLocation()

  if (isPending) {
    return (
      <PageLayout>
        <p className="small wg-muted">กำลังโหลด…</p>
      </PageLayout>
    )
  }
  if (error) {
    return (
      <PageLayout>
        <Banner tone="danger" title="โหลดไม่สำเร็จ">
          {error.message}
        </Banner>
      </PageLayout>
    )
  }
  if (!me) {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />
  }
  return <Outlet />
}
