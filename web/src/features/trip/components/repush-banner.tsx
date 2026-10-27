// ช่วงวันของทริปได้วันเพิ่มหลังจาก Push ครั้งล่าสุด — วันใหม่ยังไม่มี Mark จากปฏิทินของฉัน
export function RepushBanner({ onOpenPush }: { onOpenPush: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
      <p>ช่วงวันของทริปเปลี่ยน — อัปเดตจากปฏิทินของฉันอีกครั้ง?</p>
      <button type="button" onClick={onOpenPush} className="shrink-0 rounded bg-gray-900 px-3 py-1 text-white">
        อัปเดต
      </button>
    </div>
  )
}
