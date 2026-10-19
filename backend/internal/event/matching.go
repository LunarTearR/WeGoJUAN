package event

import (
	"time"

	"WeGoJUAN-backend/internal/availability"
)

// SuggestWindows หาช่วงวันติดกันยาว duration วัน ภายใน [from, to] แล้วจัดอันดับ
// marks: userID → วันที่ mark ไว้ (วันที่ไม่มีใน slice = ยังไม่ระบุ)
//
// เป็น pure function: ไม่แตะ DB/HTTP → เขียน table-driven test ได้เต็มที่
func SuggestWindows(memberIDs []string, marks map[string][]availability.Mark, from, to time.Time, duration int) []Window {
	// TODO:
	// 1. เลื่อน window ยาว duration วัน ทีละ 1 วัน ตั้งแต่ from ถึง to
	// 2. ในแต่ละ window จัดสมาชิกแต่ละคนเป็น Available / Busy / Unknown
	// 3. เรียง: Available มากสุดก่อน → Busy น้อยสุด → Unknown น้อยสุด
	return nil
}
