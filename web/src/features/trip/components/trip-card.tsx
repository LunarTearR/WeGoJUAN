import { Link } from 'react-router'
import { Face } from '@/components/ui/face'
import { Icon } from '@/components/ui/icon'
import { Pill } from '@/components/ui/pill'

type TripCardProps = {
  title: string
  rangeLabel: string // Date Range เช่น "1–20 ธ.ค."
  durationDays: number
  confirmedLabel?: string // มีเฉพาะตอนยืนยันแล้ว
  href: string
}

// ทริปหนึ่งใบใน "ทริปของฉัน": หน้าบอกสถานะ (party = ยืนยันแล้ว, unknown = กำลังหาวัน) และป้ายบอกซ้ำเป็นคำ
// ทั้งการ์ดเป็นปุ่มเดียว ชื่อยาวตัดบรรทัดเดียว
export function TripCard({ title, rangeLabel, durationDays, confirmedLabel, href }: TripCardProps) {
  return (
    <Link to={href} className="wg-card wg-trip">
      <Face mood={confirmedLabel ? 'party' : 'unknown'} size={44} />
      <span className="wg-trip__body">
        <span className="wg-trip__title heading block">{title}</span>
        <span className="wg-trip__meta small block">
          เลือกได้ {rangeLabel} · ไป {durationDays} วัน
        </span>
        <span className="wg-trip__foot">
          {confirmedLabel ? (
            <Pill tone="solid" icon="flag">
              ยืนยันแล้ว · {confirmedLabel}
            </Pill>
          ) : (
            <Pill tone="neutral">กำลังหาวัน</Pill>
          )}
        </span>
      </span>
      <Icon name="chevron-right" size={20} className="wg-trip__chev" />
    </Link>
  )
}
