import { useState } from 'react'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Face } from '@/components/ui/face'
import { Sheet } from '@/components/ui/sheet'
import { eachDay, formatDayRange } from '@/lib/date'
import { statusLabel } from '@/lib/mark'
import type { Status } from '@/types/mark'
import { usePushPreview } from '../api/get-push-preview'
import { usePushToTrip } from '../api/push-to-trip'
import type { Trip } from '../types'

const label = (s: Status | null) => statusLabel[s ?? 'unknown']

type PushPanelProps = {
  trip: Trip
  onDone: () => void
}

// Push: เลือกวันที่จะเอาสถานะจากปฏิทินส่วนตัวมาทับในทริป — ไม่ติ๊ก = คงค่าในทริปไว้ (Trip-only Mark)
export function PushPanel({ trip, onDone }: PushPanelProps) {
  const { data: days, isPending, error } = usePushPreview(trip.id)
  const pushMutation = usePushToTrip(trip.id)
  // เก็บเฉพาะวันที่ผู้ใช้กดสลับจากค่าเริ่มต้น — ไม่ต้องรอข้อมูลมาตั้งค่า
  const [toggled, setToggled] = useState<Set<string>>(new Set())
  // ค่าเริ่มต้นติ๊กทุกวัน ยกเว้น Confirmed Dates ของทริปนี้: ปฏิทินไม่ว่างวันนั้นเพราะจะไปทริปนี้เอง
  // ทับลงทริปแล้วจะกลายเป็นไม่ว่างในทริปของตัวเอง
  const confirmed = new Set(trip.confirmed_start && trip.confirmed_end ? eachDay(trip.confirmed_start, trip.confirmed_end) : [])
  const isPicked = (day: string) => !confirmed.has(day) !== toggled.has(day)

  function toggle(day: string) {
    setToggled((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const inSync = days?.length === 0
  // ตรงกันแล้ว: Push ว่าง = บันทึกว่าตรงกันแล้ว ไม่งั้นแบนเนอร์ "ช่วงวันเปลี่ยน" จะขึ้นทุกครั้ง (ปิดด้วยวิธีไหนก็ต้องบันทึก)
  const close = inSync ? () => pushMutation.mutate([], { onSuccess: onDone }) : onDone
  const picked = days?.filter((d) => isPicked(d.day)).map((d) => d.day) ?? []

  return (
    <Sheet
      open
      title="อัปเดตจากปฏิทินของฉัน"
      onClose={close}
      footer={
        inSync ? (
          <Button variant="secondary" loading={pushMutation.isPending} onClick={close}>
            ปิด
          </Button>
        ) : (
          days && (
            <>
              <Button variant="secondary" onClick={onDone}>
                ยกเลิก
              </Button>
              <Button loading={pushMutation.isPending} onClick={() => pushMutation.mutate(picked, { onSuccess: onDone })}>
                อัปเดตวันที่เลือก ({picked.length})
              </Button>
            </>
          )
        )
      }
    >
      <div className="wg-stack">
        {isPending && <p className="small wg-muted">กำลังเทียบกับปฏิทินของคุณ…</p>}
        {error && (
          <Banner tone="danger" title="โหลดไม่สำเร็จ">
            {error.message}
          </Banner>
        )}
        {inSync && (
          <p className="body flex items-center gap-3">
            <Face mood="free" size={32} />
            ทริปตรงกับปฏิทินแล้ว
          </p>
        )}
        {days && days.length > 0 && (
          <>
            <p className="small wg-muted">วันที่ทริปไม่ตรงกับปฏิทินของคุณ ติ๊กวันที่จะอัปเดตตามปฏิทิน</p>
            <div>
              {days.map((d) => (
                <Checkbox
                  key={d.day}
                  checked={isPicked(d.day)}
                  onChange={() => toggle(d.day)}
                  label={`${formatDayRange(d.day, d.day)} · ในทริป: ${label(d.trip_status)} → ปฏิทิน: ${label(d.calendar_status)}`}
                  description={confirmed.has(d.day) ? 'วันที่ยืนยันของทริปนี้' : d.calendar_reason}
                />
              ))}
            </div>
          </>
        )}
        {pushMutation.error && (
          <Banner tone="danger" title="อุ๊ย อัปเดตไม่สำเร็จ">
            {pushMutation.error.message}
          </Banner>
        )}
      </div>
    </Sheet>
  )
}
