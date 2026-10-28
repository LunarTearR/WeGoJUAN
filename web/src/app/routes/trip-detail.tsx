import { useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { AppBar } from '@/components/layout/app-bar'
import { useLayout } from '@/components/layout/layout-context'
import { PageLayout } from '@/components/layout/page-layout'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { ConfirmSheet } from '@/components/ui/confirm-sheet'
import { EmptyState } from '@/components/ui/empty-state'
import { IconButton } from '@/components/ui/icon-button'
import { ApiError } from '@/lib/api-client'
import { eachDay, formatDayRange } from '@/lib/date'
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
import { TripCalendar } from '@/features/trip/components/trip-calendar'

// key ตาม tripId: ไปทริปอื่นจากหน้านี้ (เช่นลิงก์ re-sync) ต้องได้ state ใหม่ทั้งหน้า
// ไม่งั้นแผง Push / ฟอร์มแก้วัน / แบนเนอร์ของทริปเดิมตามไปด้วย
export function TripDetailRoute() {
  const { tripId = '' } = useParams()
  return <TripDetail key={tripId} />
}

// หน้านี้คือจุดที่ประกอบหลายส่วนของทริปเข้าด้วยกัน (เหมือน wiring ใน main.go)
// main = สถานะ → แบนเนอร์ → (ช่วงที่แนะนำ บนมือถือ/แท็บเล็ต) → ปฏิทินสมาชิก
// aside = (ช่วงที่แนะนำ บน PC/Duo) → สมาชิก → ลิงก์เชิญ → ออก/ลบ ล่างสุด
function TripDetail() {
  const { tripId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { data, isPending, error, refetch } = useTrip(tripId)
  // ?push=1 = มาจากลิงก์ให้ re-sync → เปิดแผง Push ทันที
  const [pushOpen, setPushOpen] = useState(searchParams.get('push') === '1')
  // หลังตอบรับทำเครื่องหมายไม่ว่าง → ชวน re-sync ทริปอื่นที่เคย Push แล้วทับวันเหล่านั้น
  const [resyncDays, setResyncDays] = useState<string[]>([])
  const [editingDates, setEditingDates] = useState(false)
  const [confirming, setConfirming] = useState<'leave' | 'delete' | null>(null)
  const navigate = useNavigate()
  const layout = useLayout()
  const deleteMutation = useDeleteTrip(tripId)
  const leaveMutation = useLeaveTrip(tripId)

  const back = () => navigate('/trips')
  // ยังไม่มีข้อมูลทริป: แถบบนมีแค่ปุ่มกลับ
  const plain = (content: ReactNode) => <PageLayout header={<AppBar title="ทริป" onBack={back} />}>{content}</PageLayout>

  if (isPending) {
    return plain(<p className="small wg-muted">กำลังโหลดทริป…</p>)
  }
  if (error instanceof ApiError && error.status === 404) {
    return plain(
      <EmptyState mood="unknown" title="หาทริปนี้ไม่เจอ" action={<Button href="/trips">กลับไปที่ทริปของฉัน</Button>}>
        อาจถูกลบไปแล้ว หรือคุณยังไม่ได้เป็นสมาชิก
      </EmptyState>,
    )
  }
  if (error) {
    return plain(
      <Banner
        tone="danger"
        title="โหลดไม่สำเร็จ"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            ลองอีกครั้ง
          </Button>
        }
      >
        {error.message}
      </Banner>,
    )
  }

  const { trip, members, me } = data
  // PC และ Duo มี aside ข้าง ๆ ให้ช่วงที่แนะนำ — มือถือ/แท็บเล็ตวางไว้ก่อนปฏิทิน
  const suggestionsInAside = layout === 'expanded' || layout === 'split'
  const suggestions = <SuggestionList trip={trip} members={members} isOrganizer={me.is_organizer} />
  const editAction =
    me.is_organizer &&
    (layout === 'compact' ? (
      <IconButton icon="edit" plain label="แก้ไขช่วงวัน" onClick={() => setEditingDates(true)} />
    ) : (
      <Button variant="secondary" size="sm" icon="edit" onClick={() => setEditingDates(true)}>
        แก้ไขช่วงวัน
      </Button>
    ))

  return (
    <PageLayout
      header={
        <AppBar
          title={trip.title}
          subtitle={`เลือกได้ ${formatDayRange(trip.start_date, trip.end_date)} · ไป ${trip.duration_days} วัน`}
          onBack={back}
          backLabel="กลับไปที่ทริปของฉัน"
          actions={editAction}
        />
      }
      asideLabel="ช่วงวันที่แนะนำ สมาชิก และลิงก์เชิญ"
      aside={
        <>
          {suggestionsInAside && suggestions}
          <MemberList tripId={trip.id} members={members} me={me} />
          <InviteLinkBox tripId={trip.id} code={trip.invite_code} canReplace={me.is_organizer} />
          <div className="border-t border-line pt-4">
            {me.is_organizer ? (
              <Button variant="danger" icon="trash" onClick={() => setConfirming('delete')}>
                ลบทริป
              </Button>
            ) : (
              <Button variant="danger" icon="exit" onClick={() => setConfirming('leave')}>
                ออกจากทริป
              </Button>
            )}
          </div>
        </>
      }
    >
      <ConfirmedDates trip={trip} members={members} isOrganizer={me.is_organizer} />
      {data.prompts.repush && !pushOpen && <RepushBanner onOpenPush={() => setPushOpen(true)} />}
      {data.prompts.confirmed_offer && trip.confirmed_start && trip.confirmed_end && (
        <ConfirmedOfferBanner trip={trip} onAccepted={() => setResyncDays(eachDay(trip.confirmed_start!, trip.confirmed_end!))} />
      )}
      <ResyncBanner days={resyncDays} onDismiss={() => setResyncDays([])} excludeTripId={trip.id} />
      {!suggestionsInAside && suggestions}
      <section aria-labelledby="trip-calendar-title">
        <div className="wg-section-head flex-wrap items-center">
          <h2 id="trip-calendar-title" className="heading">
            วันว่างของสมาชิก
          </h2>
          {!me.is_guest && (
            <Button variant="secondary" size="sm" icon="refresh" onClick={() => setPushOpen(true)}>
              อัปเดตจากปฏิทินของฉัน
            </Button>
          )}
        </div>
        <TripCalendar trip={trip} members={members} me={me} />
      </section>

      {!me.is_guest && pushOpen && <PushPanel trip={trip} onDone={() => setPushOpen(false)} />}
      {editingDates && <EditDatesForm trip={trip} onDone={() => setEditingDates(false)} />}
      <ConfirmSheet
        open={confirming === 'delete'}
        title={`ลบทริป "${trip.title}"?`}
        confirmLabel="ลบทริป"
        danger
        pending={deleteMutation.isPending}
        error={deleteMutation.error && `ลบไม่สำเร็จ: ${deleteMutation.error.message}`}
        onConfirm={() => deleteMutation.mutate(undefined, { onSuccess: () => navigate('/trips') })}
        onCancel={() => setConfirming(null)}
      >
        สมาชิกและวันว่างในทริปจะหายไปทั้งหมด ย้อนกลับไม่ได้
      </ConfirmSheet>
      <ConfirmSheet
        open={confirming === 'leave'}
        title="ออกจากทริปนี้?"
        confirmLabel="ออกจากทริป"
        danger
        pending={leaveMutation.isPending}
        error={leaveMutation.error && `ออกไม่สำเร็จ: ${leaveMutation.error.message}`}
        onConfirm={() => leaveMutation.mutate(undefined, { onSuccess: () => navigate(me.is_guest ? '/' : '/trips') })}
        onCancel={() => setConfirming(null)}
      >
        วันว่างที่คุณระบุในทริปนี้จะหายไป
      </ConfirmSheet>
    </PageLayout>
  )
}
