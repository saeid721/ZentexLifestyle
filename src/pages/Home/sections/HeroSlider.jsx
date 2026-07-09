import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { PLACEHOLDER_IMG, BASE_IMAGE_URL } from '../../../utils';
import '../../../components/ui/Skeleton/Skeleton.css';
import './HeroSlider.scss';

// ── Helper: Resolve image URL ─────────────────────────────────────
const getImageUrl = (rawImage) => {
  if (!rawImage) return PLACEHOLDER_IMG;
  if (/^https?:\/\//i.test(rawImage)) return rawImage;
  const base = (BASE_IMAGE_URL || '').replace(/\/+$/, '');
  const path = rawImage.replace(/^\/+/, '');
  return `${base}/${path}`;
};

// ── Helper: Should render CTA ─────────────────────────────────────
const shouldRenderCTA = (slide) =>
  !!(slide?.btn_text?.trim() && slide?.link?.trim());

// ── Helper: Should render description ────────────────────────────
const shouldRenderDescription = (slide) =>
  !!(slide?.description?.trim());

// ── Main Component ────────────────────────────────────────────────
const HeroSlider = ({ banners = [] }) => {
  if (!banners || banners.length === 0) return null;
  const slide = banners[0];
  const imageUrl = getImageUrl(slide.image);

  return (
    <section
      className="hero-slider"
      aria-label="Featured promotions"
      role="region"
    >
      <article
        className={`hero-slider__slide${slide.light ? ' hero-slider__slide--light' : ''} is-active`}
      >
        <div className="hero-slider__zoom" aria-hidden="true">
          <img
            src={imageUrl}
            alt=""
            className="hero-slider__img"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            sizes="100vw"
          />
        </div>

        <div className="hero-slider__overlay" aria-hidden="true" />

        <div className="hero-slider__content is-visible">
          {slide.title && (
            <h2 className="hero-slider__title">{slide.title}</h2>
          )}

          {slide.titleEn && (
            <p className="hero-slider__title-en">{slide.titleEn}</p>
          )}

          {shouldRenderDescription(slide) && (
            <p className="hero-slider__subtitle">{slide.description}</p>
          )}

          {shouldRenderCTA(slide) && (
            <Link
              to={slide.link}
              className="hero-slider__cta"
              style={{ '--cta-bg': slide.accent || '#FF6503' }}
            >
              <span>{slide.btn_text}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          )}
        </div>
      </article>

    </section>
  );
};

export default memo(HeroSlider);
