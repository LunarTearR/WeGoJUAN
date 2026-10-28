import type { ReactNode } from 'react'

type PageTitleProps = {
  title: string
  children?: ReactNode // บรรทัดรอง: ที่ใส่ความเป็นกันเอง
}

// หัวเรื่องของหน้าแท็บ (ทริปของฉัน, ปฏิทินของฉัน) — วางเป็นอันแรกในคอลัมน์หลัก
// ตั้งแต่ medium ไม่มี AppBar ข้างบนแล้ว จึงเว้นที่ด้านบนเพิ่ม
export function PageTitle({ title, children }: PageTitleProps) {
  return (
    <div className="@medium:pt-4">
      <h1 className="display">{title}</h1>
      {children && <p className="small wg-muted">{children}</p>}
    </div>
  )
}
