import type { ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router'
import { cx } from '@/lib/cx'
import { Icon, type IconName } from './icon'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'sm' // md = 48px, sm = 36px
  block?: boolean // เต็มความกว้าง: ปุ่มหลักใน sticky footer บนมือถือ
  icon?: IconName
  iconEnd?: IconName
  loading?: boolean // จุดเด้งแทนข้อความ
  done?: boolean // สีเขียวอมฟ้าพร้อม pop เช่น "คัดลอกแล้ว!"
  href?: string // ลิงก์ในแอป: ใช้ Link ของ router จะได้ไม่โหลดหน้าใหม่
}

// primary มีขอบล่างแบบลูกกวาด หน้าละอันเดียว · secondary ที่เหลือทั้งหมด · ghost ลิงก์ในบรรทัด · danger ลบ/ออก (ไว้ล่างสุดหรือใน Sheet ยืนยัน)
export function Button({
  variant = 'primary',
  size = 'md',
  block,
  icon,
  iconEnd,
  loading,
  done,
  href,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  const iconSize = size === 'sm' ? 18 : 20
  const classes = cx(
    'wg-btn',
    `wg-btn--${variant}`,
    size === 'sm' && 'wg-btn--sm',
    block && 'wg-btn--block',
    done && 'wg-btn--done',
    size === 'sm' ? 'small' : 'body-strong',
    className,
  )
  const content = loading ? (
    <span className="wg-btn__dots" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  ) : (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      {children != null && <span>{children}</span>}
      {iconEnd && <Icon name={iconEnd} size={iconSize} />}
    </>
  )

  if (href) {
    return (
      <Link to={href} className={classes}>
        {content}
      </Link>
    )
  }
  return (
    // ตอน loading ข้อความหายไป จึงย้ายข้อความปุ่มไปไว้ที่ aria-label (ส่ง aria-label มาเองก็ทับได้)
    <button
      type={type}
      className={classes}
      aria-busy={loading || undefined}
      aria-label={loading && typeof children === 'string' ? children : undefined}
      {...props}
    >
      {content}
    </button>
  )
}
