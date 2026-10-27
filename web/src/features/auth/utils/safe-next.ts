// กัน open redirect: รับเฉพาะ path ภายในเว็บ เช่น "/trips/1"
// ไม่รับ "//evil.com" หรือ "/\evil.com" (browser ตีความเป็นโดเมนอื่น) และ URL เต็ม
export function safeNext(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    return next
  }
  return '/'
}
