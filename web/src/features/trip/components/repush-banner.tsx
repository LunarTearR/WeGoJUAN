import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'

// ช่วงวันของทริปได้วันเพิ่มหลังจาก Push ครั้งล่าสุด — วันใหม่ยังไม่มี Mark จากปฏิทินของฉัน
export function RepushBanner({ onOpenPush }: { onOpenPush: () => void }) {
  return (
    <Banner
      tone="honey"
      title="ช่วงวันของทริปเปลี่ยนแล้ว"
      actions={
        <Button variant="secondary" size="sm" icon="refresh" onClick={onOpenPush}>
          อัปเดต
        </Button>
      }
    >
      อัปเดตจากปฏิทินของฉันอีกรอบไหม?
    </Banner>
  )
}
