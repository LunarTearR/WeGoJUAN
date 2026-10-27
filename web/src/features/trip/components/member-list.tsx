import { useRemoveMember } from '../api/manage-trip'
import type { Member } from '../types'

type MemberListProps = {
  tripId: string
  members: Member[]
  me: Member
}

export function MemberList({ tripId, members, me }: MemberListProps) {
  const removeMutation = useRemoveMember(tripId)

  function remove(m: Member) {
    if (window.confirm(`นำ ${m.display_name} ออกจากทริป? วันว่างที่เขาระบุในทริปนี้จะหายไปด้วย`)) {
      removeMutation.mutate(m.id)
    }
  }

  return (
    <div className="space-y-1">
      <ul className="flex flex-wrap gap-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1 text-sm">
            {m.display_name}
            {m.is_organizer && <span className="text-xs text-gray-500">(ผู้จัด)</span>}
            {m.is_guest && <span className="rounded bg-gray-100 px-1 text-xs text-gray-600">แขก</span>}
            {me.is_organizer && m.id !== me.id && (
              <button
                type="button"
                aria-label={`นำ ${m.display_name} ออก`}
                disabled={removeMutation.isPending}
                onClick={() => remove(m)}
                className="ml-1 text-xs text-red-700 underline"
              >
                นำออก
              </button>
            )}
          </li>
        ))}
      </ul>
      {removeMutation.error && <p className="text-sm text-red-700">นำออกไม่สำเร็จ: {removeMutation.error.message}</p>}
    </div>
  )
}
