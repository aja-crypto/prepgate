import { memo, useCallback, useState } from 'react'

const FilterChip = memo(({ label, active, onClick, styleDelay }) => {
  const [ripple, setRipple] = useState(false)

  const handleClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const chip = e.currentTarget
    chip.style.setProperty('--ripple-x', `${x}px`)
    chip.style.setProperty('--ripple-y', `${y}px`)
    setRipple(true)
    setTimeout(() => setRipple(false), 400)
    onClick()
  }, [onClick])

  return (
    <button
      onClick={handleClick}
      className="mobile-filter-chip"
      data-active={active}
      style={styleDelay != null ? { animationDelay: `${styleDelay}ms` } : undefined}
      aria-pressed={active}
      aria-label={`${label}${active ? ' (active)' : ''}`}
    >
      {ripple && <span className="mobile-filter-chip-ripple" />}
      {label}
    </button>
  )
})

FilterChip.displayName = 'FilterChip'
export default FilterChip
