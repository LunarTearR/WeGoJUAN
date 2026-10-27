import { useState } from 'react'
import { statusLabel } from '@/lib/mark'
import type { Status } from '@/types/mark'
import { usePushPreview } from '../api/get-push-preview'
import { usePushToTrip } from '../api/push-to-trip'

const label = (s: Status | null) => statusLabel[s ?? 'unknown']

// Push: เลือกวันที่จะเอาสถานะจากปฏิทินส่วนตัวมาทับในทริป — ไม่ติ๊ก = คงค่าในทริปไว้ (Trip-only Mark)
export function PushPanel({ tripId, onDone }: { tripId: string; onDone: () => void }) {
  const { data: days, isPending, error } = usePushPreview(tripId)
  const pushMutation = usePushToTrip(tripId)
  // เก็บวันที่ "ไม่เอา" แทนวันที่เลือก — ค่าเริ่มต้นจึงติ๊กครบทุกวันโดยไม่ต้องรอข้อมูลมาตั้งค่า
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

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
        <button type="button" onClick={onDone} className="text-sm underline">
          ปิด
        </button>
      </div>
    )
  }

  function toggle(day: string) {
    setSkipped((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const picked = days.filter((d) => !skipped.has(d.day)).map((d) => d.day)
  return (
    <div className="space-y-3 rounded border border-gray-200 p-3">
      <p className="text-sm text-gray-600">วันที่ทริปไม่ตรงกับปฏิทินของคุณ — ติ๊กวันที่จะอัปเดตตามปฏิทิน</p>
      <ul className="space-y-1">
        {days.map((d) => (
          <li key={d.day}>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!skipped.has(d.day)} onChange={() => toggle(d.day)} />
              <span>
                {d.day} · ในทริป: {label(d.trip_status)} → ปฏิทิน: {label(d.calendar_status)}
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
