import { useContext, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ShellRootContext, useLayout } from '@/components/layout/layout-context'
import { cx } from '@/lib/cx'
import { Face, type Mood } from './face'
import { IconButton } from './icon-button'

type SheetProps = {
  open: boolean
  title: string
  onClose?: () => void
  children?: ReactNode
  footer?: ReactNode // ปุ่มเรียงเต็มแถวเท่า ๆ กัน
  face?: Mood // ห้ามใส่ในแผ่นยืนยันการลบ/ออก
  // center = ยืนยัน: แผ่นล่างบนมือถือ กล่องกลางจอตั้งแต่แท็บเล็ต
  // side = วันในปฏิทิน: แผ่นล่างบนมือถือ แผงลอยบนแท็บเล็ต ลิ้นชักขวาบน PC (ไม่บังหน้า) จอขวาตอน split
  placement?: 'center' | 'side'
  className?: string
}

// ปิดได้ทั้งแตะฉากมืด ปุ่มปิด และ Esc
export function Sheet({ open, title, onClose, children, footer, face, placement = 'center', className }: SheetProps) {
  const layout = useLayout()
  const shellRoot = useContext(ShellRootContext)

  useEffect(() => {
    if (!open || !onClose) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  // แผงวันเปิดค้างข้างปฏิทินบน PC และบนจอขวาของอุปกรณ์สองจอ — ไม่บังหน้า จึงไม่มีฉากมืด
  const docked = placement === 'side' && (layout === 'expanded' || layout === 'split')
  const sheet = (
    <>
      {!docked && <div className={cx('wg-sheet-scrim', `wg-sheet-scrim--${placement}`)} onClick={onClose} />}
      <div
        className={cx('wg-sheet', `wg-sheet--${placement}`, docked && 'wg-sheet--docked', className)}
        role="dialog"
        aria-modal={!docked}
        aria-label={title}
      >
        <div className="wg-sheet__handle" aria-hidden />
        <div className="wg-sheet__head">
          {face && <Face mood={face} size={32} />}
          <h2 className="wg-sheet__title title">{title}</h2>
          {onClose && <IconButton icon="close" plain label="ปิด" onClick={onClose} />}
        </div>
        <div className="wg-sheet__body">{children}</div>
        {footer && <div className="wg-sheet__foot">{footer}</div>}
      </div>
    </>
  )
  // วาดลงกล่องนอกสุดของ AppShell: ยังอยู่ใน shell จึงได้ layout และ container query ครบ
  // แต่ไม่ติดอยู่ใต้ AppBar (sticky, z-index ของตัวเอง) ที่เปิดมัน ซึ่งจะทำให้ BottomNav ลอยทับแผ่น
  return shellRoot ? createPortal(sheet, shellRoot) : sheet
}
