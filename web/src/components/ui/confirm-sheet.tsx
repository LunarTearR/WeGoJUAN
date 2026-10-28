import type { ReactNode } from 'react'
import { Banner } from './banner'
import { Button } from './button'
import { Sheet } from './sheet'

type ConfirmSheetProps = {
  open: boolean
  title: string // คำถามตรง ๆ เช่น ลบทริป "…"?
  children: ReactNode // หนึ่งประโยคว่าอะไรจะหายไป
  confirmLabel: string
  danger?: boolean // ลบ/ออก/นำออก
  pending?: boolean
  error?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

// ใช้แทน window.confirm: แผ่นล่างบนมือถือ กล่องกลางจอตั้งแต่แท็บเล็ต — ไม่มีไอคอนสถานะ ไม่มีมุก
export function ConfirmSheet({ open, title, children, confirmLabel, danger, pending, error, onConfirm, onCancel }: ConfirmSheetProps) {
  return (
    <Sheet
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="wg-stack">
        <p className="body">{children}</p>
        {error && <Banner tone="danger">{error}</Banner>}
      </div>
    </Sheet>
  )
}
