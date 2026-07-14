import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container } from 'react-bootstrap';
import ProductGrid from '../../components/ui/ProductGrid/ProductGrid';
import { apiGet } from '../../utils/api';
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

  // ── Client-side sort of everything loaded so far ──
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

    return 0;
  });

  return (
    <section className="section-wrapper tabview-products">
      <Container className="container-1500">

        {/* ── Filter bar (same style as Wishlist/Search pages) ── */}
        {!loading && (
          <div className="ccat-page__filter-bar d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
            <p className="ccat-page__count mb-0">
              Showing {sorted.length} of {total} products
            </p>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="ccat-page__select-wrap">
                <label className="ccat-page__select-label">Sort by:</label>
                <select className="ccat-page__select" value={sortBy} onChange={(e) => handleSort(e.target.value)}>
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        <ProductGrid products={sorted} loading={loading} />

        {/* Sentinel — triggers next page fetch when scrolled into view */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="tabview-products__sentinel" />
        )}

      </Container>
    </section>
  );
};

export default ShopPage;