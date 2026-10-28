import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { FormFooter } from '@/components/layout/form-footer'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Face } from '@/components/ui/face'
import { TextField } from '@/components/ui/text-field'
import { todayISO } from '@/lib/date'
import { useCreateTrip } from '../api/create-trip'

export function CreateTripForm() {
  const [today] = useState(todayISO)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [duration, setDuration] = useState('1')
  const navigate = useNavigate()
  const createMutation = useCreateTrip()

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    createMutation.mutate(
      { title, start_date: startDate, end_date: endDate, duration_days: Number(duration) },
      { onSuccess: (trip) => navigate(`/trips/${trip.id}`) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="wg-stack max-w-(--content-max)">
      <div className="flex items-start gap-3">
        <Face mood="free" size={44} className="shrink-0" />
        <p className="small wg-muted">ตั้งชื่อ เลือกช่วงวันที่เปิดให้เลือก แล้วส่งลิงก์เข้ากลุ่ม ที่เหลือเราช่วยหาวันให้</p>
      </div>
      <TextField
        label="ชื่อทริป"
        placeholder="เช่น ทะเลกันมั้ย แก๊ง"
        required
        maxLength={100}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="เลือกได้ตั้งแต่" type="date" required min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField label="ถึง" type="date" required min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
      {createMutation.error && (
        <Banner tone="danger" title="อุ๊ย สร้างทริปไม่สำเร็จ">
          {createMutation.error.message}
        </Banner>
      )}
      <FormFooter>
        <Button type="submit" block icon="plus" loading={createMutation.isPending}>
          สร้างทริป
        </Button>
      </FormFooter>
    </form>
  )
}
