import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField label="ชื่อที่แสดง" autoComplete="nickname" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <TextField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField
        label="รหัสผ่าน"
        type="password"
        autoComplete="new-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <p className="text-xs text-gray-500">อย่างน้อย 8 ตัว มีพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ (!@#$%^&*)</p>
      <button type="submit" disabled={registerMutation.isPending} className="w-full rounded bg-gray-900 px-3 py-2 text-white disabled:opacity-50">
        สมัครสมาชิก
      </button>
      {registerMutation.error && <p className="text-sm text-red-700">{registerMutation.error.message}</p>}
      <p className="text-sm">
        มีบัญชีแล้ว?{' '}
        <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  )
}
