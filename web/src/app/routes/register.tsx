import { AppBar } from '@/components/layout/app-bar'
import { PageLayout } from '@/components/layout/page-layout'
import { RegisterForm } from '@/features/auth/components/register-form'

// การ์ดกลางจอกว้าง 480px ทุกขนาดจอ
export function RegisterRoute() {
  return (
    <PageLayout header={<AppBar homeHref="/trips" />}>
      <section className="wg-card mx-auto w-full max-w-[480px] @medium:mt-6">
        <h1 className="title mb-4">สมัครสมาชิก</h1>
        <RegisterForm />
      </section>
    </PageLayout>
  )
}
