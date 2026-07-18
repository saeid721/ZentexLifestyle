// src/pages/CategoryPage/CatagoryProductPage.jsx

import SEO from '../../components/SEO';
import React, { useState, useEffect, useMemo } from 'react'; // ✅ LINE 2: added useMemo
import { useParams, Link, useLocation } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import ProductGrid from '../../components/ui/ProductGrid/ProductGrid';
import ProductToolbar from '../../components/ui/ProductToolbar/ProductToolbar';
import { API_BASE_URL, getSiteBaseUrl, SCHEMA_ORG_URL, SCHEMA_ORG_IN_STOCK } from '../../config/env';
import FilterDrawer from '../../components/ui/FilterDrawer/FilterDrawer';
import { ChevronLeft, ChevronRight, PackageOpen } from 'lucide-react';
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
  const [viewCols,        setViewCols]        = useState(5);
  const [showFilter,      setShowFilter]      = useState(false);
  const [priceBounds,     setPriceBounds]     = useState({ min: 0, max: 20000 });
  const [filters,         setFilters]         = useState({
    categories: [],
    status: [],
    sizes: [],
    priceMin: 0,
    priceMax: 10000,
  });

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
          const productList = Array.isArray(body.products) ? body.products : [];
          setAllProducts(productList);

          // ✅ Dynamic price bounds from loaded category products
          if (productList.length > 0) {
            const prices = productList.map((p) => Number(p.new_price ?? p.price ?? 0));
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setPriceBounds({ min, max });
            setFilters((f) => ({ ...f, priceMin: min, priceMax: max }));
          } else {
            setPriceBounds({ min: 0, max: 10000 });
          }
        } else {
          setError('Category not found.');
        }
      })
      .catch(() => setError('Failed to load products. Please try again.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catSlug, subSlug, isSubcategory]);

  // ✅ Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  // ✅ Apply filters before sorting
  const filteredProducts = allProducts.filter((p) => {
    const price = p.new_price ?? p.price ?? 0;
    if (price < filters.priceMin || price > filters.priceMax) return false;

    if (filters.categories.length > 0) {
      const catSlug2 = p.category?.slug || p.subcategory?.slug;
      if (!filters.categories.includes(catSlug2)) return false;
    }

    if (filters.status.includes('on_sale')) {
      const hasDiscount = (p.old_price ?? 0) > (p.new_price ?? p.price ?? 0);
      if (!hasDiscount) return false;
    }

    if (filters.status.includes('new_arrivals') && !p.new_arrival) return false;

    if (filters.status.includes('pre_order') && !p.pre_order_status) return false;

    if (filters.status.includes('in_stock')) {
      const stock = Number(p.stock ?? 0);
      if (stock <= 0) return false;
    }

    if (filters.status.includes('out_of_stock')) {
      const stock = Number(p.stock ?? 0);
      if (stock > 0) return false;
    }

    return true;
  });

  // ── Sorting ───────────────────────────────────────────────────
  const sorted = [...filteredProducts].sort((a, b) => {
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
      
          <div className="hero-section">
            <Container className="container-1500">
              <Reveal as="h1" type="fade-up" className="hero-section__title">{title}</Reveal>
              <nav aria-label="breadcrumb">
                <ol className="hero-section__breadcrumb">
                  <li><Link to="/">Home</Link></li>
                  <li><span className="hero-section__sep">&gt;</span><span>{title}</span></li>
                </ol>
              </nav>
            </Container>
          </div>

      <Container className="container-1500 mt-4">

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
      </Container>
    </main>
  );
};

export default CatagoryProductPage;