import { useAnswerConfirmedOffer } from '../api/answer-confirmed-offer'
import type { Trip } from '../types'

// ปฏิทินส่วนตัวเป็นของ User — ระบบแค่ถาม ไม่เขียนเองถ้าไม่ยินยอม
export function ConfirmedOfferBanner({ trip, onAccepted }: { trip: Trip; onAccepted: () => void }) {
  const answerMutation = useAnswerConfirmedOffer(trip.id)

  return (
    <div className="space-y-2 rounded border border-blue-300 bg-blue-50 p-3 text-sm">
      <p>
        ทริปนี้ยืนยันวันแล้ว ({trip.confirmed_start} ถึง {trip.confirmed_end}) — ทำเครื่องหมายไม่ว่างในปฏิทินของฉันไหม?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={answerMutation.isPending}
          onClick={() => answerMutation.mutate(true, { onSuccess: onAccepted })}
          className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50"
        >
          ใช่
        </button>
        <button
          type="button"
          disabled={answerMutation.isPending}
          onClick={() => answerMutation.mutate(false)}
          className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
        >
          ไม่
        </button>
      </div>
      {answerMutation.error && <p className="text-red-700">บันทึกไม่สำเร็จ: {answerMutation.error.message}</p>}
    </div>
  )
}
