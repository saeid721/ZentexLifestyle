// src/pages/CategoryPage/CatagoryProductPage.jsx
import SEO from '../../components/SEO';
import React, { useState, useEffect, useMemo } from 'react'; // ✅ LINE 2: added useMemo
import { useParams, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import { API_BASE_URL, getSiteBaseUrl, SCHEMA_ORG_URL, SCHEMA_ORG_IN_STOCK } from '../../config/env';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Reveal from '../../components/ui/Reveal/Reveal';
import './CatagoryProductPage.scss';

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

const CatagoryProductPage = () => {
  const { catSlug, subSlug } = useParams();
  const location = useLocation();

  const isSubcategory = !!(catSlug && subSlug && subSlug !== 'all');

  const [categoryName,    setCategoryName]    = useState('');
  const [subcategoryName, setSubcategoryName] = useState('');
  const [allProducts,     setAllProducts]     = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [sortBy,          setSortBy]          = useState('default');
  const [perPage,         setPerPage]         = useState(25);
  const [currentPage,     setCurrentPage]     = useState(1);

  useEffect(() => {
    if (!catSlug) return;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setCategoryName('');
    setSubcategoryName('');
    setAllProducts([]);

    const endpoint = isSubcategory
      ? `${API_BASE_URL}/subcategory/${catSlug}/${subSlug}`
      : `${API_BASE_URL}/category/${catSlug}`;

    axios
      .get(endpoint)
      .then((res) => {
        const body = res.data;
        if (body?.status) {
          if (body.category?.name) {
            setCategoryName(body.category.name);
          } else {
            setCategoryName(catSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
          }
          if (isSubcategory && body.subcategory?.subcategoryName) {
            setSubcategoryName(body.subcategory.subcategoryName);
          }
          setAllProducts(Array.isArray(body.products) ? body.products : []);
        } else {
          setError('Category not found.');
        }
      })
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catSlug, subSlug, isSubcategory]);

  const title = isSubcategory && subcategoryName
    ? subcategoryName
    : categoryName || catSlug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'PRODUCTS';

  const breadcrumbCategory = categoryName
    || catSlug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // ── ✅ LINE 72: URL helpers ───────────────────────────────────
  const baseUrl      = getSiteBaseUrl();
  const canonicalUrl = isSubcategory
    ? `${baseUrl}/categories/${catSlug}/${subSlug}`
    : `${baseUrl}/categories/${catSlug}`;

  // ── ✅ LINE 77: ogImage — first product image or fallback ─────
  const ogImage = useMemo(() => {
    const img = allProducts[0]?.image;
    if (!img) return `${baseUrl}/og-default.jpg`;
    return img.startsWith('http') ? img : `${baseUrl}${img}`;
  }, [allProducts, baseUrl]);

  // ── ✅ LINE 83: JSON-LD — BreadcrumbList ──────────────────────
  const breadcrumbSchema = useMemo(() => ({
    '@context': SCHEMA_ORG_URL,
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      ...(isSubcategory || subSlug === 'all'
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: breadcrumbCategory,
              item: `${baseUrl}/categories/${catSlug}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: isSubcategory ? title : 'All Products',
              item: canonicalUrl,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 2,
              name: title,
              item: canonicalUrl,
            },
          ]),
    ],
  }), [baseUrl, isSubcategory, subSlug, breadcrumbCategory, catSlug, title, canonicalUrl]);

  // ── ✅ LINE 111: JSON-LD — CollectionPage ─────────────────────
  const collectionPageSchema = useMemo(() => ({
    '@context': SCHEMA_ORG_URL,
    '@type': 'CollectionPage',
    name: `${title} | Zentex`,
    description: `Buy ${title} online in Bangladesh. Best price and latest collection available.`,
    url: canonicalUrl,
    breadcrumb: breadcrumbSchema,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: allProducts.length,
      name: title,
    },
  }), [title, canonicalUrl, breadcrumbSchema, allProducts.length]);

  // ── ✅ LINE 124: JSON-LD — ItemList (only after products load) 
  const itemListSchema = useMemo(() => {
    if (loading || allProducts.length === 0) return null;
    return {
      '@context': SCHEMA_ORG_URL,
      '@type': 'ItemList',
      name: title,
      description: `Shop ${title} in Bangladesh. Best prices and latest collection.`,
      url: canonicalUrl,
      numberOfItems: allProducts.length,
      itemListElement: allProducts.slice(0, 50).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name || '',
          url: `${baseUrl}/product/${product.slug || product.id}`,
          // ✅ IMAGE SEO: ImageObject per product for Google Image search
          image: product.image
            ? {
                '@type': 'ImageObject',
                url: product.image.startsWith('http')
                  ? product.image
                  : `${baseUrl}${product.image}`,
                name: product.name || title,
                description: `Image of ${product.name || title} at Zentex`,
              }
            : undefined,
          offers: {
            '@type': 'Offer',
            price: product.new_price ?? product.price ?? 0,
            priceCurrency: 'BDT',
            availability: SCHEMA_ORG_IN_STOCK,
            url: `${baseUrl}/product/${product.slug || product.id}`,
          },
        },
      })),
    };
  }, [loading, allProducts, title, canonicalUrl, baseUrl]);

  // ── Sorting ───────────────────────────────────────────────────
  const sorted = [...allProducts].sort((a, b) => {
    const aPrice = a.new_price ?? a.price ?? 0;
    const bPrice = b.new_price ?? b.price ?? 0;

    if (sortBy === 'price_asc')  return aPrice - bPrice;
    if (sortBy === 'price_desc') return bPrice - aPrice;
    if (sortBy === 'name_asc')   return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name_desc')  return (b.name || '').localeCompare(a.name || '');
    
    if (sortBy === 'date_asc') {
      const aDate = a.created_at || a.createdAt || a.date || a.publishedAt || a.created_date || a.date_added || '';
      const bDate = b.created_at || b.createdAt || b.date || b.publishedAt || b.created_date || b.date_added || '';
      return new Date(aDate) - new Date(bDate);
    }
    if (sortBy === 'date_desc') {
      const aDate = a.created_at || a.createdAt || a.date || a.publishedAt || a.created_date || a.date_added || '';
      const bDate = b.created_at || b.createdAt || b.date || b.publishedAt || b.created_date || b.date_added || '';
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

      {/* ✅ LINE 197: SEO — passes canonical, ogImage, keywords */}
      <SEO
        title={`${title} | Zentex`}
        description={`Buy ${title} online in Bangladesh. Best price and latest collection available.`}
        canonical={canonicalUrl}
        ogImage={ogImage}
        ogType="website"
        keywords={`${title}, buy online Bangladesh, Zentex`}
        // ✅ structured data injected via SEO component's Helmet
        schemas={[breadcrumbSchema, collectionPageSchema, ...(itemListSchema ? [itemListSchema] : [])]}
      />

      <Container className="container-1500 py-3">

        {/* ── Breadcrumb + Back ── */}
        <div className="ccat-page__topbar d-flex align-items-center justify-content-between mb-3">
         <nav aria-label="breadcrumb">
            <ol className="ccat-page__breadcrumb">
              <li className="ccat-page__bc-item">
                <Link to="/">Home</Link>
              </li>
              {isSubcategory || subSlug === 'all' ? (
                <>
                  <li className="ccat-page__bc-item">
                    <span className="ccat-page__bc-sep">&gt;</span>
                    <Link to={`/categories/${catSlug}`}>{breadcrumbCategory}</Link>
                  </li>
                  <li className="ccat-page__bc-item">
                    <span className="ccat-page__bc-sep">&gt;</span>
                    <span className="ccat-page__bc-active">{isSubcategory ? title : 'All Products'}</span>
                  </li>
                </>
              ) : (
                <li className="ccat-page__bc-item">
                  <span className="ccat-page__bc-sep">&gt;</span>
                  <span className="ccat-page__bc-active">{title}</span>
                </li>
              )}
            </ol>
          </nav>
          <Link to={isSubcategory ? `/categories/${catSlug}` : subSlug === 'all' ? `/categories/${catSlug}` : '/'}
            className="ccat-page__back-btn">
            <ChevronLeft size={14} strokeWidth={2} />
            {isSubcategory || subSlug === 'all' ? 'Back To Category' : 'Back To Home'}
          </Link>
        </div>

        {/* ── Title ── */}
        <Reveal as="h1" type="fade-up" className="ccat-page__title">{title}</Reveal>

        {/* ── Error ── */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* ── Filter bar ── */}
        {!loading && !error && (
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
        ) : !error && paginated.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p>No products found in this {isSubcategory ? 'subcategory' : 'category'}.</p>
          </div>
        ) : !error && (
          <Row className="g-3">
            {paginated.map((product, idx) => (
              <Col key={product.id} xs={6} sm={4} md={3}>
                <Reveal type="fade-up" delay={(idx % 8) * 70}>
                  <ProductCard product={product} />
                </Reveal>
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

      </Container>
    </main>
  );
};

export default CatagoryProductPage;