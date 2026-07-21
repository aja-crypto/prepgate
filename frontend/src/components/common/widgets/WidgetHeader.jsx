import { memo } from 'react'

const WidgetHeader = memo(({ icon, title, action, subtitle }) => (
  <div className="widget-header">
    <div className="widget-header-left">
      {icon && <span className="widget-header-icon">{icon}</span>}
      <div>
        <WidgetTitle>{title}</WidgetTitle>
        {subtitle && <WidgetSubtitle>{subtitle}</WidgetSubtitle>}
      </div>
    </div>
    {action && <div className="widget-header-action">{action}</div>}
  </div>
))

const WidgetTitle = memo(({ children, className = '' }) => (
  <div className={`widget-title${className ? ' ' + className : ''}`}>{children}</div>
))

const WidgetSubtitle = memo(({ children, className = '' }) => (
  <div className={`widget-subtitle${className ? ' ' + className : ''}`}>{children}</div>
))

WidgetHeader.displayName = 'WidgetHeader'
WidgetTitle.displayName = 'WidgetTitle'
WidgetSubtitle.displayName = 'WidgetSubtitle'
export { WidgetHeader, WidgetTitle, WidgetSubtitle }
export default WidgetHeader
