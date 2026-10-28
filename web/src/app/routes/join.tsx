import { useParams } from 'react-router'
import { AppBar } from '@/components/layout/app-bar'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusIcon } from '@/components/ui/status-icon'
import { formatDayRange } from '@/lib/date'
import { useMe } from '@/features/auth/api/get-me'
import { useInvite } from '@/features/trip/api/get-invite'
import { JoinTripForm } from '@/features/trip/components/join-trip-form'

export function JoinRoute() {
  return (
    // ไม่มีปุ่มบัญชีบนแถบ: Guest มีลิงก์เข้าสู่ระบบอยู่ใต้ปุ่มเข้าร่วมแล้ว
    <PageLayout header={<AppBar homeHref="/trips" />}>
      <div className="mx-auto w-full max-w-[480px]">
        <Join />
      </div>
    </PageLayout>
  )
}

// หน้าที่เปิดจากลิงก์เชิญ: ใครก็เปิดได้ เห็นแค่ชื่อทริปกับช่วงวัน (API ตั้งใจไม่ส่งสมาชิกหรือผู้จัดมา)
function Join() {
  const { code = '' } = useParams()
  const { data: invite, isPending, error } = useInvite(code)
  const { data: me } = useMe()

  if (isPending) {
    return <p className="small wg-muted">กำลังโหลดลิงก์เชิญ…</p>
  }
  if (error) {
    return (
      <EmptyState icon="busy" title="ลิงก์เชิญนี้ใช้ไม่ได้แล้ว">
        อาจถูกเปลี่ยนไปแล้ว ลองขอลิงก์ใหม่จากผู้จัดนะ
      </EmptyState>
    )
  }

  return (
    <div className="wg-stack">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <StatusIcon kind="finding" size={88} />
        <p className="small font-semibold text-orange-ink">เพื่อนชวนคุณไปเที่ยว!</p>
        <h1 className="title">{invite.title}</h1>
        <p className="small wg-muted">
          เลือกได้ {formatDayRange(invite.start_date, invite.end_date)} · ไป {invite.duration_days} วัน
        </p>
      </div>
      {invite.is_member ? (
        <Button href={`/trips/${invite.trip_id}`} block>
          ไปที่ทริป
        </Button>
      ) : me ? (
        <JoinTripForm code={code} />
      ) : (
        <JoinTripForm
          code={code}
          asGuest
          footerLink={
            <Button variant="ghost" href={`/login?next=${encodeURIComponent(`/join/${code}`)}`}>
              มีบัญชีแล้ว? เข้าสู่ระบบ
            </Button>
          }
        />
      )}
    </div>
  )
}
