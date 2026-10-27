import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { ApiError } from '@/lib/api-client'
import { eachDay } from '@/lib/date'
import { useTrip } from '@/features/trip/api/get-trip'
import { useDeleteTrip, useLeaveTrip } from '@/features/trip/api/manage-trip'
import { ConfirmedDates } from '@/features/trip/components/confirmed-dates'
import { ConfirmedOfferBanner } from '@/features/trip/components/confirmed-offer-banner'
import { EditDatesForm } from '@/features/trip/components/edit-dates-form'
import { InviteLinkBox } from '@/features/trip/components/invite-link-box'
import { MemberList } from '@/features/trip/components/member-list'
import { PushPanel } from '@/features/trip/components/push-panel'
import { RepushBanner } from '@/features/trip/components/repush-banner'
import { ResyncBanner } from '@/features/trip/components/resync-banner'
import { SuggestionList } from '@/features/trip/components/suggestion-list'
import { TripMarksGrid } from '@/features/trip/components/trip-marks-grid'

// key ตาม tripId: ไปทริปอื่นจากหน้านี้ (เช่นลิงก์ re-sync) ต้องได้ state ใหม่ทั้งหน้า
// ไม่งั้นแผง Push / ฟอร์มแก้วัน / แบนเนอร์ของทริปเดิมตามไปด้วย
export function TripDetailRoute() {
  const { tripId = '' } = useParams()
  return <TripDetail key={tripId} />
}

// หน้านี้คือจุดที่ประกอบหลายส่วนของทริปเข้าด้วยกัน (เหมือน wiring ใน main.go)
function TripDetail() {
  const { tripId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { data, isPending, error } = useTrip(tripId)
  // ?push=1 = มาจากลิงก์ให้ re-sync → เปิดแผง Push ทันที
  const [pushOpen, setPushOpen] = useState(searchParams.get('push') === '1')
  // หลังตอบรับทำเครื่องหมายไม่ว่าง → ชวน re-sync ทริปอื่นที่เคย Push แล้วทับวันเหล่านั้น
  const [resyncDays, setResyncDays] = useState<string[]>([])
  const [editingDates, setEditingDates] = useState(false)
  const navigate = useNavigate()
  const deleteMutation = useDeleteTrip(tripId)
  const leaveMutation = useLeaveTrip(tripId)

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
        {me.is_organizer && !editingDates && (
          <button type="button" onClick={() => setEditingDates(true)} className="text-sm underline">
            แก้ไขช่วงวัน
          </button>
        )}
      </div>
      {editingDates && <EditDatesForm trip={trip} onDone={() => setEditingDates(false)} />}
      {data.prompts.repush && !pushOpen && <RepushBanner onOpenPush={() => setPushOpen(true)} />}
      <ConfirmedDates trip={trip} members={members} isOrganizer={me.is_organizer} />
      {data.prompts.confirmed_offer && trip.confirmed_start && trip.confirmed_end && (
        <ConfirmedOfferBanner trip={trip} onAccepted={() => setResyncDays(eachDay(trip.confirmed_start!, trip.confirmed_end!))} />
      )}
      <ResyncBanner days={resyncDays} onDismiss={() => setResyncDays([])} excludeTripId={trip.id} />
      <div className="space-y-2">
        <h2 className="font-medium">ช่วงวันที่แนะนำ</h2>
        <SuggestionList trip={trip} members={members} isOrganizer={me.is_organizer} />
      </div>
      <InviteLinkBox tripId={trip.id} code={trip.invite_code} canReplace={me.is_organizer} />
      <div className="space-y-2">
        <h2 className="font-medium">สมาชิก</h2>
        <MemberList tripId={trip.id} members={members} me={me} />
      </div>
      <div className="space-y-2">
        <h2 className="font-medium">วันว่างของสมาชิก</h2>
        {!me.is_guest &&
          (pushOpen ? (
            <PushPanel trip={trip} onDone={() => setPushOpen(false)} />
          ) : (
            <button type="button" onClick={() => setPushOpen(true)} className="rounded border border-gray-300 px-3 py-1 text-sm">
              อัปเดตจากปฏิทินของฉัน
            </button>
          ))}
        <TripMarksGrid trip={trip} members={members} me={me} />
      </div>
      {!me.is_organizer && (
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            disabled={leaveMutation.isPending}
            onClick={() => {
              if (window.confirm('ออกจากทริปนี้? วันว่างที่คุณระบุในทริปนี้จะหายไป')) {
                leaveMutation.mutate(undefined, { onSuccess: () => navigate(me.is_guest ? '/' : '/trips') })
              }
            }}
            className="text-sm text-red-700 underline"
          >
            ออกจากทริป
          </button>
          {leaveMutation.error && <p className="text-sm text-red-700">ออกไม่สำเร็จ: {leaveMutation.error.message}</p>}
        </div>
      )}
      {me.is_organizer && (
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(`ลบทริป "${trip.title}"? สมาชิกและวันว่างในทริปจะหายไปทั้งหมด`)) {
                deleteMutation.mutate(undefined, { onSuccess: () => navigate('/trips') })
              }
            }}
            className="text-sm text-red-700 underline"
          >
            ลบทริป
          </button>
          {deleteMutation.error && <p className="text-sm text-red-700">ลบไม่สำเร็จ: {deleteMutation.error.message}</p>}
        </div>
      )}
    </section>
  )
}
