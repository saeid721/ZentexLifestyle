import React, { memo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import Reveal from '../../components/ui/Reveal/Reveal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const RelatedProductsSection = memo(({ relatedProducts }) => {
  if (!relatedProducts || relatedProducts.length === 0) {
    return null;
  }

  return (
    <div className="pdp__more-section mt-5">
      <Reveal as="h2" type="fade-up" className="pdp__more-title">
        RELATED PRODUCTS
      </Reveal>
      <div className="pdp__more-swiper-wrap">
        <button
          className="pdp__nav-btn pdp__nav-btn--more pdp__nav-btn--more-prev"
          aria-label="Previous products"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        <button
          className="pdp__nav-btn pdp__nav-btn--more pdp__nav-btn--more-next"
          aria-label="Next products"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            prevEl: '.pdp__nav-btn--more-prev',
            nextEl: '.pdp__nav-btn--more-next',
          }}
          autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          loop={relatedProducts.length > 2}
          spaceBetween={16}
          slidesPerView={2}
          breakpoints={{
            576: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            992: { slidesPerView: 4 },
          }}
          className="pdp__more-swiper"
        >
          {relatedProducts.map((rp, idx) => (
            <SwiperSlide key={rp.id}>
              <Reveal type="fade-up" delay={(idx % 4) * 90}>
                <ProductCard product={rp} />
              </Reveal>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
});

RelatedProductsSection.displayName = 'RelatedProductsSection';

export default RelatedProductsSection;
