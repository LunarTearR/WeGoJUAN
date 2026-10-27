import { useState, type FormEvent } from 'react'
import { TextField } from '@/components/ui/text-field'
import { useUpdateTripDates } from '../api/update-trip-dates'
import type { Trip } from '../types'

// ผู้จัดแก้ Date Range / Duration — ขยายช่วงแล้ววันใหม่เป็น "ยังไม่ระบุ" ของทุกคน
export function EditDatesForm({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const [startDate, setStartDate] = useState(trip.start_date)
  const [endDate, setEndDate] = useState(trip.end_date)
  const [duration, setDuration] = useState(String(trip.duration_days))
  const updateMutation = useUpdateTripDates(trip.id)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    updateMutation.mutate({ start_date: startDate, end_date: endDate, duration_days: Number(duration) }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-gray-200 p-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="เลือกได้ตั้งแต่" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField label="ถึง" type="date" required min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <TextField label="ไปกี่วัน" type="number" required min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
      {trip.confirmed_start && <p className="text-xs text-gray-500">ถ้าวันที่ยืนยันไว้ไม่อยู่ในช่วงใหม่ จะถูกยกเลิก</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={updateMutation.isPending} className="rounded bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50">
          บันทึกช่วงวัน
        </button>
        <button type="button" onClick={onDone} className="text-sm underline">
          ยกเลิก
        </button>
      </div>
      {updateMutation.error && <p className="text-sm text-red-700">{updateMutation.error.message}</p>}
    </form>
  )
}
