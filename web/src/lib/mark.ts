import type { Mark, MarkChange, Status } from '@/types/mark'

// กดวันเดิมซ้ำ: ยังไม่ระบุ → ว่าง → ไม่ว่าง → ยังไม่ระบุ
export function nextStatus(s: Status | null): Status | null {
  if (s === null) return 'free'
  if (s === 'free') return 'busy'
  return null
}

export const statusLabel: Record<Status | 'unknown', string> = {
  free: 'ว่าง',
  busy: 'ไม่ว่าง',
  unknown: 'ยังไม่ระบุ',
}

// สีของช่องวันที่ ใช้เหมือนกันทั้งปฏิทินส่วนตัวและตารางในทริป
export function statusClass(s: Status | null): string {
  if (s === 'free') return 'bg-green-500 text-white border-green-500'
  if (s === 'busy') return 'bg-red-500 text-white border-red-500'
  return 'bg-white text-gray-700 border-gray-300'
}

// ใช้ทำ optimistic update: เอา change ไปทับ list เดิม
export function applyChanges(marks: Mark[], changes: MarkChange[]): Mark[] {
  const changed = new Set(changes.map((c) => c.day))
  const kept = marks.filter((m) => !changed.has(m.day))
  const added = changes.filter((c): c is Mark => c.status !== null)
  return [...kept, ...added].sort((a, b) => a.day.localeCompare(b.day))
}
