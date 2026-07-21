import { memo } from 'react'

const WidgetBadge = memo(({ children, variant = 'default', className = '' }) => (
  <span className={`widget-badge widget-badge-${variant}${className ? ' ' + className : ''}`}>{children}</span>
))

WidgetBadge.displayName = 'WidgetBadge'
export default WidgetBadge
