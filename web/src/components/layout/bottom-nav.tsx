import { Link } from 'react-router'
import { Icon } from '@/components/ui/icon'
import { CREATE_HREF, CREATE_LABEL, NAV_ITEMS, type NavKey } from './nav-items'

// แถบลอยด้านล่างของมือถือ: ทริปของฉัน · ปุ่มกลมสร้างทริป · ปฏิทินของฉัน
// AppShell วาดให้เองตอน compact (และจอซ้ายตอน split) — ตั้งแต่ medium ซ่อน ใช้ rail/แถบข้างแทน
export function BottomNav({ active }: { active?: NavKey }) {
  const [left, right] = NAV_ITEMS
  return (
    <nav className="wg-bottomnav" aria-label="เมนูหลัก">
      <NavItem item={left} active={active} />
      <Link to={CREATE_HREF} className="wg-fab" aria-label={CREATE_LABEL}>
        <Icon name="plus" size={28} />
      </Link>
      <NavItem item={right} active={active} />
    </nav>
  )
}

function NavItem({ item, active }: { item: (typeof NAV_ITEMS)[number]; active?: NavKey }) {
  return (
    <Link to={item.href} className="wg-bottomnav__item" aria-current={item.key === active ? 'page' : undefined}>
      <span className="wg-bottomnav__icon">
        <Icon name={item.icon} size={22} />
      </span>
      <span className="wg-bottomnav__label caption">{item.label}</span>
    </Link>
  )
}
