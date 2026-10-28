import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

// ปุ่มหลักของฟอร์ม (สร้างทริป, เข้าร่วมทริป) ติดขอบล่างจอบนมือถือ อยู่ในโซนนิ้วโป้ง — หลบ home indicator ด้วย --wg-safe-bottom
// ตั้งแต่ medium (รวม split ที่ห้ามพาดบานพับ) กลับมาอยู่ใต้ฟอร์มตามปกติ
// วางเป็นลูกตัวสุดท้ายของ <form> · หน้าที่ใช้ต้องปิด BottomNav (handle: { bottomNav: false })
export function FormFooter({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // footer ลอยอยู่นอก flow — เว้นที่ใต้ฟอร์มเท่าความสูงจริงของมัน ช่องสุดท้ายจะได้ไม่ถูกบัง
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div aria-hidden className="@medium:hidden" style={{ height }} />
      <div
        ref={ref}
        className="fixed inset-x-0 bottom-0 z-30 grid gap-2 border-t border-line bg-cream px-4 pt-3 pb-[calc(var(--space-4)+var(--wg-safe-bottom))] @medium:static @medium:border-0 @medium:bg-transparent @medium:p-0"
      >
        {children}
      </div>
    </>
  )
}
