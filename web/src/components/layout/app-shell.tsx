import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { BottomNav } from './bottom-nav'
import { LayoutContext, ShellRootContext, layoutFor, type Layout } from './layout-context'
import type { NavKey } from './nav-items'
import { SideNav, type RecentTrip } from './side-nav'

type AppShellProps = {
  children?: ReactNode // ปกติคือ PageLayout ของหน้านั้น
  active?: NavKey
  user?: string // ชื่อที่แสดงในรูปย่อชื่อของ rail/แถบข้าง
  onUserClick?: () => void
  trips?: RecentTrip[]
  bottomNav?: boolean // false = ไม่มี BottomNav บนมือถือ (ในทริป และหน้าที่มีปุ่มหลักติดล่าง)
}

// อุปกรณ์สองจอ (Surface Duo กางสองจอ): เบราว์เซอร์รายงาน viewport สองท่อนซ้ายขวา
const SPLIT_QUERY = '(horizontal-viewport-segments: 2)'

function useViewportSegments(): boolean {
  const [split, setSplit] = useState(() => window.matchMedia(SPLIT_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(SPLIT_QUERY)
    const onChange = () => setSplit(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return split
}

// กรอบของทุกหน้า: เลือก layout จากความกว้างของตัวเอง (container query ใน CSS + ResizeObserver ที่นี่)
// แล้วสลับการนำทาง: compact → BottomNav · medium → rail · expanded → แถบข้าง · split → BottomNav บนจอซ้าย
export function AppShell({ children, active, user, onUserClick, trips, bottomNav = true }: AppShellProps) {
  const split = useViewportSegments()
  const [root, setRoot] = useState<HTMLDivElement | null>(null)
  const [layout, setLayout] = useState<Layout>(() => layoutFor(window.innerWidth, split))

  // วัดก่อนวาดจริง ไม่งั้นจอใหญ่จะเห็น layout มือถือแวบหนึ่ง
  useLayoutEffect(() => {
    if (!root) return
    // offsetWidth = ความกว้างตาม layout ไม่โดน transform
    const measure = () => setLayout(layoutFor(root.offsetWidth, split))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [root, split])

  return (
    <LayoutContext.Provider value={layout}>
      <ShellRootContext.Provider value={root}>
        <div ref={setRoot} className={cx('wg-app', `wg-app--${layout}`, split && 'wg-app--split')} data-layout={layout}>
          <div className="wg-app__frame">
            <SideNav active={active} trips={trips} user={user} onUserClick={onUserClick} />
            <main className={cx('wg-app__main', bottomNav && 'wg-app__main--nav')}>{children}</main>
          </div>
          {bottomNav && <BottomNav active={active} />}
        </div>
      </ShellRootContext.Provider>
    </LayoutContext.Provider>
  )
}
