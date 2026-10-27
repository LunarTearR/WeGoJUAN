import { Link } from 'react-router'
import { useMe } from '../api/get-me'
import { useLogout } from '../api/logout'

// มุมขวาของ header: ชื่อ + ออกจากระบบ หรือปุ่มเข้าสู่ระบบ
export function UserMenu() {
  const { data: me } = useMe()
  const logoutMutation = useLogout()

  if (me === undefined) {
    return null
  }
  if (me === null) {
    return (
      <Link to="/login" className="text-sm underline">
        เข้าสู่ระบบ
      </Link>
    )
  }
  return (
    <div className="flex items-center gap-3 text-sm">
      <span>{me.display_name}</span>
      <button type="button" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending} className="underline">
        ออกจากระบบ
      </button>
    </div>
  )
}
