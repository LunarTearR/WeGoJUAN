import { Link } from 'react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { HomeAppBar } from '@/app/home-app-bar'

export function NotFoundRoute() {
  return (
    <PageLayout header={<HomeAppBar />}>
      <section className="space-y-2">
        <h1 className="text-xl font-semibold">ไม่พบหน้านี้</h1>
        <Link to="/" className="underline">
          กลับไปที่ปฏิทินของฉัน
        </Link>
      </section>
    </PageLayout>
  )
}
