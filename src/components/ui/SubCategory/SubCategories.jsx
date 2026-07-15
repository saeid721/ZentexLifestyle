// src/components/ui/SubCategory/SubCategories.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { Helmet } from 'react-helmet-async';                    // ✅ LINE 4: Added
import SEO from '../../SEO';                                    // ✅ LINE 5: Added
import { PLACEHOLDER_IMG, BASE_IMAGE_URL, getSiteBaseUrl, SCHEMA_ORG_URL } from '../../../utils';
import { apiGet } from '../../../utils/api';
import './SubCategories.scss';

const resolveRawImage = (imageField) => {
  if (!imageField) return '';
  if (typeof imageField === 'string') return imageField;
  if (typeof imageField === 'object') {
    return imageField.image || imageField.url || imageField.path || '';
  }
  return '';
};

const buildImageUrl = (imageField) => {
  const rawImage = resolveRawImage(imageField);
  if (!rawImage) return PLACEHOLDER_IMG;
  if (/^https?:\/\//i.test(rawImage)) return rawImage;
  const base = (BASE_IMAGE_URL || '').replace(/\/+$/, '');
  const path = rawImage.replace(/^\/+/, '');
  return `${base}/${path}`;
};

// ─── SubCategory Card ────────────────────────────────────────────
const SubCategoryCard = ({ subCat, categorySlug, index = 0 }) => {
  const displayName = subCat.subcategoryName || subCat.name || '';
  const slug        = subCat.slug;
  const imageUrl    = buildImageUrl(subCat.image);
  const isAboveFold = index < 3;

  return (
    <Link
      to={`/categories/${categorySlug}/${slug}`}
      className="subcat-card"
      aria-label={`Browse ${displayName}`}  // ✅ LINE 38: aria-label for crawlers
    >
      <div className="subcat-card__image-wrap">
        {/* ✅ LINE 41: Added width, height + descriptive alt */}
        <img
          src={imageUrl}
          alt={`${displayName} category`}
          className="subcat-card__image"
          loading={isAboveFold ? 'eager' : 'lazy'}
          fetchpriority={index === 0 ? 'high' : 'auto'}
          decoding={isAboveFold ? 'sync' : 'async'}
          width="300"
          height="300"
          onError={(e) => {
            e.target.src     = PLACEHOLDER_IMG;
            e.target.onerror = null;
          }}
        />
        <div className="subcat-card__overlay">
          <h3 className="subcat-card__title">{displayName}</h3>
        </div>
      </div>
    </Link>
  );
};

// ─── All Products Card ───────────────────────────────────────────
const AllProductsCard = ({ categorySlug, categoryImage, categoryName }) => ( // ✅ LINE 62: Added categoryName prop
  <Link
    to={`/categories/${categorySlug}/all`}
    className="subcat-card"
    aria-label={`Browse all ${categoryName || ''} products`} // ✅ LINE 65: aria-label
  >
    <div className="subcat-card__image-wrap">
      {/* ✅ LINE 68: Added width, height + descriptive alt */}
      <img
        src={categoryImage || PLACEHOLDER_IMG}
        alt={`All ${categoryName || ''} products`}
        className="subcat-card__image"
        loading="eager"
        fetchpriority="high"
        decoding="sync"
        width="300"
        height="300"
        onError={(e) => {
          e.target.src     = PLACEHOLDER_IMG;
          e.target.onerror = null;
        }}
      />
      <div className="subcat-card__overlay">
        <h3 className="subcat-card__title">All Products</h3>
      </div>
    </div>
  </Link>
);

// ─── Main SubCategories Component ────────────────────────────────
const SubCategories = () => {
  const { catSlug } = useParams();
  const navigate    = useNavigate();

  const [category,      setCategory]      = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    if (!catSlug) return;

    setLoading(true);
    setError(null);
    setCategory(null);
    setSubcategories([]);

    apiGet('/categories')
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.data)) {
          const foundCategory = res.data.data.find((cat) => cat.slug === catSlug);

          if (!foundCategory) {
            setError('Category not found');
            return;
          }

          const subs = foundCategory.subcategories || [];
          setCategory(foundCategory);
          setSubcategories(subs);

          if (subs.length === 0) {
            navigate(`/categories/${catSlug}/all`, { replace: true });
          }
        } else {
          setError('Failed to load subcategories');
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Error fetching subcategories');
      })
      .finally(() => setLoading(false));
  }, [catSlug, navigate]);

  const sortedSubcategories = useMemo(() => {
    return [...subcategories].sort((a, b) =>
      (a.subcategoryName || a.name || '').localeCompare(
        b.subcategoryName || b.name || '',
        'en',
        { sensitivity: 'base' }
      )
    );
  }, [subcategories]);

  // ✅ LINE 140: URL + SEO data helpers ─────────────────────────
  const baseUrl      = getSiteBaseUrl();
  const canonicalUrl = `${baseUrl}/categories/${catSlug}`;
  const categoryName = category?.name || catSlug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '';
  const categoryImg  = category ? buildImageUrl(category.image) : '';
  const ogImage      = categoryImg !== PLACEHOLDER_IMG ? categoryImg : `${baseUrl}/og-default.jpg`;

  // ✅ LINE 146: BreadcrumbList JSON-LD ─────────────────────────
  const breadcrumbSchema = useMemo(() => ({
    '@context': SCHEMA_ORG_URL,
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',        item: baseUrl        },
      { '@type': 'ListItem', position: 2, name: categoryName,  item: canonicalUrl   },
    ],
  }), [baseUrl, categoryName, canonicalUrl]);

  // ✅ LINE 155: ItemList JSON-LD — one entry per subcategory ───
  const itemListSchema = useMemo(() => {
    if (!category || sortedSubcategories.length === 0) return null;

    const allProductsEntry = {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'ItemList',
        name: `All ${categoryName} Products`,
        url: `${baseUrl}/categories/${catSlug}/all`,
      },
    };

    const subEntries = sortedSubcategories.map((sub, i) => {
      const subImage = buildImageUrl(sub.image);
      return {
        '@type': 'ListItem',
        position: i + 2,
        item: {
          '@type': 'ItemList',
          name: sub.subcategoryName || sub.name || '',
          url: `${baseUrl}/categories/${catSlug}/${sub.slug}`,
          // ✅ IMAGE SEO: ImageObject per subcategory for Google Images
          image: subImage !== PLACEHOLDER_IMG
            ? {
                '@type': 'ImageObject',
                url: subImage,
                name: sub.subcategoryName || sub.name || '',
                description: `${sub.subcategoryName || sub.name || ''} products at Zentex`,
              }
            : undefined,
        },
      };
    });

    return {
      '@context': SCHEMA_ORG_URL,
      '@type': 'ItemList',
      name: categoryName,
      description: `Browse all ${categoryName} subcategories at Zentex Bangladesh.`,
      url: canonicalUrl,
      numberOfItems: sortedSubcategories.length + 1,
      itemListElement: [allProductsEntry, ...subEntries],
    };
  }, [category, sortedSubcategories, categoryName, baseUrl, catSlug, canonicalUrl]);

  // ✅ LINE 195: CollectionPage JSON-LD ─────────────────────────
  const collectionPageSchema = useMemo(() => {
    if (!category) return null;
    return {
      '@context': SCHEMA_ORG_URL,
      '@type': 'CollectionPage',
      name: `${categoryName} | Zentex`,
      description: `Shop ${categoryName} online in Bangladesh. Browse all subcategories at Zentex.`,
      url: canonicalUrl,
      // ✅ IMAGE SEO: Category image as ImageObject on the page schema
      image: categoryImg !== PLACEHOLDER_IMG
        ? {
            '@type': 'ImageObject',
            url: categoryImg,
            name: `${categoryName} category`,
            description: `${categoryName} products at Zentex Bangladesh`,
          }
        : undefined,
      breadcrumb: breadcrumbSchema,
      mainEntity: {
        '@type': 'ItemList',
        name: categoryName,
        numberOfItems: sortedSubcategories.length + 1,
      },
    };
  }, [category, categoryName, canonicalUrl, categoryImg, breadcrumbSchema, sortedSubcategories.length]);

  // ── Loading ───────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="subcats section-wrapper">
        <Container className="container-1500 subcats__container">
          <div className="subcats__loading">
            <div className="spinner-border" style={{ color: '#FF6503' }} role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  // ── Error ─────────────────────────────────────────────────────
  if (error || !category) {
    return (
      <section className="subcats section-wrapper">
        <Container className="container-1500 subcats__container">
          <div className="subcats__error">{error || 'Category not found'}</div>
        </Container>
      </section>
    );
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <section className="subcats section-wrapper">

      {/* ✅ LINE 245: SEO meta tags */}
      <SEO
        title={`${categoryName} | Zentex`}
        description={`Shop ${categoryName} online in Bangladesh. Browse all subcategories and latest products at Zentex.`}
        canonical={canonicalUrl}
        ogImage={ogImage}
        ogType="website"
        keywords={`${categoryName}, buy online Bangladesh, Zentex`}
        schemas={[breadcrumbSchema, ...(collectionPageSchema ? [collectionPageSchema] : []), ...(itemListSchema ? [itemListSchema] : [])]}
      />

    <Container className="container-1500 py-3">

      <nav aria-label="breadcrumb" className="subcats__breadcrumb-wrap">
        <ol className="subcats__breadcrumb">
          <li className="subcats__bc-item">
            <Link to="/">Home</Link>
          </li>
          <li className="subcats__bc-item">
            <span className="subcats__bc-sep">&gt;</span>
            <span className="subcats__bc-active">{category.name}</span>
          </li>
        </ol>
      </nav>

        <div className="subcats__page-title">
          <h1>{category.name}</h1>
        </div>

        <Row className="g-3 g-md-4">
          {/* All Products card */}
          <Col xs={6} sm={4} md={3} lg={3}>
            <AllProductsCard
              categorySlug={catSlug}
              categoryImage={buildImageUrl(category.image)}
              categoryName={category.name} // ✅ LINE 290: Pass categoryName for better alt text
            />
          </Col>

          {sortedSubcategories.map((subCat, i) => (
            <Col key={subCat.id} xs={6} sm={4} md={3} lg={3}>
              <SubCategoryCard
                subCat={subCat}
                categorySlug={catSlug}
                index={i}
              />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default SubCategories;