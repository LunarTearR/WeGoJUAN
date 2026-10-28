import { useNavigate } from 'react-router'
import { AppBar } from '@/components/layout/app-bar'
import { PageLayout } from '@/components/layout/page-layout'
import { CreateTripForm } from '@/features/trip/components/create-trip-form'

export function TripNewRoute() {
  const navigate = useNavigate()
  return (
    <PageLayout header={<AppBar title="สร้างทริป" onBack={() => navigate('/trips')} backLabel="กลับไปที่ทริปของฉัน" />}>
      <CreateTripForm />
    </PageLayout>
  )
}
