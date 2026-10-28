import { PageLayout } from '@/components/layout/page-layout'
import { PageTitle } from '@/components/layout/page-title'
import { HomeAppBar } from '@/app/home-app-bar'
import { useMe } from '@/features/auth/api/get-me'
import { TripList } from '@/features/trip/components/trip-list'

// สร้างทริปอยู่ที่ปุ่มกลมใน BottomNav/rail และปุ่มในแถบข้าง ไม่ซ้ำในหน้านี้
export function TripsRoute() {
  const { data: me } = useMe()
  return (
    <PageLayout header={<HomeAppBar />}>
      <PageTitle title="ทริปของฉัน">{me && `สวัสดี ${me.display_name} วันนี้ชวนใครไปไหนดี?`}</PageTitle>
      <TripList />
    </PageLayout>
  )
}
