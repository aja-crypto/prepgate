import { memo } from 'react'

const WidgetSkeleton = memo(({ lines = 3, height, className = '' }) => (
  <div className={`widget-card widget-card-padded${className ? ' ' + className : ''}`}>
    {Array.from({ length: lines }, (_, i) => (
      <div
        key={i}
        className="widget-skeleton-line"
        style={{
          width: i === lines - 1 ? '60%' : '100%',
          height: height || (i === 0 ? 18 : 14),
        }}
      />
    ))}
  </div>
))

WidgetSkeleton.displayName = 'WidgetSkeleton'
export default WidgetSkeleton
