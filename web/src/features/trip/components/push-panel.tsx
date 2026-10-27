import { useState } from 'react'
import { eachDay } from '@/lib/date'
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

  if (isPending) {
    return <p className="text-gray-500">กำลังเทียบกับปฏิทินของคุณ…</p>
  }
  if (error) {
    return <p className="text-red-700">เทียบกับปฏิทินไม่สำเร็จ: {error.message}</p>
  }
  if (days.length === 0) {
    return (
      <div className="space-y-2 rounded border border-gray-200 p-3">
        <p>ทริปตรงกับปฏิทินแล้ว</p>
        {/* Push ว่าง = บันทึกว่าตรงกันแล้ว ไม่งั้นแบนเนอร์ "ช่วงวันเปลี่ยน" จะขึ้นทุกครั้ง */}
        <button type="button" disabled={pushMutation.isPending} onClick={() => pushMutation.mutate([], { onSuccess: onDone })} className="text-sm underline">
          ปิด
        </button>
      </div>
    )
  }

  function toggle(day: string) {
    setToggled((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const picked = days.filter((d) => isPicked(d.day)).map((d) => d.day)
  return (
    <div className="space-y-3 rounded border border-gray-200 p-3">
      <p className="text-sm text-gray-600">วันที่ทริปไม่ตรงกับปฏิทินของคุณ — ติ๊กวันที่จะอัปเดตตามปฏิทิน</p>
      <ul className="space-y-1">
        {days.map((d) => (
          <li key={d.day}>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPicked(d.day)} onChange={() => toggle(d.day)} />
              <span>
                {d.day} · ในทริป: {label(d.trip_status)} → ปฏิทิน: {label(d.calendar_status)}
                {d.calendar_reason && <span className="text-gray-500"> ({d.calendar_reason})</span>}
                {confirmed.has(d.day) && <span className="text-gray-500"> (วันที่ยืนยันของทริปนี้)</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pushMutation.isPending}
          onClick={() => pushMutation.mutate(picked, { onSuccess: onDone })}
          className="rounded bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          อัปเดตวันที่เลือก ({picked.length})
        </button>
        <button type="button" onClick={onDone} className="text-sm underline">
          ยกเลิก
        </button>
      </div>
      {pushMutation.error && <p className="text-sm text-red-700">อัปเดตไม่สำเร็จ: {pushMutation.error.message}</p>}
    </div>
  )
}
