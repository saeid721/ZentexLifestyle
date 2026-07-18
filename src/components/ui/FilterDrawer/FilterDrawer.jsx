import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';
import { useCategories } from '../../../hooks/useCategories';
import './FilterDrawer.scss';

const STATUS_OPTIONS = [
  { key: 'new_arrivals', label: 'New Arrivals' },
  { key: 'on_sale', label: 'On sale' },
  { key: 'in_stock',     label: 'In stock' },
  { key: 'out_of_stock', label: 'Out of stock' },
  { key: 'pre_order',    label: 'Pre Order' },
];

const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

const FilterDrawer = ({ show, onClose, filters, onApply, minPrice = 0, maxPrice = 10000 }) => {
  const { categories } = useCategories();
  const [local, setLocal] = useState(filters);
  const priceDebounceRef = useRef(null);

  useEffect(() => { if (show) setLocal(filters); }, [show, filters]);

  useEffect(() => {
    document.body.style.overflow = show ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  useEffect(() => () => {
    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
  }, []);

  if (!show) return null;

  const toggleCategory = (slug) => {
    const next = {
      ...local,
      categories: local.categories.includes(slug)
        ? local.categories.filter((c) => c !== slug)
        : [...local.categories, slug],
    };
    setLocal(next);
    onApply(next); // ✅ auto-apply immediately
  };

  const toggleStatus = (key) => {
    const next = {
      ...local,
      status: local.status.includes(key)
        ? local.status.filter((s) => s !== key)
        : [...local.status, key],
    };
    setLocal(next);
    onApply(next); // ✅ auto-apply immediately
  };

  const toggleSize = (size) => {
    const next = {
      ...local,
      sizes: local.sizes.includes(size)
        ? local.sizes.filter((s) => s !== size)
        : [...local.sizes, size],
    };
    setLocal(next);
    onApply(next); // ✅ auto-apply immediately
  };

  const handlePriceChange = (value) => {
    const next = { ...local, priceMax: value };
    setLocal(next);

    if (priceDebounceRef.current) clearTimeout(priceDebounceRef.current);
    priceDebounceRef.current = setTimeout(() => {
      onApply(next); // ✅ auto-apply after user stops dragging (400ms)
    }, 400);
  };

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
              onChange={(e) => handlePriceChange(Number(e.target.value))}
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