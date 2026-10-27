import { useParams } from 'react-router'
import { useTrip } from '@/features/trip/api/get-trip'
import { InviteLinkBox } from '@/features/trip/components/invite-link-box'
import { MemberList } from '@/features/trip/components/member-list'

// หน้านี้คือจุดที่ประกอบหลายส่วนของทริปเข้าด้วยกัน (เหมือน wiring ใน main.go)
export function TripDetailRoute() {
  const { tripId = '' } = useParams()
  const { data, isPending, error } = useTrip(tripId)

  if (isPending) {
    return <p className="text-gray-500">กำลังโหลดทริป…</p>
  }
  if (error) {
    return <p className="text-red-700">โหลดทริปไม่สำเร็จ: {error.message}</p>
  }

  const { trip, members } = data
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{trip.title}</h1>
        <p className="text-sm text-gray-600">
          เลือกได้ {trip.start_date} ถึง {trip.end_date} · ไป {trip.duration_days} วัน
        </p>
      </div>
      <InviteLinkBox code={trip.invite_code} />
      <div className="space-y-2">
        <h2 className="font-medium">สมาชิก</h2>
        <MemberList members={members} />
      </div>
    </section>
  )
}
