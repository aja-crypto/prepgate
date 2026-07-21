import { memo, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import FilterSection from './FilterSection'
import FilterFooter from './FilterFooter'

const SWIPE_THRESHOLD = 80

const FilterDrawer = memo(({ config, initialValues, resultCount, onApply, onClear, onClose }) => {
  const [localValues, setLocalValues] = useState(initialValues)
  const [hasChanges, setHasChanges] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [closing, setClosing] = useState(false)
  const contentRef = useRef(null)
  const startY = useRef(0)
  const drawerRef = useRef(null)

  const showSearch = useMemo(() => {
    return config.some((f) => f.options.length >= 15)
  }, [config])

  useEffect(() => {
    setLocalValues(initialValues)
    setHasChanges(false)
  }, [initialValues])

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [])

  useEffect(() => {
    const changed = config.some((f) => localValues[f.id] !== initialValues[f.id])
    setHasChanges(changed)
  }, [localValues, initialValues, config])

  const handleChange = useCallback((id, val) => {
    setLocalValues((prev) => ({ ...prev, [id]: val }))
  }, [])

  const handleClear = useCallback(() => {
    const cleared = {}
    config.forEach((f) => { cleared[f.id] = f.options[0] === 'All' ? 'All' : f.options[0].value || f.options[0] })
    setLocalValues(cleared)
    setHasChanges(true)
  }, [config])

  const animateClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 220)
  }, [onClose])

  const handleApply = useCallback(() => {
    onApply(localValues)
  }, [localValues, onApply])

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) animateClose()
  }, [animateClose])

  const handleTouchStart = useCallback((e) => {
    if (contentRef.current?.scrollTop > 0) { startY.current = 0; return }
    startY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!startY.current) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 0) {
      setSwipeOffset(Math.min(dy, 300))
      if (drawerRef.current) {
        drawerRef.current.style.transform = `translateY(${Math.min(dy, 300)}px)`
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (swipeOffset > SWIPE_THRESHOLD) {
      animateClose()
    } else {
      setSwipeOffset(0)
      if (drawerRef.current) {
        drawerRef.current.style.transform = ''
      }
    }
    startY.current = 0
  }, [swipeOffset, animateClose])

  useEffect(() => {
    if (!showSearch) { setSearchQuery(''); return }
  }, [showSearch])

  return (
    <div className={`mobile-filter-overlay${closing ? ' mobile-filter-overlay-closing' : ''}`} onClick={handleOverlayClick}>
      <div
        className={`mobile-bottom-sheet mobile-filter-drawer${closing ? ' mobile-filter-drawer-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="mobile-filter-drawer-handle" />
        <div className="mobile-filter-drawer-header">
          <span className="mobile-filter-drawer-title">Filters</span>
          <button
            type="button"
            onClick={animateClose}
            className="mobile-filter-drawer-close"
            aria-label="Close filters"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {showSearch && (
          <div className="mobile-filter-drawer-search">
            <svg className="mobile-filter-drawer-search-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search filters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-filter-drawer-search-input"
              aria-label="Search filter options"
            />
          </div>
        )}

        <div className="mobile-filter-drawer-content" ref={contentRef}>
          {config.map((f) => (
            <FilterSection
              key={f.id}
              title={f.label}
              options={f.options}
              value={localValues[f.id]}
              onChange={(val) => handleChange(f.id, val)}
              searchQuery={searchQuery}
            />
          ))}
        </div>
        <FilterFooter
          resultCount={resultCount}
          onClear={handleClear}
          onApply={handleApply}
          hasChanges={hasChanges}
        />
      </div>
    </div>
  )
})

FilterDrawer.displayName = 'FilterDrawer'
export default FilterDrawer
