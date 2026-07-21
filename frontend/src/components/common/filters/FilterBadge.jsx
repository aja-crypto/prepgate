import { memo, useCallback, useState } from 'react'

const FilterBadge = memo(({ label, onRemove }) => {
  const [removing, setRemoving] = useState(false)

  const handleRemove = useCallback(() => {
    setRemoving(true)
    setTimeout(onRemove, 200)
  }, [onRemove])

  return (
    <span className={`mobile-filter-badge${removing ? ' mobile-filter-badge-removing' : ''}`}>
      <span className="mobile-filter-badge-label">{label}</span>
      <button
        onClick={handleRemove}
        className="mobile-filter-badge-x"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  )
})

FilterBadge.displayName = 'FilterBadge'
export default FilterBadge
