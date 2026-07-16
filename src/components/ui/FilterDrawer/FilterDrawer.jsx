import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useCategories } from '../../../hooks/useCategories';
import './FilterDrawer.scss';

const STATUS_OPTIONS = [
  { key: 'on_sale', label: 'On sale' },
  { key: 'in_stock', label: 'In stock' },
  { key: 'out_of_stock', label: 'Out of stock' },
];

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

const FilterDrawer = ({ show, onClose, filters, onApply, minPrice = 0, maxPrice = 10000 }) => {
  const { categories } = useCategories();
  const [local, setLocal] = useState(filters);

  useEffect(() => { if (show) setLocal(filters); }, [show, filters]);

  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;

  const toggleCategory = (slug) =>
    setLocal((f) => ({
      ...f,
      categories: f.categories.includes(slug)
        ? f.categories.filter((c) => c !== slug)
        : [...f.categories, slug],
    }));

  const toggleStatus = (key) =>
    setLocal((f) => ({
      ...f,
      status: f.status.includes(key) ? f.status.filter((s) => s !== key) : [...f.status, key],
    }));

  const toggleSize = (size) =>
    setLocal((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }));

  const handleApply = () => { onApply(local); onClose(); };

  const handleReset = () => {
    const cleared = { categories: [], status: [], sizes: [], priceMin: minPrice, priceMax: maxPrice };
    setLocal(cleared);
    onApply(cleared);
  };

  return (
    <>
      <div className="filter-drawer-backdrop" onClick={onClose} />
      <aside className="filter-drawer" role="dialog" aria-label="Filter products">
        <div className="filter-drawer__header">
          <span className="filter-drawer__title">
            <X size={15} strokeWidth={2.5} style={{ marginRight: 6, opacity: 0 }} />
            FILTER
          </span>
          <button className="filter-drawer__close" onClick={onClose} aria-label="Close filter">
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="filter-drawer__body">
          {categories.length > 0 && (
            <div className="filter-drawer__section">
              <p className="filter-drawer__section-title">Product Categories</p>
              {categories.map((cat) => (
                <label key={cat.id} className="filter-drawer__checkbox">
                  <input
                    type="checkbox"
                    checked={local.categories.includes(cat.slug)}
                    onChange={() => toggleCategory(cat.slug)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          )}

          <div className="filter-drawer__section">
            <p className="filter-drawer__section-title">Product Status</p>
            {STATUS_OPTIONS.map((s) => (
              <label key={s.key} className="filter-drawer__checkbox">
                <input
                  type="checkbox"
                  checked={local.status.includes(s.key)}
                  onChange={() => toggleStatus(s.key)}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>

          <div className="filter-drawer__section">
            <p className="filter-drawer__section-title">Price</p>
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={local.priceMax}
              onChange={(e) => setLocal((f) => ({ ...f, priceMax: Number(e.target.value) }))}
              className="filter-drawer__price-slider"
            />
            <p className="filter-drawer__price-label">
              Price: ৳{local.priceMin} — ৳{local.priceMax}
            </p>
          </div>

          <div className="filter-drawer__section">
            <p className="filter-drawer__section-title">Size</p>
            <div className="filter-drawer__sizes">
              {SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`filter-drawer__size-btn ${local.sizes.includes(size) ? 'filter-drawer__size-btn--active' : ''}`}
                  onClick={() => toggleSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-drawer__footer">
          <button className="filter-drawer__reset-btn" onClick={handleReset}>Reset</button>
          <button className="filter-drawer__apply-btn" onClick={handleApply}>Apply Filter</button>
        </div>
      </aside>
    </>
  );
};

export default FilterDrawer;