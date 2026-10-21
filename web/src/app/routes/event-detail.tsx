import { useParams } from 'react-router'
import { SuggestionList } from '@/features/event/components/suggestion-list'

// หน้านี้คือจุดที่ประกอบหลาย feature เข้าด้วยกัน (เหมือน wiring ใน main.go)
// เช่นวันหลังจะวางปฏิทินจาก features/availability ไว้ข้าง SuggestionList ได้ที่นี่
export function EventDetailRoute() {
  const { eventId = '' } = useParams()
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">ช่วงวันที่แนะนำ</h1>
      <SuggestionList eventId={eventId} />
    </section>
  )
}
