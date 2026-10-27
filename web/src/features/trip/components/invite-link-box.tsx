import { useState } from 'react'
import { useReplaceInviteLink } from '../api/manage-trip'

type InviteLinkBoxProps = {
  tripId: string
  code: string
  canReplace: boolean // ผู้จัดสร้างลิงก์ใหม่ได้ (ลิงก์เก่าใช้ไม่ได้ทันที)
}

// ลิงก์เชิญคือกุญแจเข้าทริป — ใครได้ลิงก์ก็เข้าร่วมได้ทันที
export function InviteLinkBox({ tripId, code, canReplace }: InviteLinkBoxProps) {
  const url = `${window.location.origin}/join/${code}`
  const [copied, setCopied] = useState(false)
  const replaceMutation = useReplaceInviteLink(tripId)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
  }

  function replace() {
    if (window.confirm('สร้างลิงก์ใหม่? ลิงก์เดิมจะใช้ไม่ได้ทันที')) {
      replaceMutation.mutate(undefined, { onSuccess: () => setCopied(false) })
    }
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-600">ส่งลิงก์นี้ให้เพื่อนเพื่อชวนเข้าทริป</p>
      <div className="flex gap-2">
        <input readOnly value={url} aria-label="ลิงก์เชิญ" className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm" />
        <button type="button" onClick={copy} className="shrink-0 rounded border border-gray-300 px-3 py-2 text-sm">
          {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>
      {canReplace && (
        <button type="button" disabled={replaceMutation.isPending} onClick={replace} className="text-xs underline">
          สร้างลิงก์ใหม่
        </button>
      )}
    </div>
  )
}
