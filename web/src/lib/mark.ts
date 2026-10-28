import type { Mark, MarkChange, Status } from '@/types/mark'

export const statusLabel: Record<Status | 'unknown', string> = {
  free: 'ว่าง',
  busy: 'ไม่ว่าง',
  unknown: 'ยังไม่ระบุ',
}

// ใช้ทำ optimistic update: เอา change ไปทับ list เดิม
export function applyChanges(marks: Mark[], changes: MarkChange[]): Mark[] {
  const changed = new Set(changes.map((c) => c.day))
  const kept = marks.filter((m) => !changed.has(m.day))
  const added = changes.filter((c): c is Mark => c.status !== null)
  return [...kept, ...added].sort((a, b) => a.day.localeCompare(b.day))
}
