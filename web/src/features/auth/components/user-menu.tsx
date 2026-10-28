import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Initials } from '@/components/ui/initials'
import { useMe } from '../api/get-me'
import { AccountSheet } from './account-sheet'

// มุมขวาของ AppBar: รูปย่อชื่อ (กดแล้วเปิดแผ่นบัญชี) หรือปุ่มเข้าสู่ระบบ
export function UserMenu() {
  const { data: me } = useMe()
  const [open, setOpen] = useState(false)

  if (me === undefined) {
    return null
  }
  if (me === null) {
    return (
      <Button variant="ghost" size="sm" href="/login">
        เข้าสู่ระบบ
      </Button>
    )
  }
  return (
    <>
      <button type="button" className="wg-iconbtn wg-iconbtn--plain" aria-label={`บัญชีของฉัน (${me.display_name})`} onClick={() => setOpen(true)}>
        <Initials name={me.display_name} size="md" decorative />
      </button>
      <AccountSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
