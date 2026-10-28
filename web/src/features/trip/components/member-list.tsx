import { useState } from 'react'
import { ConfirmSheet } from '@/components/ui/confirm-sheet'
import { useRemoveMember } from '../api/manage-trip'
import type { Member } from '../types'
import { MemberChip } from './member-chip'

type MemberListProps = {
  tripId: string
  members: Member[]
  me: Member
}

export function MemberList({ tripId, members, me }: MemberListProps) {
  const removeMutation = useRemoveMember(tripId)
  // คนที่กำลังจะนำออก (รอยืนยันใน Sheet)
  const [removing, setRemoving] = useState<Member | null>(null)

  function cancel() {
    removeMutation.reset()
    setRemoving(null)
  }

  return (
    <section aria-labelledby="members-title">
      <div className="wg-section-head">
        <h2 id="members-title" className="heading">
          สมาชิก
        </h2>
        <span className="small wg-muted">{members.length} คน</span>
      </div>
      <ul className="wg-members">
        {members.map((m) => (
          <li key={m.id}>
            <MemberChip
              name={m.display_name}
              isOrganizer={m.is_organizer}
              isGuest={m.is_guest}
              isMe={m.id === me.id}
              onRemove={me.is_organizer && m.id !== me.id ? () => setRemoving(m) : undefined}
              removing={removeMutation.isPending && removeMutation.variables === m.id}
            />
          </li>
        ))}
      </ul>
      {removing && (
        <ConfirmSheet
          open
          title={`นำ ${removing.display_name} ออกจากทริป?`}
          confirmLabel="นำออก"
          danger
          pending={removeMutation.isPending}
          error={removeMutation.error && `นำออกไม่สำเร็จ: ${removeMutation.error.message}`}
          onConfirm={() => removeMutation.mutate(removing.id, { onSuccess: () => setRemoving(null) })}
          onCancel={cancel}
        >
          วันว่างที่เขาระบุในทริปนี้จะหายไปด้วย
        </ConfirmSheet>
      )}
    </section>
  )
}
