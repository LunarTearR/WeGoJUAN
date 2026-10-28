import { AppBar } from '@/components/layout/app-bar'
import { PageLayout } from '@/components/layout/page-layout'
import { LoginForm } from '@/features/auth/components/login-form'

// การ์ดกลางจอกว้าง 480px ทุกขนาดจอ
export function LoginRoute() {
  return (
    <PageLayout header={<AppBar homeHref="/trips" />}>
      <section className="wg-card mx-auto w-full max-w-[480px] @medium:mt-6">
        <h1 className="title mb-4">เข้าสู่ระบบ</h1>
        <LoginForm />
      </section>
    </PageLayout>
  )
}
