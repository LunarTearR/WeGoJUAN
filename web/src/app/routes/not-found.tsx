import { Link } from 'react-router'

export function NotFoundRoute() {
  return (
    <section className="space-y-2">
      <h1 className="text-xl font-semibold">ไม่พบหน้านี้</h1>
      <Link to="/" className="underline">
        กลับไปที่ปฏิทินของฉัน
      </Link>
    </section>
  )
}
