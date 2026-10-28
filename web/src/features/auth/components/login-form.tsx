import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
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
    <form onSubmit={handleSubmit} className="wg-stack">
      <TextField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField
        label="รหัสผ่าน"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {loginMutation.error && (
        <Banner tone="danger" title="อุ๊ย เข้าสู่ระบบไม่สำเร็จ">
          {loginMutation.error.message}
        </Banner>
      )}
      <Button type="submit" block loading={loginMutation.isPending}>
        เข้าสู่ระบบ
      </Button>
      <Button variant="ghost" href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>
        ยังไม่มีบัญชี? สมัครสมาชิก
      </Button>
    </form>
  )
}
