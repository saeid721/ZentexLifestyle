import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { BASE_IMAGE_URL, PLACEHOLDER_IMG } from '../../../utils';
import Reveal from '../../../components/ui/Reveal/Reveal';
import './FeaturedCategories.scss';

const CategoryCard = ({ cat, index = 0 }) => {
  const [loaded, setLoaded] = useState(false);
  const src   = cat.image ? `${BASE_IMAGE_URL}${cat.image}` : PLACEHOLDER_IMG;
  const label = cat.label || cat.name || 'Category';

  return (
    <Reveal as={Link} to={`/categories/${cat.slug}`} type="fade-up" delay={(index % 5) * 80} className="cat-card">
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

const FeaturedCategories = ({ categories = [] }) => {
  if (!categories || categories.length === 0) return null;
  return (
    <section className="featured-cats section-wrapper">
      <Container className="container-1500 featured-cats__container">
        <Reveal type="fade-up" className="featured-cats__heading">
          <span className="featured-cats__heading-line" />
          <h2 className="featured-cats__heading-text">Product Categories</h2>
          <span className="featured-cats__heading-line" />
        </Reveal>

        <div className="featured-cats__grid">
          {Array.from({ length: Math.ceil(categories.length / 5) }, (_, i) =>
            categories.slice(i * 5, i * 5 + 5)
          ).map((rowCats, rowIdx) => (
            <div
              key={rowIdx}
              className="featured-cats__row featured-cats__row--tall"
            >
              {rowCats.map((cat, idx) => (
                <CategoryCard key={cat.id} cat={cat} index={rowIdx * 5 + idx} />
              ))}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeaturedCategories;