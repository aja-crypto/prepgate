import { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import FilterChip from './FilterChip'

const COLLAPSED_KEY = 'filter_section_collapsed'

const FilterSection = memo(({ title, options, value, onChange, searchQuery }) => {
  const storageKey = useMemo(() => `${COLLAPSED_KEY}_${title}`, [title])
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'true' } catch { return false }
  })

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(storageKey, next.toString()) } catch {}
      return next
    })
  }, [storageKey])

  const filtered = useMemo(() => {
    if (!searchQuery) return options
    const q = searchQuery.toLowerCase()
    return options.filter((opt) => {
      const label = typeof opt === 'string' ? opt : opt.label
      return label.toLowerCase().includes(q)
    })
  }, [options, searchQuery])

  const gridRef = useRef(null)

  return (
    <div className="mobile-filter-section" data-collapsed={collapsed}>
      <button
        type="button"
        className="mobile-filter-section-header"
        onClick={toggleCollapse}
        aria-expanded={!collapsed}
        aria-label={`${title} filter section, ${collapsed ? 'collapsed' : 'expanded'}`}
      >
        <span className="mobile-filter-section-title">{title}</span>
        <svg
          className="mobile-filter-section-chevron"
          viewBox="0 0 20 20"
          fill="currentColor"
          width="16"
          height="16"
          data-collapsed={collapsed}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      <div
        className="mobile-filter-section-content"
        ref={gridRef}
        data-collapsed={collapsed}
      >
        <div className="mobile-filter-section-chips">
          {filtered.map((opt, i) => {
            const label = typeof opt === 'string' ? opt : opt.label
            const val = typeof opt === 'string' ? opt : opt.value
            return (
              <FilterChip
                key={val}
                label={label}
                active={value === val}
                onClick={() => onChange(val)}
                styleDelay={i * 20}
              />
            )
          })}
          {filtered.length === 0 && searchQuery && (
            <div className="mobile-filter-section-empty">No matches</div>
          )}
        </div>
      </div>
    </div>
  )
})

FilterSection.displayName = 'FilterSection'
export default FilterSection
