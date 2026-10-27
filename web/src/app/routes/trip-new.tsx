import { CreateTripForm } from '@/features/trip/components/create-trip-form'

export function TripNewRoute() {
  return (
    <section className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">สร้างทริป</h1>
      <CreateTripForm />
    </section>
  )
}
