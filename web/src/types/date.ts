// วันที่แบบไม่มีเวลา รูปแบบ "YYYY-MM-DD" ตรงกับ type date ใน Postgres
// ส่งเป็น string ตลอดทาง อย่าแปลงเป็น Date ด้วย new Date("2026-12-05")
// เพราะจะถูกตีความเป็นเที่ยงคืน UTC และเลื่อนเป็นวันก่อนหน้าใน timezone ที่ติดลบ
export type ISODate = string
