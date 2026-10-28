import { PageLayout } from '@/components/layout/page-layout'
import { HomeAppBar } from '@/app/home-app-bar'
import { LoginForm } from '@/features/auth/components/login-form'

export function LoginRoute() {
  return (
    <PageLayout header={<HomeAppBar />}>
      <section className="mx-auto max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">เข้าสู่ระบบ</h1>
        <LoginForm />
      </section>
    </PageLayout>
  )
}
