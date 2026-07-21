import { memo } from 'react'

const WidgetFooter = memo(({ children, className = '', align = 'left' }) => (
  <div className={`widget-footer widget-footer-${align}${className ? ' ' + className : ''}`}>{children}</div>
))

WidgetFooter.displayName = 'WidgetFooter'
export default WidgetFooter
