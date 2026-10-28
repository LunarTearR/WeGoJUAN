import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { HomeAppBar } from '@/app/home-app-bar'

export function NotFoundRoute() {
  return (
    <PageLayout header={<HomeAppBar />}>
      <EmptyState icon="busy" title="หลงทางแล้ว" action={<Button href="/trips">กลับไปที่ทริปของฉัน</Button>}>
        หน้านี้ไม่มีอยู่จริง
      </EmptyState>
    </PageLayout>
  )
}
