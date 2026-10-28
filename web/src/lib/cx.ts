// รวม className ที่มีค่า ข้ามตัวที่เป็น false/undefined (ใช้กับ class wg- ที่เปิดปิดตาม prop)
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ')
}
