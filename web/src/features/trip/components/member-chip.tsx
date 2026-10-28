import { IconButton } from '@/components/ui/icon-button'
import { Initials } from '@/components/ui/initials'
import { Pill } from '@/components/ui/pill'
import { cx } from '@/lib/cx'

type MemberChipProps = {
  name: string
  isOrganizer: boolean
  isGuest: boolean
  isMe: boolean // ขอบส้ม + "(คุณ)"
  onRemove?: () => void // ผู้จัดเท่านั้น และไม่ใช่ตัวเอง — ต้องยืนยันใน Sheet ก่อน
  removing?: boolean
}

// สมาชิกหนึ่งคน: รูปย่อชื่อ ชื่อ ป้ายบทบาท และปุ่มนำออกของผู้จัด
export function MemberChip({ name, isOrganizer, isGuest, isMe, onRemove, removing }: MemberChipProps) {
  return (
    <span className={cx('wg-member', isMe && 'wg-member--me')}>
      <Initials name={name} size="md" decorative />
      <span className="wg-member__name small font-medium">
        {name}
        {isMe && <span className="wg-member__me"> (คุณ)</span>}
      </span>
      {isOrganizer && (
        <Pill tone="solid" icon="flag">
          ผู้จัด
        </Pill>
      )}
      {isGuest && <Pill tone="neutral">แขก</Pill>}
      {onRemove && <IconButton icon="close" plain size="sm" label={`นำ ${name} ออก`} onClick={onRemove} disabled={removing} />}
    </span>
  )
}
