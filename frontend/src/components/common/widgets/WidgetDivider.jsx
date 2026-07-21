import { memo } from 'react'

const WidgetDivider = memo(({ className = '' }) => (
  <div className={`widget-divider${className ? ' ' + className : ''}`} />
))

WidgetDivider.displayName = 'WidgetDivider'
export default WidgetDivider
