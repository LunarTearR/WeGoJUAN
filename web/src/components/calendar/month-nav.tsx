type MonthNavProps = {
  year: number
  month: number // 1-12
  onPrev?: () => void // ไม่ส่ง = ปุ่มกดไม่ได้ (เช่นสุดช่วงวันของทริป)
  onNext?: () => void
}

export function MonthNav({ year, month, onPrev, onNext }: MonthNavProps) {
  const title = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
  const btn = 'rounded border border-gray-300 px-3 py-1 disabled:opacity-30'
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={onPrev} disabled={!onPrev} className={btn} aria-label="เดือนก่อนหน้า">
        ‹
      </button>
      <h2 className="font-medium">{title}</h2>
      <button type="button" onClick={onNext} disabled={!onNext} className={btn} aria-label="เดือนถัดไป">
        ›
      </button>
    </div>
  )
}
