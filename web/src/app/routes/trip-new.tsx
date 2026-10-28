import { PageLayout } from '@/components/layout/page-layout'
import { HomeAppBar } from '@/app/home-app-bar'
import { CreateTripForm } from '@/features/trip/components/create-trip-form'

export function TripNewRoute() {
  return (
    <PageLayout header={<HomeAppBar />}>
      <section className="mx-auto max-w-md space-y-4">
        <h1 className="text-xl font-semibold">สร้างทริป</h1>
        <CreateTripForm />
      </section>
    </PageLayout>
  )
}
