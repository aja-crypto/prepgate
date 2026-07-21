import { memo } from 'react'

const WidgetStat = memo(({ label, value, sub, color, trend, icon, className = '' }) => (
  <div className={`widget-stat${className ? ' ' + className : ''}`}>
    <div className="widget-stat-value" style={color ? { color } : undefined}>
      {icon && <span className="widget-stat-icon">{icon}</span>}
      <span>{value}</span>
      {trend && <span className={`widget-stat-trend ${trend > 0 ? 'up' : 'down'}`}>{trend > 0 ? '+' : ''}{trend}</span>}
    </div>
    <div className="widget-stat-label">{label}</div>
    {sub && <div className="widget-stat-sub">{sub}</div>}
  </div>
))

WidgetStat.displayName = 'WidgetStat'
export default WidgetStat
