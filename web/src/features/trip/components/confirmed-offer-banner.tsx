import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-client'
import { formatDayRange } from '@/lib/date'
import { useAnswerConfirmedOffer } from '../api/answer-confirmed-offer'
import type { Trip } from '../types'

// ปฏิทินส่วนตัวเป็นของ User — ระบบแค่ถาม ไม่เขียนเองถ้าไม่ยินยอม
export function ConfirmedOfferBanner({ trip, onAccepted }: { trip: Trip; onAccepted: () => void }) {
  const answerMutation = useAnswerConfirmedOffer(trip.id)
  const start = trip.confirmed_start ?? ''
  const end = trip.confirmed_end ?? start
  // 409 = ผู้จัดเพิ่งเปลี่ยนวันที่ยืนยัน → ทริปโหลดใหม่แล้ว ให้ดูวันใหม่แล้วตอบอีกครั้ง
  const changed = answerMutation.error instanceof ApiError && answerMutation.error.status === 409

  return (
    <Banner
      tone="info"
      icon={changed ? 'finding' : undefined}
      title="กันวันไว้ในปฏิทินของฉันไหม?"
      actions={
        <>
          <Button size="sm" loading={answerMutation.isPending} onClick={() => answerMutation.mutate({ accept: true, start }, { onSuccess: onAccepted })}>
            กันวันไว้เลย
          </Button>
          <Button variant="secondary" size="sm" disabled={answerMutation.isPending} onClick={() => answerMutation.mutate({ accept: false, start })}>
            ไม่ต้อง
          </Button>
        </>
      }
    >
      {changed ? (
        'วันที่ยืนยันเพิ่งเปลี่ยน ดูวันใหม่แล้วตอบอีกครั้งนะ'
      ) : (
        <>
          จะทำเครื่องหมายไม่ว่าง {formatDayRange(start, end)} จะได้ไม่ซ้อนกับนัดอื่น
          {answerMutation.error && <span className="block text-danger">อุ๊ย บันทึกไม่สำเร็จ: {answerMutation.error.message}</span>}
        </>
      )}
    </Banner>
  )
}
