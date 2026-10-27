import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { TextField } from '@/components/ui/text-field'
import { useLogin } from '../api/login'
import { safeNext } from '../utils/safe-next'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const next = searchParams.get('next')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    loginMutation.mutate({ email, password }, { onSuccess: () => navigate(safeNext(next), { replace: true }) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField
        label="รหัสผ่าน"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={loginMutation.isPending} className="w-full rounded bg-gray-900 px-3 py-2 text-white disabled:opacity-50">
        เข้าสู่ระบบ
      </button>
      {loginMutation.error && <p className="text-sm text-red-700">{loginMutation.error.message}</p>}
      <p className="text-sm">
        ยังไม่มีบัญชี?{' '}
        <Link to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} className="underline">
          สมัครสมาชิก
        </Link>
      </p>
    </form>
  )
}
