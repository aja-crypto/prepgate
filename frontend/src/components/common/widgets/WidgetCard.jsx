import { forwardRef, memo } from 'react'

const WidgetCard = memo(forwardRef(function WidgetCard({ children, className = '', padding = true, href, onClick, ...props }, ref) {
  const Tag = href ? 'a' : onClick ? 'button' : 'div'
  const extra = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : onClick ? { onClick, type: 'button' } : {}
  return (
    <Tag
      ref={ref}
      className={`widget-card${padding ? ' widget-card-padded' : ''}${className ? ' ' + className : ''}`}
      {...extra}
      {...props}
    >
      {children}
    </Tag>
  )
}))

WidgetCard.displayName = 'WidgetCard'
export default WidgetCard
