const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' })

// ป้ายชื่อย่อ 2 ตัวอักษรในช่องปฏิทิน: "ploy" → "Pl", "ปลาย" → "ปล"
// นับเป็นตัวอักษรที่มองเห็น (สระ/วรรณยุกต์ติดไปกับพยัญชนะ) เพื่อไม่ให้ตัดสระไทยครึ่งตัว
export function initials(name: string): string {
  const two = Array.from(graphemes.segment(name.trim()), (s) => s.segment)
    .slice(0, 2)
    .join('')
  return two.charAt(0).toUpperCase() + two.slice(1)
}
