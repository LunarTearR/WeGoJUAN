import { useState } from 'react'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { formatWeekdayRange } from '@/lib/date'
import { useConfirmDates } from '../api/confirm-dates'
import { useSuggestions } from '../api/get-suggestions'
import type { Member, Trip } from '../types'
import { SuggestionCard } from './suggestion-card'

const TOP = 5 // ช่วงทั้งหมดที่โชว์
const FIRST = 3 // โชว์ก่อน ที่เหลือซ่อนไว้หลัง "ดูเพิ่ม"

type SuggestionListProps = {
  trip: Trip
  members: Member[]
  isOrganizer: boolean // ผู้จัดเลือก Window เป็น Confirmed Dates ได้
}

export function SuggestionList({ trip, members, isOrganizer }: SuggestionListProps) {
  const { data: suggestions, isPending, error, refetch } = useSuggestions(trip.id)
  const confirmMutation = useConfirmDates(trip.id)
  const [showAll, setShowAll] = useState(false)

  const top = suggestions?.slice(0, TOP) ?? []
  const shown = showAll ? top : top.slice(0, FIRST)
  const nameOf = new Map(members.map((m) => [m.id, m.display_name]))
  const names = (ids: string[]) => ids.map((id) => nameOf.get(id) ?? '?')

  return (
    <section aria-labelledby="suggestions-title">
      <div className="wg-section-head">
        <h2 id="suggestions-title" className="heading">
          ช่วงวันที่แนะนำ
        </h2>
        {top.length > 0 && <span className="small wg-muted">{top.length} ช่วง</span>}
      </div>

      {isPending && <p className="small wg-muted">กำลังหาวันที่ทุกคนว่าง…</p>}
      {error && (
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
        </Banner>
      )}
      {suggestions && top.length === 0 && (
        <EmptyState
          icon="finding"
          title="ยังหาวันที่ลงตัวไม่เจอ"
          action={
            // ลิงก์เชิญอยู่ในหน้าเดียวกัน (InviteLinkBox id="invite")
            <Button variant="secondary" icon="users" onClick={() => document.getElementById('invite')?.scrollIntoView({ behavior: 'smooth' })}>
              ชวนเพื่อนมาระบุวัน
            </Button>
          }
        >
          ชวนเพื่อนมาระบุวันเพิ่มอีกนิด เดี๋ยวก็เจอ
        </EmptyState>
      )}

      {confirmMutation.error && (
        <Banner tone="danger" title="อุ๊ย ยืนยันไม่สำเร็จ" className="mb-3">
          {confirmMutation.error.message}
        </Banner>
      )}
      {shown.length > 0 && (
        <div className="wg-card-grid">
          {shown.map((s, i) => (
            <SuggestionCard
              key={s.start}
              rank={i + 1}
              rangeLabel={formatWeekdayRange(s.start, s.end)}
              durationDays={trip.duration_days}
              available={names(s.available)}
              busy={names(s.busy)}
              unknown={names(s.unknown)}
              canConfirm={isOrganizer}
              onConfirm={() => confirmMutation.mutate(s.start)}
              confirming={confirmMutation.isPending && confirmMutation.variables === s.start}
              isConfirmed={trip.confirmed_start === s.start}
            />
          ))}
        </div>
      )}
      {top.length > shown.length && (
        <div className="mt-3 flex justify-center">
          <Button variant="ghost" iconEnd="chevron-right" onClick={() => setShowAll(true)}>
            ดูเพิ่มอีก {top.length - shown.length} ช่วง
          </Button>
        </div>
      )}
    </section>
  )
}
