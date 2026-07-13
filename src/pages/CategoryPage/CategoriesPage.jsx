import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './CategoriesPage.scss';
import { useHomeData } from '../Home/useHomeData';
import { BASE_IMAGE_URL, PLACEHOLDER_IMG } from '../../utils';

const CategoryCard = ({ cat }) => {
  const src   = cat.image ? `${BASE_IMAGE_URL}${cat.image}` : PLACEHOLDER_IMG;
  const label = cat.label || cat.name || 'Category';

  return (
    // ✅ FIXED: /categories/ so it matches the SubCategories route in AppRoutes
    <Link to={`/categories/${cat.slug}`} className="cat-card">
      <div className="cat-card__img-wrap">
        <img
          src={src}
          alt={label}
          className="cat-card__img"
          loading="lazy"
          onError={(e) => { e.target.src = PLACEHOLDER_IMG; e.target.onerror = null; }}
        />
        <div className="cat-card__overlay" />
      </div>
      <p className="cat-card__label">{label}</p>
    </Link>
  );
};

const CategoriesMobilePage = () => {
  const { data, loading } = useHomeData();
  const categories = data?.featuredCategories || [];
  if (!loading && categories.length === 0) return null;

  if (loading) return (
    <section className="featured-cats section-wrapper">
      <Container className="container-1500 featured-cats__container">
        <div className="featured-cats__heading">
          <span className="featured-cats__heading-line" />
          <h2 className="featured-cats__heading-text">CATEGORY</h2>
          <span className="featured-cats__heading-line" />
        </div>
        <div className="featured-cats__grid">
          <div className="featured-cats__row featured-cats__row--tall">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="cat-card cat-card--loading">
                <div className="cat-card__img-wrap" style={{ aspectRatio: '1/1' }} />
                <p className="cat-card__label" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );

  return (
    <section className="featured-cats section-wrapper">
      <Container className="container-1500 featured-cats__container">
        <div className="featured-cats__heading">
          <span className="featured-cats__heading-line" />
          <h2 className="featured-cats__heading-text">CATEGORY</h2>
          <span className="featured-cats__heading-line" />
        </div>
        <div className="featured-cats__grid">
          {Array.from({ length: Math.ceil(categories.length / 2) }, (_, i) =>
            categories.slice(i * 2, i * 2 + 2)
          ).map((rowCats, rowIdx) => (
            <div key={rowIdx} className="featured-cats__row featured-cats__row--tall">
              {rowCats.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} />
              ))}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default CategoriesMobilePage;