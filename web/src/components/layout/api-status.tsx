import { useQuery } from '@tanstack/react-query'
import { env } from '@/config/env'

// ตัวช่วยตอน dev: บอกว่าเว็บคุยกับ Go API ได้หรือยัง (ลบทิ้งได้เมื่อไม่ต้องใช้)
export function ApiStatus() {
  const { data: online, isPending } = useQuery({
    queryKey: ['healthz'],
    queryFn: async () => (await fetch(`${env.apiBaseUrl}/healthz`)).ok,
    refetchInterval: 30_000,
  })

  if (isPending) {
    return <span className="text-sm text-gray-500">กำลังเช็ค API…</span>
  }
  return (
    <span className={`text-sm ${online ? 'text-green-700' : 'text-red-700'}`}>
      {online ? 'API เชื่อมต่อแล้ว' : 'เชื่อมต่อ API ไม่ได้'}
    </span>
  )
}
