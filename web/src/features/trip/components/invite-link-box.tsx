import { useState } from 'react'

// ลิงก์เชิญคือกุญแจเข้าทริป — ใครได้ลิงก์ก็เข้าร่วมได้ทันที
export function InviteLinkBox({ code }: { code: string }) {
  const url = `${window.location.origin}/join/${code}`
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
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
    </div>
  )
}
