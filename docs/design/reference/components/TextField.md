# TextField

A labelled 48px input with an optional hint or error underneath.

- **Provide:** `label` (always visible, never placeholder-only), optional `hint`, `error`, and any input attribute (`type`, `value`, `onChange`, `placeholder`, `min`, `max`, `maxLength`, `required`…).
- Inputs use the 16px `body` style so iOS never zooms. Placeholders give an example ("เช่น ทำงาน, งานแต่งเพื่อน"), not instructions.
- `error` replaces the hint, turns the border `danger` and sets `aria-invalid`. Write what to do next: "ชื่อนี้มีคนใช้ในทริปแล้ว ลองตั้งชื่ออื่น".
- Mark optional fields in the label: "(ไม่บังคับ)". Mark private fields too: "· เห็นแค่คุณ".
