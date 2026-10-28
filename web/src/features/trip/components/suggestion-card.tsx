import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { StatusIcon } from '@/components/ui/status-icon'
import { cx } from '@/lib/cx'
import { statusLabel } from '@/lib/mark'

type SuggestionCardProps = {
  rank: number // เริ่มที่ 1 — อันดับ 1 คือการ์ด "ลงตัวที่สุด"
  rangeLabel: string
  durationDays: number
  available: string[] // ชื่อสมาชิก: สามกลุ่มรวมกันคือทุกคนครั้งเดียว
  busy: string[]
  unknown: string[]
  canConfirm: boolean // ผู้จัดเลือกช่วงนี้ได้
  onConfirm: () => void
  confirming: boolean
  isConfirmed: boolean
}

// หนึ่งช่วงที่แนะนำ: อันดับ วันที่ ไอคอนสถานะของสมาชิกทุกคน และปุ่มเลือกของผู้จัด
// อันดับ 1 ขอบส้ม + ปุ่ม primary ที่เหลือเงียบกว่าด้วยปุ่ม secondary
export function SuggestionCard(props: SuggestionCardProps) {
  const { rank, rangeLabel, durationDays, available, busy, unknown } = props
  const best = rank === 1
  const total = available.length + busy.length + unknown.length
  const faces: { name: string; status: 'free' | 'busy' | 'unknown' }[] = [
    ...available.map((name) => ({ name, status: 'free' as const })),
    ...busy.map((name) => ({ name, status: 'busy' as const })),
    ...unknown.map((name) => ({ name, status: 'unknown' as const })),
  ]

  return (
    <article className={cx('wg-card', 'wg-sugg', best && 'wg-sugg--best')} aria-label={`ช่วง ${rangeLabel}`}>
      <div className="wg-sugg__head">
        <div>
          {best ? (
            <Pill tone="solid" icon="sparkle">
              ลงตัวที่สุด
            </Pill>
          ) : (
            <span className="wg-sugg__rank caption font-semibold">อันดับ {rank}</span>
          )}
          <p className="wg-sugg__range heading">{rangeLabel}</p>
          <span className="small wg-muted">{durationDays} วัน</span>
        </div>
        <div className="wg-sugg__stat">
          <span className="stat">
            {available.length}/{total}
          </span>
          <small className="caption">ว่าง</small>
        </div>
      </div>
      <div className="wg-sugg__faces" role="list">
        {faces.map((f) => {
          const label = `${f.name} ${statusLabel[f.status]}`
          return (
            <span key={`${f.status}${f.name}`} role="listitem" title={label}>
              <StatusIcon kind={f.status} size={28} title={label} />
            </span>
          )
        })}
      </div>
      {busy.length === 0 && unknown.length === 0 ? (
        <p className="wg-sugg__line wg-sugg__line--all body-strong">ว่างครบทุกคน! ไปกันเลย</p>
      ) : (
        <div className="wg-sugg__people">
          <p className="wg-sugg__counts small">
            <b className="is-free">ว่าง {available.length}</b> · <b className="is-busy">ติด {busy.length}</b> · ยังไม่ระบุ {unknown.length}
          </p>
          {busy.length > 0 && <p className="wg-sugg__line wg-sugg__line--busy small">ติด: {busy.join(', ')}</p>}
          {unknown.length > 0 && <p className="wg-sugg__line wg-sugg__line--unknown small">ยังไม่ระบุ: {unknown.join(', ')}</p>}
        </div>
      )}
      {props.isConfirmed ? (
        <div className="wg-sugg__actions">
          <Pill tone="solid" icon="flag">
            ยืนยันแล้ว
          </Pill>
        </div>
      ) : (
        props.canConfirm && (
          <div className="wg-sugg__actions">
            <Button variant={best ? 'primary' : 'secondary'} size="sm" icon="flag" onClick={props.onConfirm} loading={props.confirming}>
              เลือกช่วงนี้
            </Button>
          </div>
        )
      )}
    </article>
  )
}
