import { createContext, useContext } from 'react'

// วัดจากความกว้างของ AppShell เอง ไม่ใช่ชื่ออุปกรณ์: เบราว์เซอร์แบ่งครึ่งจอบน PC ก็ได้ layout แท็บเล็ต
// compact < 600 (มือถือ) · medium 600–1023 (แท็บเล็ตแนวตั้ง) · expanded ≥ 1024 (แท็บเล็ตแนวนอน, PC) · split = กางสองจอ (Surface Duo)
export type Layout = 'compact' | 'medium' | 'expanded' | 'split'

// ต้องตรงกับ token bp-medium / bp-expanded และ @container app ใน components.css (query ใน CSS อ่าน var() ไม่ได้)
const BP_MEDIUM = 600
const BP_EXPANDED = 1024

export function layoutFor(width: number, split: boolean): Layout {
  if (split) return 'split'
  if (width >= BP_EXPANDED) return 'expanded'
  if (width >= BP_MEDIUM) return 'medium'
  return 'compact'
}

export const LayoutContext = createContext<Layout>('compact')

// กล่องนอกสุดของ AppShell — Sheet วาดลงที่นี่ (ดู sheet.tsx)
export const ShellRootContext = createContext<HTMLElement | null>(null)

// layout จาก AppShell ที่ใกล้ที่สุด ('compact' ถ้าอยู่นอก shell)
// ใช้กับสิ่งที่ CSS ตัดสินแทนไม่ได้ เช่นจะวางช่วงวันที่แนะนำตรงไหน หรือป้ายเพื่อนใส่ได้กี่อัน
export function useLayout(): Layout {
  return useContext(LayoutContext)
}
