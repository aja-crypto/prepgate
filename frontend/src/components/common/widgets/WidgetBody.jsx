import { memo } from 'react'

const WidgetBody = memo(({ children, className = '' }) => (
  <div className={`widget-body${className ? ' ' + className : ''}`}>{children}</div>
))

WidgetBody.displayName = 'WidgetBody'
export default WidgetBody
