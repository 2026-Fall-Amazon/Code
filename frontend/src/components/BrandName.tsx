import { APP_NAME } from '../config'

// The last word of the name is shown in brand gold ("Amazon" white, "Campus" gold).
const lastSpace = APP_NAME.lastIndexOf(' ')
const nameStart = APP_NAME.slice(0, lastSpace + 1)
const nameEnd = APP_NAME.slice(lastSpace + 1)

export function BrandName() {
  return (
    // One wrapping span keeps the space after "Amazon" even inside flex layouts.
    <span>
      {nameStart}
      <span className="text-brand">{nameEnd}.</span>
    </span>
  )
}
