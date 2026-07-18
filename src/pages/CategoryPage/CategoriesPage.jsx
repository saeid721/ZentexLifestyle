import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './CategoriesPage.scss';
import { useHomeData } from '../Home/useHomeData';
import { BASE_IMAGE_URL, PLACEHOLDER_IMG } from '../../utils';
import Reveal from '../../components/ui/Reveal/Reveal';
import { LayoutGrid } from 'lucide-react';

const CATEGORIES_PER_ROW = 5; // ✅ matches desktop column count

const CategoryCard = ({ cat, index = 0 }) => {
  const [loaded, setLoaded] = useState(false);
  const src   = cat.image ? `${BASE_IMAGE_URL}${cat.image}` : PLACEHOLDER_IMG;
  const label = cat.label || cat.name || 'Category';

  return (
    <Reveal as={Link} to={`/categories/${cat.slug}`} type="fade-up" delay={(index % CATEGORIES_PER_ROW) * 80} className="cat-card">
      <div className="cat-card__img-wrap">
        <img
          src={src}
          alt={label}
          className={`cat-card__img${loaded ? ' cat-card__img--loaded' : ''}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; e.target.onerror = null; setLoaded(true); }}
        />
        <div className="cat-card__overlay" />
        <p className="cat-card__label">{label}</p>
      </div>
    </Reveal>
  );
};

const CategoriesPage = () => {
  const { data, loading } = useHomeData();
  const categories = data?.featuredCategories || [];

  if (loading) return (
    <section className="featured-cats section-wrapper">
      <Container className="container-1500 featured-cats__container">
        <div className="featured-cats__heading">
          <span className="featured-cats__heading-line" />
          <h2 className="featured-cats__heading-text">Product Categories</h2>
          <span className="featured-cats__heading-line" />
        </div>
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