import { AppBar } from '@/components/layout/app-bar'
import { UserMenu } from '@/features/auth/components/user-menu'

// แถบบนของหน้าแท็บบนมือถือ: ชื่อแอป + บัญชี (ตั้งแต่ medium ซ่อนเอง rail/แถบข้างมีให้แล้ว)
export function HomeAppBar() {
  return <AppBar homeHref="/trips" actions={<UserMenu />} />
}
