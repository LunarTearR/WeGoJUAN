import { useState, type FormEvent } from 'react'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { TextField } from '@/components/ui/text-field'
import { todayISO } from '@/lib/date'
import { useUpdateTripDates } from '../api/update-trip-dates'
import type { Trip } from '../types'
import { dateRangeErrors } from '../utils/date-range-errors'

// ผู้จัดแก้ Date Range / Duration — ขยายช่วงแล้ววันใหม่เป็น "ยังไม่ระบุ" ของทุกคน
export function EditDatesForm({ trip, onDone }: { trip: Trip; onDone: () => void }) {
  const [startDate, setStartDate] = useState(trip.start_date)
  const [endDate, setEndDate] = useState(trip.end_date)
  const [duration, setDuration] = useState(String(trip.duration_days))
  const updateMutation = useUpdateTripDates(trip.id)
  const [today] = useState(todayISO)
  // ทริปที่เริ่มไปแล้ว: วันเริ่มเดิมคงไว้ได้ แต่ห้ามเลื่อนไปวันอื่นในอดีต
  const dateErrors = dateRangeErrors(startDate, endDate, today, trip.start_date)
  // min ต้องไม่เกินวันเริ่มเดิม ไม่งั้นเบราว์เซอร์จะไม่ยอมส่งฟอร์มที่วันเริ่มเดิมอยู่ในอดีต
  const startMin = trip.start_date < today ? trip.start_date : today

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    updateMutation.mutate({ start_date: startDate, end_date: endDate, duration_days: Number(duration) }, { onSuccess: onDone })
  }

  return (
    <Sheet
      open
      title="แก้ไขช่วงวัน"
      onClose={onDone}
      footer={
        <>
          <Button variant="secondary" onClick={onDone}>
            ยกเลิก
          </Button>
          {/* ปุ่มอยู่ใน footer ของ Sheet นอก <form> จึงผูกด้วย form="…" */}
          <Button type="submit" form="edit-trip-dates" loading={updateMutation.isPending} disabled={Boolean(dateErrors.start || dateErrors.end)}>
            บันทึกช่วงวัน
          </Button>
        </>
      }
    >
      <form id="edit-trip-dates" onSubmit={handleSubmit} className="wg-stack">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="เลือกได้ตั้งแต่"
            type="date"
            required
            min={startMin}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={dateErrors.start}
          />
          <TextField
            label="ถึง"
            type="date"
            required
            min={startDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={dateErrors.end}
          />
        </div>
        <TextField
          label="ไปกี่วัน"
          type="number"
          required
          min={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          hint="ไปติดกันกี่วัน เช่น 3 = ศุกร์ถึงอาทิตย์"
        />
        {trip.confirmed_start && <p className="small wg-muted">ถ้าวันที่ยืนยันไว้ไม่อยู่ในช่วงใหม่ จะถูกยกเลิก</p>}
        {updateMutation.error && (
          <Banner tone="danger" title="อุ๊ย บันทึกไม่สำเร็จ">
            {updateMutation.error.message}
          </Banner>
        )}
      </form>
    </Sheet>
  )
}
