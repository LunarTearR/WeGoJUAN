import { useSuggestions } from '../api/get-suggestions'

export function SuggestionList({ eventId }: { eventId: string }) {
  const { data: suggestions, isPending, error } = useSuggestions(eventId)

  if (isPending) {
    return <p className="text-gray-500">กำลังหาช่วงวันที่ลงตัว…</p>
  }
  if (error) {
    return <p className="text-red-700">หาช่วงวันไม่สำเร็จ: {error.message}</p>
  }
  if (suggestions.length === 0) {
    return <p>ยังไม่มีช่วงวันที่ลงตัว ลองชวนสมาชิกให้ระบุวันว่างเพิ่ม</p>
  }

  return (
    <ul className="space-y-2">
      {suggestions.map((s) => (
        <li key={s.start} className="rounded border border-gray-200 p-3">
          {s.start} ถึง {s.end} ว่าง {s.available.length} คน ติด {s.busy.length} คน
        </li>
      ))}
    </ul>
  )
}
