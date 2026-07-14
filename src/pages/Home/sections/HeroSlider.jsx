import React, { memo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PLACEHOLDER_IMG, BASE_IMAGE_URL } from '../../../utils';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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

const AUTOPLAY_MS = 5000;

// ── Main Component ────────────────────────────────────────────────
const HeroSlider = ({ banners = [] }) => {
  const total = banners.length;
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback((idx) => {
    setActiveIndex((idx + total) % total);
  }, [total]);

  const goNext = useCallback(() => setActiveIndex((i) => (i + 1) % total), [total]);
  const goPrev = useCallback(() => setActiveIndex((i) => (i - 1 + total) % total), [total]);

  // Autoplay — only when more than 1 slide
  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [goNext, total]);

  if (!banners || total === 0) return null;

  return (
    <section
      className="hero-slider"
      aria-label="Featured promotions"
      role="region"
    >
      <div className="hero-slider__swiper">
        {banners.map((slide, idx) => {
          const isActive = idx === activeIndex;
          const imageUrl = getImageUrl(slide.image);

          return (
            <article
              key={slide.id ?? idx}
              className={`hero-slider__slide${slide.light ? ' hero-slider__slide--light' : ''}${isActive ? ' is-active' : ''}`}
              style={{ display: isActive ? 'flex' : 'none' }}
              aria-hidden={!isActive}
            >
              <div className={`hero-slider__zoom${isActive ? ' is-zooming' : ''}`} aria-hidden="true">
                <img
                  src={imageUrl}
                  alt=""
                  className="hero-slider__img"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  decoding={idx === 0 ? 'sync' : 'async'}
                  sizes="100vw"
                />
              </div>

              <div className="hero-slider__overlay" aria-hidden="true" />

              <div className={`hero-slider__content${isActive ? ' is-visible' : ''}`}>
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
                    <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {total > 1 && (
        <>
          {/* <button
            type="button"
            className="hero-btn hero-btn--prev"
            onClick={goPrev}
            aria-label="Previous slide"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            className="hero-btn hero-btn--next"
            onClick={goNext}
            aria-label="Next slide"
          >
            <ChevronRight />
          </button> */}

          <div className="hero-dots" role="tablist" aria-label="Slide navigation">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`hero-dots__dot${idx === activeIndex ? ' hero-dots__dot--active' : ''}`}
                onClick={() => goTo(idx)}
                role="tab"
                aria-selected={idx === activeIndex}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default memo(HeroSlider);