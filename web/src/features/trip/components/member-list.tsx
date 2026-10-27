import type { Member } from '../types'

export function MemberList({ members }: { members: Member[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {members.map((m) => (
        <li key={m.id} className="rounded-full border border-gray-300 px-3 py-1 text-sm">
          {m.display_name}
          {m.is_organizer && <span className="ml-1 text-xs text-gray-500">(ผู้จัด)</span>}
          {m.is_guest && <span className="ml-1 rounded bg-gray-100 px-1 text-xs text-gray-600">แขก</span>}
        </li>
      ))}
    </ul>
  )
}
