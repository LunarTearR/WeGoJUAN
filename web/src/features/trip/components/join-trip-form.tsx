import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { TextField } from '@/components/ui/text-field'
import { ApiError } from '@/lib/api-client'
import { useJoinTrip } from '../api/join-trip'

// User กดเข้าร่วมได้เลยด้วยชื่อบัญชี — ถ้าชื่อซ้ำกับคนในทริป (409) ค่อยให้ตั้งชื่ออื่น
export function JoinTripForm({ code }: { code: string }) {
  const [displayName, setDisplayName] = useState('')
  const navigate = useNavigate()
  const joinMutation = useJoinTrip(code)
  const nameTaken = joinMutation.error instanceof ApiError && joinMutation.error.status === 409
  const [askName, setAskName] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    joinMutation.mutate(displayName, {
      onSuccess: (r) => navigate(`/trips/${r.trip_id}`),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) setAskName(true)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {askName && (
        <TextField label="ชื่อที่ใช้ในทริปนี้" required maxLength={50} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      )}
      <button type="submit" disabled={joinMutation.isPending} className="w-full rounded bg-gray-900 px-3 py-2 text-white disabled:opacity-50">
        เข้าร่วมทริป
      </button>
      {joinMutation.error && (
        <p className="text-sm text-red-700">{nameTaken ? 'ชื่อนี้มีคนใช้ในทริปแล้ว ลองตั้งชื่ออื่น' : joinMutation.error.message}</p>
      )}
    </form>
  )
}
