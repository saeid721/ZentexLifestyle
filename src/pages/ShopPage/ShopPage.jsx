import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container } from 'react-bootstrap';
import ProductGrid from '../../components/ui/ProductGrid/ProductGrid';
import ProductToolbar from '../../components/ui/ProductToolbar/ProductToolbar';
import FilterDrawer from '../../components/ui/FilterDrawer/FilterDrawer';
import { apiGet } from '../../utils/api';
import Reveal from '../../components/ui/Reveal/Reveal';
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

const PER_PAGE = 10;

const ShopPage = () => {
  const [products,    setProducts]    = useState([]);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [total,        setTotal]        = useState(0);
  const [sortBy,       setSortBy]       = useState('default');

  const sentinelRef = useRef(null);

  // ✅ NEW: toolbar + filter state
  const [viewCols, setViewCols] = useState(5);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    status: [],
    sizes: [],
    priceMin: 0,
    priceMax: 10000,
  });

  // Fetch whenever page changes
  useEffect(() => {
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    apiGet(`/all/products?page=${page}&per_page=${PER_PAGE}`)
      .then((res) => {
        if (cancelled) return;
        const newItems = res.data?.data ?? [];
        const lastPage = res.data?.last_page ?? page;
        const totalCnt = res.data?.total ?? newItems.length;

        setProducts((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
        setHasMore(page < lastPage);
        setTotal(totalCnt);
      })
      .catch((err) => console.error('[ShopPage products]', err))
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });

    return () => { cancelled = true; };
  }, [page]);

  // Observe sentinel to auto-load next page on scroll
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  const handleSort = useCallback((v) => setSortBy(v), []);

  // ✅ NEW: client-side filter applied on top of loaded products
  const filtered = products.filter((p) => {
    const price = p.new_price ?? p.price ?? 0;
    if (price < filters.priceMin || price > filters.priceMax) return false;

    if (filters.categories.length > 0) {
      const catSlug = p.category?.slug || p.subcategory?.slug;
      if (!filters.categories.includes(catSlug)) return false;
    }

    if (filters.status.includes('on_sale')) {
      const hasDiscount = (p.old_price ?? 0) > (p.new_price ?? p.price ?? 0);
      if (!hasDiscount) return false;
    }

    return true;
  });

  // ── Client-side sort of everything loaded so far ──
  const sorted = [...filtered].sort((a, b) => {
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

    return 0;
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
        {!loading && (
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
        />

        <Reveal type="fade-up">
          <ProductGrid products={sorted} loading={loading} cols={viewCols} />
        </Reveal>

        {/* Sentinel — triggers next page fetch when scrolled into view */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="tabview-products__sentinel" />
        )}

      </Container>
    </section>
  );
};

export default ShopPage;