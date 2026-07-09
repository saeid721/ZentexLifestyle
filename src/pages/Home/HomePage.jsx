// src/pages/Home/HomePage.jsx
import SEO from '../../components/SEO';
import React, { Suspense, lazy } from 'react';
import HeroSlider         from './sections/HeroSlider';
import RevealSection      from '../../components/ui/RevealSection/RevealSection';
import { useHomeData }    from './useHomeData';
import './HomePage.scss';

const TrustBar = lazy(() => import('./sections/TrustBar'));
const FeaturedCategories = lazy(() => import('./sections/FeaturedCategories'));
const NewArrivalsSlider = lazy(() => import('./sections/NewArrivalsSlider'));
const CategorySection = lazy(() => import('./sections/CategorySection'));

const HomePage = () => {
  const { data, loading } = useHomeData();


  return (
    <main className="home-page">
      <SEO
        title="Elonis | Premium Sneakers in Bangladesh"
        description="Discover top sneakers, apparel, and accessories with best price in Bangladesh."
        url={window.location.href}
      />

      {/* 1. Hero — loading হলে simple pulse box */}
      <RevealSection>
        <HeroSlider
          banners={data?.banners || []}
          loading={false}
        />
      </RevealSection>

      <Suspense fallback={null}>
        {/* 2. New Arrivals — loading prop পাঠাও */}
        <RevealSection>
          <NewArrivalsSlider
            title="NEW ARRIVALS"
            viewAllLink="/new-arrivals"
            products={data?.new_arrivals || []}
            loading={loading}
          />
        </RevealSection>

        {/* 3. Featured Categories */}
        <RevealSection>
          <FeaturedCategories categories={data?.featuredCategories || []} />
        </RevealSection>

        {/* 4-N. Category sections */}
        {(data?.categories || []).map((cat) => (
          <RevealSection key={cat.id}>
            <CategorySection
              title={cat.name.toUpperCase()}
              catSlug={cat.slug}
              products={cat.homeproducts || []}
              loading={loading}
            />
          </RevealSection>
        ))}

        {data?.key_features?.length > 0 && (
          <RevealSection>
            <TrustBar features={data.key_features} />
          </RevealSection>
        )}
      </Suspense>
    </main>
  );
};

export default HomePage;
