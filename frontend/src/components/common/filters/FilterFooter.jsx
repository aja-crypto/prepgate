import { memo } from 'react'

const FilterFooter = memo(({ resultCount, onClear, onApply, hasChanges }) => (
  <div className="mobile-filter-footer">
    <button onClick={onClear} className="mobile-filter-footer-clear" type="button">
      Clear
    </button>
    <button onClick={onApply} className="mobile-filter-footer-apply" data-changed={hasChanges} type="button">
      Show Results
      <span className="mobile-filter-footer-count">{resultCount}</span>
    </button>
  </div>
))

FilterFooter.displayName = 'FilterFooter'
export default FilterFooter
