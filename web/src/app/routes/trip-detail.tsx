import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { ApiError } from '@/lib/api-client'
import { eachDay } from '@/lib/date'
import { useTrip } from '@/features/trip/api/get-trip'
import { ConfirmedDates } from '@/features/trip/components/confirmed-dates'
import { ConfirmedOfferBanner } from '@/features/trip/components/confirmed-offer-banner'
import { InviteLinkBox } from '@/features/trip/components/invite-link-box'
import { MemberList } from '@/features/trip/components/member-list'
import { PushPanel } from '@/features/trip/components/push-panel'
import { ResyncBanner } from '@/features/trip/components/resync-banner'
import { SuggestionList } from '@/features/trip/components/suggestion-list'
import { TripMarksGrid } from '@/features/trip/components/trip-marks-grid'

// หน้านี้คือจุดที่ประกอบหลายส่วนของทริปเข้าด้วยกัน (เหมือน wiring ใน main.go)
export function TripDetailRoute() {
  const { tripId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { data, isPending, error } = useTrip(tripId)
  // ?push=1 = มาจากลิงก์ให้ re-sync → เปิดแผง Push ทันที
  const [pushOpen, setPushOpen] = useState(searchParams.get('push') === '1')
  // หลังตอบรับทำเครื่องหมายไม่ว่าง → ชวน re-sync ทริปอื่นที่เคย Push แล้วทับวันเหล่านั้น
  const [resyncDays, setResyncDays] = useState<string[]>([])

  if (isPending) {
    return <p className="text-gray-500">กำลังโหลดทริป…</p>
  }
  if (error instanceof ApiError && error.status === 404) {
    return <p className="text-red-700">ไม่พบทริปนี้ หรือคุณยังไม่ได้เป็นสมาชิก</p>
  }
  if (error) {
    return <p className="text-red-700">โหลดทริปไม่สำเร็จ: {error.message}</p>
  }

  const { trip, members, me } = data
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{trip.title}</h1>
        <p className="text-sm text-gray-600">
          เลือกได้ {trip.start_date} ถึง {trip.end_date} · ไป {trip.duration_days} วัน
        </p>
      </div>
      <ConfirmedDates trip={trip} members={members} isOrganizer={me.is_organizer} />
      {data.prompts.confirmed_offer && trip.confirmed_start && trip.confirmed_end && (
        <ConfirmedOfferBanner trip={trip} onAccepted={() => setResyncDays(eachDay(trip.confirmed_start!, trip.confirmed_end!))} />
      )}
      <ResyncBanner days={resyncDays} onDismiss={() => setResyncDays([])} />
      <div className="space-y-2">
        <h2 className="font-medium">ช่วงวันที่แนะนำ</h2>
        <SuggestionList trip={trip} members={members} isOrganizer={me.is_organizer} />
      </div>
      <InviteLinkBox code={trip.invite_code} />
      <div className="space-y-2">
        <h2 className="font-medium">สมาชิก</h2>
        <MemberList members={members} />
      </div>
      <div className="space-y-2">
        <h2 className="font-medium">วันว่างของสมาชิก</h2>
        {!me.is_guest &&
          (pushOpen ? (
            <PushPanel tripId={trip.id} onDone={() => setPushOpen(false)} />
          ) : (
            <button type="button" onClick={() => setPushOpen(true)} className="rounded border border-gray-300 px-3 py-1 text-sm">
              อัปเดตจากปฏิทินของฉัน
            </button>
          ))}
        <TripMarksGrid trip={trip} members={members} me={me} />
      </div>
    </section>
  )
}
