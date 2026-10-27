import { RegisterForm } from '@/features/auth/components/register-form'

export function RegisterRoute() {
  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">สมัครสมาชิก</h1>
      <RegisterForm />
    </section>
  )
}
