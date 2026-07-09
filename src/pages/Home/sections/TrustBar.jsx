import React, { useRef, useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import './TrustBar.scss';

// Icon map for Font Awesome class names → emoji fallback
const ICON_MAP = {
  'fas fa-truck':        '🚚',
  'fas fa-exchange-alt': '🔄',
  'fas fa-lock':         '🔒',
};

const getIcon = (iconClass) => ICON_MAP[iconClass] ?? '✅';

const TrustBar = ({ features = [] }) => {
  // 🚫 Don't render if no backend data
  if (!features || features.length === 0) {
    return null;
  }

  const sliderRef  = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const slider = sliderRef.current;
    if (!slider) return;
    const index = Math.round(slider.scrollLeft / slider.offsetWidth);
    setActiveIndex(index);
  };

  // Auto-slide on mobile
  useEffect(() => {
    const interval = setInterval(() => {
      const slider = sliderRef.current;
      if (!slider) return;
      const nextIndex = (activeIndex + 1) % features.length;
      slider.scrollTo({ left: nextIndex * slider.offsetWidth, behavior: 'smooth' });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIndex, features.length]);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.addEventListener('scroll', handleScroll);
    return () => slider.removeEventListener('scroll', handleScroll);
  }, []);

  const goToSlide = (index) => {
    const slider = sliderRef.current;
    if (!slider) return;
    slider.scrollTo({ left: index * slider.offsetWidth, behavior: 'smooth' });
  };

  return (
    <div className="trust-bar">
      <Container fluid="xl">

        {/* Desktop */}
        <div className="trust-bar__desktop d-none d-sm-flex">
          {features.map((f) => (
            <div key={f.id} className="trust-bar__item">
              <span className="trust-bar__icon">{getIcon(f.icon)}</span>
              <div>
                <p className="trust-bar__title">{f.title}</p>
                <p className="trust-bar__sub">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile */}
        <div className="trust-bar__mobile d-sm-none">
          <div className="trust-bar__slider" ref={sliderRef}>
            {features.map((f) => (
              <div key={f.id} className="trust-bar__slide">
                <div className="trust-bar__item">
                  <span className="trust-bar__icon">{getIcon(f.icon)}</span>
                  <div>
                    <p className="trust-bar__title">{f.title}</p>
                    <p className="trust-bar__sub">{f.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="trust-bar__dots">
            {features.map((_, i) => (
              <span
                key={i}
                onClick={() => goToSlide(i)}
                className={`trust-bar__dot ${activeIndex === i ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

      </Container>
    </div>
  );
};

export default TrustBar;