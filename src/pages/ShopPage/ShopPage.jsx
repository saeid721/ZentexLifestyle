import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container } from 'react-bootstrap';
import ProductGrid from '../../components/ui/ProductGrid/ProductGrid';
import ProductToolbar from '../../components/ui/ProductToolbar/ProductToolbar';
import FilterDrawer from '../../components/ui/FilterDrawer/FilterDrawer';
import { apiGet } from '../../utils/api';
import Reveal from '../../components/ui/Reveal/Reveal';
import { PackageOpen } from 'lucide-react';
import '../CategoryPage/CatagoryProductPage.scss';
import './ShopPage.scss';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default'           },
  { value: 'date_asc',   label: 'Date: Old → New'   },
  { value: 'date_desc',  label: 'Date: New → Old'   },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc',   label: 'Name: A → Z'       },
  { value: 'name_desc',  label: 'Name: Z → A'       },
];

const INITIAL_COUNT = 20;
const LOAD_MORE_COUNT = 5;

const ShopPage = () => {
  const [products,    setProducts]    = useState([]);
  const [visibleCount,  setVisibleCount] = useState(INITIAL_COUNT);
  const [hasMore,      setHasMore]      = useState(true);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [total,        setTotal]        = useState(0);
  const [sortBy,       setSortBy]       = useState('default');

  const sentinelRef = useRef(null);

  // ✅ NEW: toolbar + filter state
  const [viewCols, setViewCols] = useState(5);
  const [showFilter, setShowFilter] = useState(false);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 20000 });
  const [filters, setFilters] = useState({
    categories: [],
    status: [],
    sizes: [],
    priceMin: 0,
    priceMax: 20000,
  });

  // ✅ Fetch actual min/max new_price from API once, to set dynamic price bounds
  useEffect(() => {
    apiGet('/all/products?per_page=1000')
      .then((res) => {
        const items = res.data?.products?.data ?? [];
        if (items.length === 0) return;
        const prices = items.map((p) => Number(p.new_price ?? p.price ?? 0));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        setPriceBounds({ min, max });
        setFilters((f) => ({ ...f, priceMin: min, priceMax: max }));
      })
      .catch((err) => console.error('[ShopPage price bounds]', err));
  }, []);

  // ✅ Reset pagination whenever filters change
  useEffect(() => {
    setProducts([]);
    setVisibleCount(INITIAL_COUNT);
    setHasMore(true);
  }, [filters]);

  // Fetch whenever visibleCount or filters change
  useEffect(() => {
    let cancelled = false;
    if (visibleCount === INITIAL_COUNT) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams();
    params.append('page', 1);
    params.append('per_page', visibleCount);
    if (filters.categories.length > 0) params.append('category', filters.categories.join(','));
    if (filters.status.length > 0) params.append('status', filters.status.join(','));
    if (filters.sizes.length > 0) params.append('size', filters.sizes.join(','));
    if (filters.priceMin > 0) params.append('min_price', filters.priceMin);
    if (filters.priceMax < 10000) params.append('max_price', filters.priceMax);

    apiGet(`/all/products?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        const newItems = res.data?.products?.data ?? [];
        const totalCnt = res.data?.products?.total ?? newItems.length;

        setProducts(newItems);
        setHasMore(newItems.length < totalCnt);
        setTotal(totalCnt);
      })
      .catch((err) => console.error('[ShopPage products]', err))
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });

    return () => { cancelled = true; };
  }, [visibleCount, filters]);

  // Observe sentinel to auto-load next page on scroll
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => c + LOAD_MORE_COUNT);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  const handleSort = useCallback((v) => setSortBy(v), []);

  // ── Client-side sort of everything loaded so far (filtering now happens server-side) ──
  const sorted = [...products].sort((a, b) => {
    const aPrice = a.new_price ?? a.price ?? 0;
    const bPrice = b.new_price ?? b.price ?? 0;

    if (sortBy === 'price_asc')  return aPrice - bPrice;
    if (sortBy === 'price_desc') return bPrice - aPrice;
    if (sortBy === 'name_asc')   return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name_desc')  return (b.name || '').localeCompare(a.name || '');

    if (sortBy === 'date_asc') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }
    if (sortBy === 'date_desc') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }

    // default: order by serial_no ascending; products without a serial_no go last
    const aSerial = (a.serial_no !== null && a.serial_no !== undefined && a.serial_no !== '') ? Number(a.serial_no) : Infinity;
    const bSerial = (b.serial_no !== null && b.serial_no !== undefined && b.serial_no !== '') ? Number(b.serial_no) : Infinity;
    return aSerial - bSerial;
  });

  return (
    <section className="shop-page">
      <div className="hero-section">
        <Container className="container-1500">
          <Reveal as="h1" type="fade-up" className="hero-section__title">Shop</Reveal>
          <nav aria-label="breadcrumb">
            <ol className="hero-section__breadcrumb">
              <li><Link to="/">Home</Link></li>
              <li><span className="hero-section__sep">&gt;</span><span>Shop</span></li>
            </ol>
          </nav>
        </Container>
      </div>

      <Container className="container-1500">

        {/* ── Toolbar: Filter (left) / View icons (center) / Sort (right) ── */}
        {!loading && sorted.length > 0 && (
          <ProductToolbar
            onFilterClick={() => setShowFilter(true)}
            viewCols={viewCols}
            onViewChange={setViewCols}
            sortBy={sortBy}
            onSortChange={handleSort}
            sortOptions={SORT_OPTIONS}
          />
        )}

        <FilterDrawer
          show={showFilter}
          onClose={() => setShowFilter(false)}
          filters={filters}
          onApply={setFilters}
          minPrice={priceBounds.min}
          maxPrice={priceBounds.max}
        />

        {!loading && sorted.length === 0 ? (
          <div className="products-empty">
            <PackageOpen size={56} strokeWidth={1.5} className="products-empty__icon" />
            <p className="products-empty__title">
              <span className="products-empty__title-highlight">Products</span> not found.
            </p>
            <p className="products-empty__desc">
              No products are available right now. Please check back later.
            </p>
            <Link to="/" className="products-empty__btn">
              Return to Home
            </Link>
          </div>
        ) : (
          <Reveal type="fade-up">
            <ProductGrid products={sorted} loading={loading} cols={viewCols} />
          </Reveal>
        )}

        {/* Sentinel — triggers next page fetch when scrolled into view */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="tabview-products__sentinel" />
        )}

      </Container>
    </section>
  );
};

export default ShopPage;