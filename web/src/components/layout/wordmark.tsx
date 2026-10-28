import { Link } from 'react-router'

// ยังไม่มีโลโก้: ใช้ชื่อแอปเป็นตัวอักษร "WeGo" สี ink + "JUAN" สี orange-ink (Mitr 600 จาก .wg-wordmark)
export function Wordmark({ href }: { href?: string }) {
  const name = (
    <>
      WeGo<span>JUAN</span>
    </>
  )
  if (href) {
    return (
      <Link to={href} className="wg-wordmark" aria-label="WeGoJUAN">
        {name}
      </Link>
    )
  }
  return (
    <span className="wg-wordmark" aria-label="WeGoJUAN">
      {name}
    </span>
  )
}
