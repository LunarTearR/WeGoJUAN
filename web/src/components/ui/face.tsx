import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

// อารมณ์ของแบรนด์ ใช้แทน emoji — อย่าเพิ่มอารมณ์ใหม่เองโดยไม่ได้เพิ่มใน docs/design ก่อน
export type Mood = 'free' | 'busy' | 'unknown' | 'party' | 'sleepy'

const FACE_LABEL: Record<Mood, string> = {
  free: 'ว่าง',
  busy: 'ไม่ว่าง',
  unknown: 'ยังไม่ระบุ',
  party: 'เย้',
  sleepy: 'ว่างเปล่า',
}

const blush = (
  <>
    <circle className="wg-face__blush" cx={8.6} cy={19.4} r={1.9} />
    <circle className="wg-face__blush" cx={23.4} cy={19.4} r={1.9} />
  </>
)

// ตา ปาก และของประกอบของแต่ละอารมณ์ (วาดทับวงกลมพื้น) — สีทั้งหมดมาจาก token ใน components.css
function features(mood: Mood): ReactNode {
  switch (mood) {
    case 'busy':
      return (
        <>
          <path className="wg-face__line" d="M9.6 12.4l3.4 2-3.4 2" />
          <path className="wg-face__line" d="M22.4 12.4l-3.4 2 3.4 2" />
          <path className="wg-face__line" d="M10.6 21.6c.9-1 1.8-1 2.7 0s1.8 1 2.7 0 1.8-1 2.7 0 1.8 1 2.7 0" />
          <path className="wg-face__drop" d="M25.6 3.6c1.7 2.3 2.4 3.6 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1 .7-2.3 2.4-4.6z" />
        </>
      )
    case 'unknown':
      return (
        <>
          <circle className="wg-face__dot" cx={12.4} cy={14.4} r={1.7} />
          <circle className="wg-face__dot" cx={20.8} cy={14.4} r={1.7} />
          <path className="wg-face__line" d="M18.4 10.4c1.5-1.2 3.4-1.4 5-.4" />
          <path className="wg-face__line" d="M13 21.6c1.6-.6 3.6-.6 5.6.2" />
        </>
      )
    case 'party':
      return (
        <>
          {blush}
          <path className="wg-face__line" d="M9.4 15l2.4-2.8 2.4 2.8" />
          <path className="wg-face__line" d="M17.8 15l2.4-2.8 2.4 2.8" />
          <path className="wg-face__dot" d="M10.6 18.4h10.8a5.4 5.4 0 0 1-10.8 0z" />
        </>
      )
    case 'sleepy':
      return (
        <>
          {blush}
          <path className="wg-face__line" d="M9.6 15c1.2 1.3 2.8 1.3 4 0" />
          <path className="wg-face__line" d="M18.4 15c1.2 1.3 2.8 1.3 4 0" />
          <circle className="wg-face__line" cx={16} cy={21.4} r={1.5} />
          <path className="wg-face__line" d="M24.2 2.6h3.6l-3.6 3.6h3.6" style={{ strokeWidth: 1.6 }} />
        </>
      )
    case 'free':
      return (
        <>
          {blush}
          <circle className="wg-face__dot" cx={11.6} cy={14} r={1.8} />
          <circle className="wg-face__dot" cx={20.4} cy={14} r={1.8} />
          <path className="wg-face__line" d="M10.8 18.6c1.4 2.6 3.2 3.8 5.2 3.8s3.8-1.2 5.2-3.8" />
        </>
      )
  }
}

type FaceProps = {
  mood?: Mood
  size?: number
  // ไม่ใส่ = ตกแต่ง (มีคำอยู่ข้าง ๆ แล้ว) ซ่อนจาก screen reader · '' = ใช้ชื่อไทยของอารมณ์ · ข้อความ = อ่านตามนั้น
  title?: string
  hop?: boolean // กระโดดหนึ่งครั้งตอนแสดง ใช้ตอนยืนยันวันแล้ว
  className?: string
}

// หน้าเดียวต่อการ์ด แบนเนอร์ หรือหัว sheet
export function Face({ mood = 'free', size = 32, title, hop, className }: FaceProps) {
  const label = title === undefined ? undefined : title || FACE_LABEL[mood]
  return (
    <svg
      className={cx('wg-face', `wg-face--${mood}`, hop && 'wg-face--hop', className)}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      focusable="false"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle className="wg-face__bg" cx={16} cy={16.5} r={13} />
      {features(mood)}
    </svg>
  )
}
