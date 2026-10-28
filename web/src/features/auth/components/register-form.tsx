import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { useRegister } from '../api/register'
import { safeNext } from '../utils/safe-next'

export function RegisterForm() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const next = searchParams.get('next')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    registerMutation.mutate(
      { display_name: displayName, email, password },
      { onSuccess: () => navigate(safeNext(next), { replace: true }) },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="wg-stack">
      <TextField label="ชื่อที่แสดง" autoComplete="nickname" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <TextField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField
        label="รหัสผ่าน"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="อย่างน้อย 8 ตัว มีพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ (!@#$%^&*)"
      />
      {registerMutation.error && (
        <Banner tone="danger" title="อุ๊ย สมัครสมาชิกไม่สำเร็จ">
          {registerMutation.error.message}
        </Banner>
      )}
      <Button type="submit" block loading={registerMutation.isPending}>
        สมัครสมาชิก
      </Button>
      <Button variant="ghost" href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>
        มีบัญชีแล้ว? เข้าสู่ระบบ
      </Button>
    </form>
  )
}
