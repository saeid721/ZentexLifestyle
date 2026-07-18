// src/pages/WishlistPage/WishlistPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import useWishlistStore from '../../app/wishlistStore';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import Reveal from '../../components/ui/Reveal/Reveal';
import ProductToolbar from '../../components/ui/ProductToolbar/ProductToolbar';
import FilterDrawer from '../../components/ui/FilterDrawer/FilterDrawer';
import '../CategoryPage/CatagoryProductPage.scss';
import './wishlist.scss';

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default'           },
  { value: 'date_asc',   label: 'Date: Old → New'   },
  { value: 'date_desc',  label: 'Date: New → Old'   },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc',   label: 'Name: A → Z'       },
  { value: 'name_desc',  label: 'Name: Z → A'       },
];
const PER_PAGE_OPTIONS = [12, 24, 50, 100];

const WishlistPage = () => {
  // ✅ Pull actual wishlist items from the store instead of a search query
  const items = useWishlistStore((s) => s.items) || [];

  const [sortBy,      setSortBy]      = useState('default');
  const [perPage,     setPerPage]     = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ NEW: filter drawer state
  const [viewCols, setViewCols] = useState(5);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    status: [],
    sizes: [],
    priceMin: 0,
    priceMax: 10000,
  });

  const isEmpty = items.length === 0;

  // ✅ NEW: apply filters before sorting
  const filteredItems = items.filter((p) => {
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

  // ── Sorting ───────────────────────────────────────────────────
  const sorted = [...filteredItems].sort((a, b) => {
    const aPrice = a.new_price ?? a.price ?? 0;
    const bPrice = b.new_price ?? b.price ?? 0;

    if (sortBy === 'price_asc')  return aPrice - bPrice;
    if (sortBy === 'price_desc') return bPrice - aPrice;
    if (sortBy === 'name_asc')   return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name_desc')  return (b.name || '').localeCompare(a.name || '');

    if (sortBy === 'date_asc') {
      const aDate = a.createdAt || a.date || a.publishedAt || a.created_date || a.date_added || '';
      const bDate = b.createdAt || b.date || b.publishedAt || b.created_date || b.date_added || '';
      return new Date(aDate) - new Date(bDate);
    }
    if (sortBy === 'date_desc') {
      const aDate = a.createdAt || a.date || a.publishedAt || a.created_date || a.date_added || '';
      const bDate = b.createdAt || b.date || b.publishedAt || b.created_date || b.date_added || '';
      return new Date(bDate) - new Date(aDate);
    }

    return 0;
  });

  // ── Pagination ────────────────────────────────────────────────
  const totalPages = Math.ceil(sorted.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginated  = sorted.slice(startIndex, startIndex + perPage);

  const handlePerPage = (v) => { setPerPage(Number(v)); setCurrentPage(1); };
  const handleSort    = (v) => { setSortBy(v);          setCurrentPage(1); };

  const getPages = () => {
    const pages = [];
    const r = 2;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - r && i <= currentPage + r)) {
        pages.push(i);
      } else if (i === currentPage - r - 1 || i === currentPage + r + 1) {
        pages.push('...');
      }
    }
    return [...new Set(pages)];
  };

  return (
    <main className="ccat-page">
          <div className="hero-section">
            <Container className="container-1500">
              <Reveal as="h1" type="fade-up" className="hero-section__title">Wishlist</Reveal>
              <nav aria-label="breadcrumb">
                <ol className="hero-section__breadcrumb">
                  <li><Link to="/">Home</Link></li>
                  <li><span className="hero-section__sep">&gt;</span><span>Wishlist</span></li>
                </ol>
              </nav>
            </Container>
          </div>

      <Container className="container-1500">

        {/* ── Empty Wishlist State ── */}
        {isEmpty ? (
          <div className="wishlist-empty">
            <Heart size={56} strokeWidth={1.5} className="wishlist-empty__icon" />

            <p className="wishlist-empty__title">
              <span className="wishlist-empty__title-highlight">Wishlist</span> is empty.
            </p>

            <p className="wishlist-empty__desc">
              You don't have any products in the wishlist yet. You will find a lot of interesting
              products on our "Shop" page.
            </p>

            <Link to="/shop" className="wishlist-empty__btn">
              Return to shop
            </Link>
          </div>
        ) : (
          <>
            {/* ── Filter bar ── */}
            <ProductToolbar
              onFilterClick={() => setShowFilter(true)}
              viewCols={viewCols}
              onViewChange={setViewCols}
              sortBy={sortBy}
              onSortChange={handleSort}
              sortOptions={SORT_OPTIONS}
            />

            <FilterDrawer
              show={showFilter}
              onClose={() => setShowFilter(false)}
              filters={filters}
              onApply={setFilters}
            />

            {/* ── Product Grid ── */}
            <Row xs={2} sm={3} md={4} lg={viewCols} className="g-3">
              {paginated.map((product, idx) => (
                <Col key={product.id}>
                  <Reveal type="fade-up" delay={(idx % 10) * 60}>
                    <ProductCard product={product} showWishlistToggle />
                  </Reveal>
                </Col>
              ))}
            </Row>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="ccat-page__pagination-wrap d-flex align-items-center justify-content-between flex-wrap gap-3 mt-4">
                <div className="ccat-page__pagination d-flex align-items-center gap-1">
                  <button
                    className="ccat-page__page-btn ccat-page__page-btn--arrow"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={14} strokeWidth={2.5} />
                  </button>

                  {getPages().map((page, i) =>
                    page === '...' ? (
                      <span key={`e-${i}`} className="ccat-page__page-ellipsis">…</span>
                    ) : (
                      <button
                        key={page}
                        className={`ccat-page__page-btn ${currentPage === page ? 'ccat-page__page-btn--active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    className="ccat-page__page-btn ccat-page__page-btn--arrow"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="ccat-page__select-wrap">
                  <label className="ccat-page__select-label">Per page:</label>
                  <select className="ccat-page__select" value={perPage} onChange={(e) => handlePerPage(e.target.value)}>
                    {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} per page</option>)}
                  </select>
                </div>
              </div>
            )}
          </>
        )}

      </Container>
    </main>
  );
};

export default WishlistPage;