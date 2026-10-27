import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField label="ชื่อทริป" required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="เลือกได้ตั้งแต่" type="date" required min={today} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextField label="ถึง" type="date" required min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <TextField label="ไปกี่วัน" type="number" required min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
      <button type="submit" disabled={createMutation.isPending} className="w-full rounded bg-gray-900 px-3 py-2 text-white disabled:opacity-50">
        สร้างทริป
      </button>
      {createMutation.error && <p className="text-sm text-red-700">{createMutation.error.message}</p>}
    </form>
  )
}
