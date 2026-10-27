import { useSuggestions } from '../api/get-suggestions'
import type { Member } from '../types'

const TOP = 5

export function SuggestionList({ tripId, members }: { tripId: string; members: Member[] }) {
  const { data: suggestions, isPending, error } = useSuggestions(tripId)

  if (isPending) {
    return <p className="text-gray-500">กำลังหาช่วงวันที่ลงตัว…</p>
  }
  if (error) {
    return <p className="text-red-700">หาช่วงวันไม่สำเร็จ: {error.message}</p>
  }
  if (suggestions.length === 0) {
    return <p>ยังไม่มีช่วงวันที่เหมาะ — ชวนสมาชิกระบุวันเพิ่ม</p>
  }

  const nameOf = new Map(members.map((m) => [m.id, m.display_name]))
  const names = (ids: string[]) => ids.map((id) => nameOf.get(id) ?? '?').join(', ')

  return (
    <ol className="space-y-2">
      {suggestions.slice(0, TOP).map((s) => (
        <li key={s.start} aria-label={`ช่วง ${s.start} ถึง ${s.end}`} className="rounded border border-gray-200 p-3">
          <p className="font-medium">
            {s.start} ถึง {s.end}
          </p>
          <p className="text-sm">
            ว่าง {s.available.length} · ติด {s.busy.length} · ยังไม่ระบุ {s.unknown.length}
          </p>
          {s.busy.length > 0 && <p className="text-sm text-red-700">ติด: {names(s.busy)}</p>}
          {s.unknown.length > 0 && <p className="text-sm text-gray-600">ยังไม่ระบุ: {names(s.unknown)}</p>}
        </li>
      ))}
    </ol>
  )
}
