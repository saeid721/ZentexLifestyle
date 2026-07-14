import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './CategoriesPage.scss';
import { useHomeData } from '../Home/useHomeData';
import { BASE_IMAGE_URL, PLACEHOLDER_IMG } from '../../utils';

const CATEGORIES_PER_ROW = 5; // ✅ matches desktop column count

const CategoryCard = ({ cat }) => {
  const [loaded, setLoaded] = useState(false);
  const src   = cat.image ? `${BASE_IMAGE_URL}${cat.image}` : PLACEHOLDER_IMG;
  const label = cat.label || cat.name || 'Category';

  return (
    <Link to={`/categories/${cat.slug}`} className="cat-card">
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className="cat-card cat-card--loading">
                <div className="cat-card__img-wrap" style={{ aspectRatio: '4/5' }} />
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
          {Array.from(
            { length: Math.ceil(categories.length / CATEGORIES_PER_ROW) },
            (_, i) => categories.slice(i * CATEGORIES_PER_ROW, i * CATEGORIES_PER_ROW + CATEGORIES_PER_ROW)
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