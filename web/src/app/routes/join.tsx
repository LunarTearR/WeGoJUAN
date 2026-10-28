import { Link, useParams } from 'react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { HomeAppBar } from '@/app/home-app-bar'
import { useMe } from '@/features/auth/api/get-me'
import { useInvite } from '@/features/trip/api/get-invite'
import { JoinTripForm } from '@/features/trip/components/join-trip-form'

export function JoinRoute() {
  return (
    <PageLayout header={<HomeAppBar />}>
      <Join />
    </PageLayout>
  )
}

// หน้าที่เปิดจากลิงก์เชิญ: ใครก็เปิดได้ เห็นแค่ชื่อทริปกับช่วงวัน
function Join() {
  const { code = '' } = useParams()
  const { data: invite, isPending, error } = useInvite(code)
  const { data: me } = useMe()

  if (isPending) {
    return <p className="text-gray-500">กำลังโหลดลิงก์เชิญ…</p>
  }
  if (error) {
    return <p className="text-red-700">ลิงก์เชิญนี้ใช้ไม่ได้ อาจถูกเปลี่ยนไปแล้ว ลองขอลิงก์ใหม่จากผู้จัด</p>
  }

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <p className="text-sm text-gray-600">คุณได้รับคำเชิญเข้าทริป</p>
      <div>
        <h1 className="text-xl font-semibold">{invite.title}</h1>
        <p className="text-sm text-gray-600">
          เลือกได้ {invite.start_date} ถึง {invite.end_date} · ไป {invite.duration_days} วัน
        </p>
      </div>
      {invite.is_member ? (
        <Link to={`/trips/${invite.trip_id}`} className="block rounded bg-gray-900 px-3 py-2 text-center text-white">
          ไปที่ทริป
        </Link>
      ) : me ? (
        <JoinTripForm code={code} />
      ) : (
        <div className="space-y-4">
          <JoinTripForm code={code} asGuest />
          <p className="text-center text-sm">
            มีบัญชีแล้ว?{' '}
            <Link to={`/login?next=${encodeURIComponent(`/join/${code}`)}`} className="underline">
              เข้าสู่ระบบเพื่อเข้าร่วม
            </Link>
          </p>
        </div>
      )}
    </section>
  )
}
