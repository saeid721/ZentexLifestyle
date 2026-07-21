import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './CategoriesPage.scss';
import { apiGet } from '../../utils/api';
import { BASE_IMAGE_URL, PLACEHOLDER_IMG } from '../../utils';
import Reveal from '../../components/ui/Reveal/Reveal';
import OptimizedImage from '../../components/ui/OptimizedImage';
import { LayoutGrid } from 'lucide-react';

const CATEGORIES_PER_ROW = 5; // ✅ matches desktop column count

const CategoryCard = ({ cat, index = 0 }) => {
  const src   = cat.image ? `${BASE_IMAGE_URL}${cat.image}` : PLACEHOLDER_IMG;
  const label = cat.label || cat.name || 'Category';

  const hasSubcategories = Array.isArray(cat.subcategories) && cat.subcategories.length > 0;
  const cardHref = hasSubcategories ? `/categories/${cat.slug}` : `/products/${cat.slug}`;

  return (
    <Reveal as={Link} to={cardHref} type="fade-up" delay={(index % CATEGORIES_PER_ROW) * 80} className="cat-card">
      <div className="cat-card__img-wrap">
        <OptimizedImage
          src={src}
          alt={label}
          className="cat-card__img"
          fallbackSrc={PLACEHOLDER_IMG}
          loading={index < 3 ? 'eager' : 'lazy'}
          decoding={index < 3 ? 'sync' : 'async'}
          fetchPriority={index === 0 ? 'high' : 'auto'}
          eager={index < 3}
          width={480}
          height={600}
          wrapperStyle={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <div className="cat-card__overlay" />
        <p className="cat-card__label">{label}</p>
      </div>
    </Reveal>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet('/categories')
      .then((res) => {
        if (cancelled) return;
        setCategories(Array.isArray(res.data?.data) ? res.data.data : []);
      })
      .catch(() => { if (!cancelled) setCategories([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <section className="featured-cats section-wrapper">
      <Container className="container-1500 featured-cats__container">
        <div className="featured-cats__grid featured-cats__grid--flat">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="cat-card cat-card--loading">
              <div className="cat-card__img-wrap" style={{ aspectRatio: '4/5' }} />
              <p className="cat-card__label" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );

  return (
    <section className="featured-cats">
      <div className="hero-section">
        <Container className="container-1500">
          <Reveal as="h1" type="fade-up" className="hero-section__title">Categories</Reveal>
          <nav aria-label="breadcrumb">
            <ol className="hero-section__breadcrumb">
              <li><Link to="/">Home</Link></li>
              <li><span className="hero-section__sep">&gt;</span><span>Categories</span></li>
            </ol>
          </nav>
        </Container>
      </div>
      <Container className="container-1500 featured-cats__container ">
        {categories.length === 0 ? (
          <div className="categories-empty">
            <LayoutGrid size={56} strokeWidth={1.5} className="categories-empty__icon" />
            <p className="categories-empty__title">
              <span className="categories-empty__title-highlight">Categories</span> not found.
            </p>
            <p className="categories-empty__desc">
              No categories are available right now. Please check back later.
            </p>
            <Link to="/" className="categories-empty__btn">
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="featured-cats__grid featured-cats__grid--flat">
            {categories.map((cat, idx) => (
              <CategoryCard key={cat.id} cat={cat} index={idx} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};

export default CategoriesPage;