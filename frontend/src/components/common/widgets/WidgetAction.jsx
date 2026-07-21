import { forwardRef, memo } from 'react'

const WidgetAction = memo(forwardRef(function WidgetAction({ children, variant = 'primary', href, onClick, className = '', ...props }, ref) {
  const Tag = href ? 'a' : 'button'
  return (
    <Tag
      ref={ref}
      className={`widget-action widget-action-${variant}${className ? ' ' + className : ''}`}
      href={href}
      onClick={onClick}
      type={href ? undefined : 'button'}
      {...props}
    >
      {children}
    </Tag>
  )
}))

WidgetAction.displayName = 'WidgetAction'
export default WidgetAction
