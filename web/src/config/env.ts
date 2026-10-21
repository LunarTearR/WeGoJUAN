// อ่านค่า env ของ Vite (ต้องขึ้นต้นด้วย VITE_) มาเป็น config ที่มี type
export const env = {
  // ว่าง = เรียก path เดียวกับเว็บ ซึ่งตอน dev จะผ่าน Vite proxy ไปที่ Go
  // production ที่ API อยู่คนละ domain ให้ตั้ง VITE_API_BASE_URL=https://api.example.com
  apiBaseUrl: String(import.meta.env.VITE_API_BASE_URL ?? ''),
}
