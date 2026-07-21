import { memo, useState, useCallback, useMemo } from 'react'
import FilterBadge from './FilterBadge'
import FilterDrawer from './FilterDrawer'

const INACTIVE_VALUES = ['All', '', null]
const MAX_VISIBLE_PILLS = 3

const FilterBar = memo(({ config, resultCount, onApply, onClear }) => {
  const [open, setOpen] = useState(false)

  const activeFilters = useMemo(() => {
    const result = []
    config.forEach((f) => {
      if (!INACTIVE_VALUES.includes(f.value)) {
        const opt = f.options.find((o) => (typeof o === 'string' ? o : o.value) === f.value)
        result.push({ id: f.id, label: opt && typeof opt === 'object' ? opt.label : f.value })
      }
    })
    return result
  }, [config])

  const activeCount = activeFilters.length
  const visiblePills = useMemo(() => activeFilters.slice(0, MAX_VISIBLE_PILLS), [activeFilters])
  const overflowCount = activeFilters.length - MAX_VISIBLE_PILLS

  const initialValues = useMemo(() => {
    const vals = {}
    config.forEach((f) => { vals[f.id] = f.value })
    return vals
  }, [config])

  const handleApply = useCallback((values) => {
    onApply(values)
    setOpen(false)
  }, [onApply])

  const handleClear = useCallback(() => {
    onClear()
    setOpen(false)
  }, [onClear])

  const handleRemoveFilter = useCallback((id) => {
    const f = config.find((c) => c.id === id)
    if (f) {
      const defaultVal = typeof f.options[0] === 'string' ? f.options[0] : f.options[0].value
      const patch = { [id]: defaultVal }
      const newValues = { ...initialValues, ...patch }
      onApply(newValues)
    }
  }, [config, initialValues, onApply])

  return (
    <div className="mobile-filter-bar-wrapper">
      <div className="mobile-filter-bar-sticky">
        <button
          className="mobile-filter-bar-trigger"
          onClick={() => setOpen(true)}
          aria-label={`Filters${activeCount > 0 ? `, ${activeCount} active` : ''}`}
        >
          <svg className="mobile-filter-bar-trigger-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
          <span className="mobile-filter-bar-text">Filters</span>
          {activeCount > 0 && <span className="mobile-filter-bar-count">{activeCount}</span>}
          {activeCount === 0 && <span className="mobile-filter-bar-idle-dot" />}
        </button>

        {activeFilters.length > 0 && (
          <div className="mobile-filter-bar-active">
            {visiblePills.map((af) => (
              <FilterBadge
                key={af.id}
                label={af.label}
                onRemove={() => handleRemoveFilter(af.id)}
              />
            ))}
            {overflowCount > 0 && (
              <span className="mobile-filter-bar-overflow">+{overflowCount}</span>
            )}
            <button className="mobile-filter-bar-clear-all" onClick={() => { onClear(); setOpen(false) }}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {open && (
        <FilterDrawer
          config={config}
          initialValues={initialValues}
          resultCount={resultCount}
          onApply={handleApply}
          onClear={handleClear}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
})

FilterBar.displayName = 'FilterBar'
export default FilterBar
