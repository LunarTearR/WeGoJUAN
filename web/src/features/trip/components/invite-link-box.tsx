import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmSheet } from '@/components/ui/confirm-sheet'
import { Icon } from '@/components/ui/icon'
import { useReplaceInviteLink } from '../api/manage-trip'

type InviteLinkBoxProps = {
  tripId: string
  code: string
  canReplace: boolean // ผู้จัดสร้างลิงก์ใหม่ได้ (ลิงก์เก่าใช้ไม่ได้ทันที)
}

// ลิงก์เชิญคือกุญแจเข้าทริป — ใครได้ลิงก์ก็เข้าร่วมได้ทันที
// id="invite": ปุ่ม "ชวนเพื่อนมาระบุวัน" ในช่วงที่แนะนำเลื่อนมาที่นี่
export function InviteLinkBox({ tripId, code, canReplace }: InviteLinkBoxProps) {
  const url = `${window.location.origin}/join/${code}`
  const [copied, setCopied] = useState(false)
  const [confirmingReplace, setConfirmingReplace] = useState(false)
  const replaceMutation = useReplaceInviteLink(tripId)
  // มือถือส่วนใหญ่แชร์เข้าแอปแชตได้ตรง ๆ — เครื่องที่ไม่มีก็ไม่โชว์ปุ่ม
  const canShare = typeof navigator.share === 'function'

  // "คัดลอกแล้ว!" ค้างไว้ราว 2.4 วินาทีแล้วกลับเป็นปุ่มคัดลอก
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2400)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
  }

  function cancelReplace() {
    replaceMutation.reset()
    setConfirmingReplace(false)
  }

  return (
    <section id="invite" className="wg-card wg-invite" aria-label="ลิงก์เชิญ">
      <div className="wg-invite__head">
        <span className="wg-invite__icon">
          <Icon name="users" size={22} />
        </span>
        <div>
          <h3 className="wg-invite__title heading">ชวนเพื่อนเข้าทริป</h3>
          <p className="wg-invite__hint small">ใครได้ลิงก์นี้ก็เข้าทริปได้ทันที</p>
        </div>
      </div>
      <div className="wg-invite__row">
        <input className="wg-field__input small" readOnly value={url} aria-label="ลิงก์เชิญ" onFocus={(e) => e.target.select()} />
        <Button size="sm" icon={copied ? 'check' : 'copy'} done={copied} onClick={copy} aria-live="polite">
          {copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
        </Button>
      </div>
      {(canShare || canReplace) && (
        <div className="wg-invite__more">
          {canShare && (
            <Button variant="ghost" size="sm" icon="share" onClick={() => navigator.share({ url }).catch(() => undefined)}>
              แชร์เข้ากลุ่มแชต
            </Button>
          )}
          {canReplace && (
            <Button variant="ghost" size="sm" icon="refresh" onClick={() => setConfirmingReplace(true)}>
              สร้างลิงก์ใหม่
            </Button>
          )}
        </div>
      )}
      <ConfirmSheet
        open={confirmingReplace}
        title="สร้างลิงก์ใหม่?"
        confirmLabel="สร้างลิงก์ใหม่"
        pending={replaceMutation.isPending}
        error={replaceMutation.error && `สร้างลิงก์ใหม่ไม่สำเร็จ: ${replaceMutation.error.message}`}
        onConfirm={() =>
          replaceMutation.mutate(undefined, {
            onSuccess: () => {
              setCopied(false)
              setConfirmingReplace(false)
            },
          })
        }
        onCancel={cancelReplace}
      >
        ลิงก์เดิมจะใช้ไม่ได้ทันที
      </ConfirmSheet>
    </section>
  )
}
