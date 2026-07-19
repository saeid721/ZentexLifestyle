import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { apiGet } from '../../../utils/api';
import { BASE_IMAGE_URL, PLACEHOLDER_IMG } from '../../../utils';
import Reveal from '../../../components/ui/Reveal/Reveal';
import OptimizedImage from '../../../components/ui/OptimizedImage';
import './FeaturedCategories.scss';

const CategoryCard = ({ cat, index = 0 }) => {
  const src   = cat.image ? `${BASE_IMAGE_URL}${cat.image}` : PLACEHOLDER_IMG;
  const label = cat.label || cat.name || 'Category';

  const hasSubcategories = Array.isArray(cat.subcategories) && cat.subcategories.length > 0;
  const cardHref = hasSubcategories ? `/categories/${cat.slug}` : `/products/${cat.slug}`;

  return (
    <Reveal as={Link} to={cardHref} type="fade-up" delay={(index % 5) * 80} className="cat-card">
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

const FeaturedCategories = () => {
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

  if (loading || categories.length === 0) return null;

  return (
    <section className="featured-cats section-wrapper">
      <Container className="container-1500 featured-cats__container">
        <Reveal type="fade-up" className="featured-cats__heading">
          <span className="featured-cats__heading-line" />
          <h2 className="featured-cats__heading-text">Product Categories</h2>
          <span className="featured-cats__heading-line" />
        </Reveal>

        <div className="featured-cats__grid featured-cats__grid--flat">
          {categories.map((cat, idx) => (
            <CategoryCard key={cat.id} cat={cat} index={idx} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeaturedCategories;