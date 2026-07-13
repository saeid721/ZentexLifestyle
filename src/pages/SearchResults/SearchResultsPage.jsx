// src/pages/SearchResultsPage/SearchResultsPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import { API_BASE_URL } from '../../config/env';
import '../CategoryPage/CatagoryProductPage.scss';

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

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [allProducts, setAllProducts] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [sortBy,      setSortBy]      = useState('default');
  const [perPage,     setPerPage]     = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!query.trim()) {
      setAllProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setAllProducts([]);

    // Fetch all pages: start with page 1, then fetch remaining if needed
    const fetchAllPages = async () => {
      try {
        const firstRes = await axios.get(
          `${API_BASE_URL}/products/search?query=${encodeURIComponent(query.trim())}&page=1`,
          { headers: { Accept: 'application/json' } }
        );

        const body      = firstRes.data;
        const pageData  = body?.data;
        if (!pageData) { setAllProducts([]); return; }

        let items     = pageData.data ?? [];
        const lastPage = pageData.last_page ?? 1;

        // If there are more pages, fetch them all in parallel
        if (lastPage > 1) {
          const pageNumbers = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
          const rest = await Promise.all(
            pageNumbers.map((p) =>
              axios
                .get(`${API_BASE_URL}/products/search?query=${encodeURIComponent(query.trim())}&page=${p}`, {
                  headers: { Accept: 'application/json' },
                })
                .then((r) => r.data?.data?.data ?? [])
                .catch(() => [])
            )
          );
          rest.forEach((pageItems) => { items = items.concat(pageItems); });
        }

        setAllProducts(items);
      } catch {
        setError('Failed to load search results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllPages();
  }, [query]);

  // ── Sorting ───────────────────────────────────────────────────
  const sorted = [...allProducts].sort((a, b) => {
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

  const title = query.trim()
    ? `Search results for "${query}"`
    : 'Search Results';

  return (
    <main className="ccat-page">
      <Container className="container-1500 py-3">

        {/* ── Breadcrumb + Back ── */}
        <div className="ccat-page__topbar d-flex align-items-center justify-content-between mb-3">
          <nav aria-label="breadcrumb">
            <ol className="ccat-page__breadcrumb">
              <li className="ccat-page__bc-item">
                <Link to="/">Home</Link>
              </li>
              <li className="ccat-page__bc-item">
                <span className="ccat-page__bc-sep">&gt;</span>
                <span className="ccat-page__bc-active">Search: {query}</span>
              </li>
            </ol>
          </nav>
          <Link to="/" className="ccat-page__back-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back To Home
          </Link>
        </div>

        {/* ── Title ── */}
        <h1 className="ccat-page__title">{title}</h1>

        {/* ── Empty query ── */}
        {!query.trim() && (
          <div className="text-center py-5 text-muted">
            <p>Please enter a search term to find products.</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* ── Filter bar ── */}
        {!loading && !error && query.trim() && (
          <div className="ccat-page__filter-bar d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
            <p className="ccat-page__count mb-0">
              Showing {sorted.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + perPage, sorted.length)} of {sorted.length} products
            </p>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <div className="ccat-page__select-wrap">
                <label className="ccat-page__select-label">Sort by:</label>
                <select className="ccat-page__select" value={sortBy} onChange={(e) => handleSort(e.target.value)}>
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="ccat-page__select-wrap">
                <label className="ccat-page__select-label">Per page:</label>
                <select className="ccat-page__select" value={perPage} onChange={(e) => handlePerPage(e.target.value)}>
                  {PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} per page</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Product Grid ── */}
        {loading ? (
          <div className="ccat-page__skeleton-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="ccat-page__skeleton-card">
                <div className="ccat-page__skeleton-img skeleton-pulse" />
                <div className="ccat-page__skeleton-body">
                  <div className="skeleton-pulse" style={{ height: 12, width: '85%', marginBottom: 6 }} />
                  <div className="skeleton-pulse" style={{ height: 12, width: '55%', marginBottom: 6 }} />
                  <div className="skeleton-pulse" style={{ height: 18, width: '40%', marginBottom: 8 }} />
                  <div className="d-flex gap-2">
                    <div className="skeleton-pulse" style={{ height: 30, flex: 1 }} />
                    <div className="skeleton-pulse" style={{ height: 30, flex: 1 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !error && query.trim() && paginated.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>No products found for "<strong>{query}</strong>". Try a different search term.</p>
          </div>
        ) : !error && query.trim() && (
          <Row className="g-3">
            {paginated.map((product) => (
              <Col key={product.id} xs={6} sm={4} md={3}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="ccat-page__pagination-wrap d-flex align-items-center justify-content-between flex-wrap gap-3 mt-4">
            <div className="ccat-page__pagination d-flex align-items-center gap-1">
              <button
                className="ccat-page__page-btn ccat-page__page-btn--arrow"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
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

      </Container>
    </main>
  );
};

export default SearchResultsPage;