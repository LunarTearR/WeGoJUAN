package trip

import "time"

// ผู้ใช้ทั้งหมดอยู่ไทย (UTC+7 ไม่มี DST) — "วันนี้" ของระบบคือวันที่ในไทย
var thailand = time.FixedZone("ICT", 7*60*60)

// Today คืนวันที่ปัจจุบันในไทย เป็นเที่ยงคืน UTC (รูปแบบเดียวกับวันที่ที่ parse จาก "YYYY-MM-DD")
func Today(now time.Time) time.Time {
	t := now.In(thailand)
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

// rangeDays นับจำนวนวันใน [from, to] แบบรวมหัวท้าย
func rangeDays(from, to time.Time) int {
	return int(to.Sub(from).Hours()/24) + 1
}
