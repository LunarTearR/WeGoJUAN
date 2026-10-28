import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { FormFooter } from '@/components/layout/form-footer'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { ApiError } from '@/lib/api-client'
import { useJoinTrip } from '../api/join-trip'

type JoinTripFormProps = {
  code: string
  asGuest?: boolean // Guest ต้องตั้งชื่อเสมอ, User ใช้ชื่อบัญชีได้เลย
  footerLink?: ReactNode // ลิงก์รองใต้ปุ่มหลัก เช่น "มีบัญชีแล้ว? เข้าสู่ระบบ"
}

// User กดเข้าร่วมได้เลยด้วยชื่อบัญชี — ถ้าชื่อซ้ำกับคนในทริป (409) ค่อยให้ตั้งชื่ออื่น
export function JoinTripForm({ code, asGuest = false, footerLink }: JoinTripFormProps) {
  const [displayName, setDisplayName] = useState('')
  const [askName, setAskName] = useState(asGuest)
  const navigate = useNavigate()
  const joinMutation = useJoinTrip(code)
  const nameTaken = joinMutation.error instanceof ApiError && joinMutation.error.status === 409

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
    <form onSubmit={handleSubmit} className="wg-stack">
      {askName && (
        <div className="wg-card">
          <TextField
            label="ชื่อที่ใช้ในทริปนี้"
            placeholder="เพื่อน ๆ เรียกคุณว่าอะไร?"
            required
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={nameTaken ? 'ชื่อนี้มีคนใช้ในทริปแล้ว ลองตั้งชื่ออื่น' : undefined}
            hint={asGuest ? 'ระบบจำคุณได้เฉพาะเครื่องนี้ สมัครทีหลังได้ วันว่างไม่หาย' : undefined}
          />
        </div>
      )}
      {joinMutation.error && !nameTaken && (
        <Banner tone="danger" title="อุ๊ย เข้าร่วมไม่สำเร็จ">
          {joinMutation.error.message}
        </Banner>
      )}
      <FormFooter>
        <Button type="submit" block loading={joinMutation.isPending}>
          {asGuest ? 'เข้าร่วมแบบไม่สมัครสมาชิก' : 'เข้าร่วมทริป'}
        </Button>
        {footerLink}
      </FormFooter>
    </form>
  )
}
