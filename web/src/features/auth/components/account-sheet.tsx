import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { useMe } from '../api/get-me'
import { useLogout } from '../api/logout'

type AccountSheetProps = {
  open: boolean
  onClose: () => void
}

// แผ่นบัญชี: ชื่อ อีเมล และออกจากระบบ — เปิดจากรูปย่อชื่อใน AppBar (มือถือ) หรือใน rail/แถบข้าง
// ออกแล้ว me เป็น null: แผ่นหายเอง และหน้าที่ต้อง login จะพาไปหน้า login (RequireUser)
export function AccountSheet({ open, onClose }: AccountSheetProps) {
  const { data: me } = useMe()
  const logoutMutation = useLogout()

  if (!me) {
    return null
  }
  return (
    <Sheet
      open={open}
      title={me.display_name}
      onClose={onClose}
      footer={
        <Button variant="secondary" icon="exit" loading={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
          ออกจากระบบ
        </Button>
      }
    >
      <p className="small wg-muted">{me.email}</p>
      {logoutMutation.error && <p className="small text-danger">ออกจากระบบไม่สำเร็จ: {logoutMutation.error.message}</p>}
    </Sheet>
  )
}
