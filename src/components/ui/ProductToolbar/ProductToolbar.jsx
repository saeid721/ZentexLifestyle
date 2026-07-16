import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import './ProductToolbar.scss';

const VIEW_OPTIONS = [1, 2, 3, 4, 5];

const ViewIcon = ({ cols }) => (
  <span className="product-toolbar__view-icon">
    {Array.from({ length: cols }).map((_, i) => (
      <span key={i} className="product-toolbar__view-icon-bar" />
    ))}
  </span>
);

const ProductToolbar = ({ onFilterClick, viewCols, onViewChange, sortBy, onSortChange, sortOptions }) => {
  return (
    <div className="product-toolbar">
      <button type="button" className="product-toolbar__filter-btn" onClick={onFilterClick}>
        <SlidersHorizontal size={15} strokeWidth={2} />
        Filter
      </button>

      <div className="product-toolbar__views">
        {VIEW_OPTIONS.map((cols) => (
          <button
            key={cols}
            type="button"
            className={`product-toolbar__view-btn ${viewCols === cols ? 'product-toolbar__view-btn--active' : ''}`}
            onClick={() => onViewChange(cols)}
            aria-label={`${cols} column view`}
            title={`${cols} column view`}
          >
            <ViewIcon cols={cols} />
          </button>
        ))}
      </div>

      <div className="product-toolbar__sort-wrap">
        <select
          className="product-toolbar__sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>Sort by: {o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProductToolbar;