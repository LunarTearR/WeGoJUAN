import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Face, type Mood } from '@/components/ui/face'
import { Icon } from '@/components/ui/icon'
import { Initials } from '@/components/ui/initials'
import { CREATE_HREF, CREATE_LABEL, NAV_ITEMS, type NavKey } from './nav-items'
import { Wordmark } from './wordmark'

export type RecentTrip = {
  key: string
  title: string
  mood: Mood // party = ยืนยันแล้ว · unknown = กำลังหาวัน
  href: string
  active?: boolean
}

type SideNavProps = {
  active?: NavKey
  trips?: RecentTrip[] // ทริปล่าสุด ไม่เกินสามอัน (แสดงเฉพาะแถบข้าง PC)
  user?: string
  onUserClick?: () => void // กดชื่อผู้ใช้ด้านล่าง เช่นเปิดแผ่นบัญชี
}

// medium = rail แคบ (หน้ายิ้ม ปุ่มกลมสร้างทริป แท็บชื่อสั้น รูปย่อชื่อ)
// expanded = แถบข้าง (ชื่อแอป ปุ่มสร้างทริปเต็มแถว แท็บชื่อเต็ม ทริปล่าสุด ชื่อผู้ใช้) — CSS สลับให้จากความกว้างของ AppShell
export function SideNav({ active, trips, user, onUserClick }: SideNavProps) {
  return (
    <nav className="wg-sidenav" aria-label="เมนูหลัก">
      <div className="wg-sidenav__brand">
        <span className="wg-sidenav__mark">
          <Face mood="party" size={40} />
        </span>
        <span className="wg-sidenav__word">
          <Wordmark href="/trips" />
        </span>
      </div>
      <div className="wg-sidenav__create">
        <Link to={CREATE_HREF} className="wg-fab wg-sidenav__fab" aria-label={CREATE_LABEL}>
          <Icon name="plus" size={28} />
        </Link>
        <Button href={CREATE_HREF} block icon="plus" className="wg-sidenav__btn">
          {CREATE_LABEL}
        </Button>
      </div>
      <ul className="wg-sidenav__items">
        {NAV_ITEMS.map((item) => (
          <li key={item.key}>
            <Link to={item.href} className="wg-sidenav__item" aria-current={item.key === active ? 'page' : undefined}>
              <span className="wg-sidenav__icon">
                <Icon name={item.icon} size={22} />
              </span>
              <span className="wg-sidenav__label caption">
                <span className="wg-sidenav__short">{item.short}</span>
                <span className="wg-sidenav__long">{item.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {trips && trips.length > 0 && (
        <div className="wg-sidenav__trips">
          <p className="wg-sidenav__heading caption">ทริปล่าสุด</p>
          <ul>
            {trips.map((trip) => (
              <li key={trip.key}>
                <Link to={trip.href} className="wg-sidenav__trip small" aria-current={trip.active ? 'page' : undefined}>
                  <Face mood={trip.mood} size={24} />
                  <span>{trip.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {user && (
        <button
          type="button"
          className="wg-sidenav__user min-h-11 w-full cursor-pointer rounded-control focus-visible:shadow-[var(--focus-ring)] focus-visible:outline-none"
          aria-label={`บัญชีของฉัน (${user})`}
          onClick={onUserClick}
        >
          <Initials name={user} size="md" decorative />
          <span className="wg-sidenav__username small">{user}</span>
        </button>
      )}
    </nav>
  )
}
