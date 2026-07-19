import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container } from 'react-bootstrap';
import SectionHeader from '../../../components/ui/SectionHeader/SectionHeader';
import ProductGrid from '../../../components/ui/ProductGrid/ProductGrid';
import { apiGet } from '../../../utils/api';
import Reveal from '../../../components/ui/Reveal/Reveal';
import './TabviewProducts.scss';

const TABS = [
  { key: 'best_selling', label: 'Best Selling' },
  { key: 'new_arrival',  label: 'New Arrivals' },
  { key: 'on_sale',      label: 'On Sale' },
  { key: 'pre_order',    label: 'Pre Order' },
];

const PER_PAGE = 10;

const TabviewProducts = () => {
  const [activeTab, setActiveTab] = useState(null);
  const [products,  setProducts]  = useState([]);
  const [page,       setPage]      = useState(1);
  const [hasMore,    setHasMore]   = useState(true);
  const [loading,    setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [availableTabs, setAvailableTabs] = useState([]);
  const [tabsChecked, setTabsChecked] = useState(false);

  const sentinelRef = useRef(null);

  // ✅ On mount, check each tab type for products; only keep tabs that have data
  useEffect(() => {
    let cancelled = false;

    Promise.all(
      TABS.map((tab) =>
        apiGet(`/products/tabbed?type=${tab.key}&page=1&per_page=1`)
          .then((res) => ({ tab, hasData: (res.data?.data?.length ?? 0) > 0 }))
          .catch(() => ({ tab, hasData: false }))
      )
    ).then((results) => {
      if (cancelled) return;
      const found = results.filter((r) => r.hasData).map((r) => r.tab);
      setAvailableTabs(found);
      if (found.length > 0) setActiveTab(found[0].key);
      setTabsChecked(true);
    });

    return () => { cancelled = true; };
  }, []);

  // Reset pagination whenever the active tab changes
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [activeTab]);

  // Fetch whenever page (or tab) changes
  useEffect(() => {
    if (!activeTab) return;
    let cancelled = false;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    apiGet(`/products/tabbed?type=${activeTab}&page=${page}&per_page=${PER_PAGE}`)
      .then((res) => {
        if (cancelled) return;
        const newItems   = res.data?.data ?? [];
        const lastPage   = res.data?.last_page ?? page;

        setProducts((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
        setHasMore(page < lastPage);
      })
      .catch((err) => console.error('[TabviewProducts]', err))
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoadingMore(false);
      });

    return () => { cancelled = true; };
  }, [activeTab, page]);

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

  const handleTabClick = useCallback((key) => {
    if (key !== activeTab) setActiveTab(key);
  }, [activeTab]);

  if (tabsChecked && availableTabs.length === 0) return null;

  return (
    <section className="section-wrapper tabview-products">
      <Container className="container-1500">

        {availableTabs.length > 1 && (
          <Reveal type="fade-up" className="tabview-products__tabs">
            {availableTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tabview-products__tab${
                  activeTab === tab.key ? ' tabview-products__tab--active' : ''
                }`}
                onClick={() => handleTabClick(tab.key)}
              >
                {tab.label}
              </button>
             ))}
          </Reveal>
        )}

        <Reveal type="fade-up" delay={100}>
          <ProductGrid products={products} loading={loading} />
        </Reveal>

        {/* Sentinel — triggers next page fetch when scrolled into view */}
        {hasMore && !loading && (
          <div ref={sentinelRef} className="tabview-products__sentinel" />
        )}

      </Container>
    </section>
  );
};

export default TabviewProducts;