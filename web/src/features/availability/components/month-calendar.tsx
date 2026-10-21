import { useMyMarks } from '../api/get-my-marks'
import { monthRange } from '../utils/month-range'

type MonthCalendarProps = {
  year: number
  month: number // 1-12
}

export function MonthCalendar({ year, month }: MonthCalendarProps) {
  const { from, to } = monthRange(year, month)
  const { data: marks, isPending, error } = useMyMarks(from, to)

  if (isPending) {
    return <p className="text-gray-500">กำลังโหลดวันว่าง…</p>
  }
  if (error) {
    return <p className="text-red-700">โหลดวันว่างไม่สำเร็จ: {error.message}</p>
  }

  // TODO: ตารางปฏิทินรายเดือนให้กดเลือกสถานะของแต่ละวัน
  return (
    <p>
      ระบุแล้ว {marks.length} วัน ในช่วง {from} ถึง {to}
    </p>
  )
}
