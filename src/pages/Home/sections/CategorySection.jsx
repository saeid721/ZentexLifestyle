// src/pages/Home/sections/CategorySection.jsx
import React from 'react';
import { Container } from 'react-bootstrap';
import SectionHeader from '../../../components/ui/SectionHeader/SectionHeader';
import ProductGrid from '../../../components/ui/ProductGrid/ProductGrid';
import { SkeletonProductGrid } from '../../../components/ui/Skeleton';
import Reveal from '../../../components/ui/Reveal/Reveal';


const CategorySection = ({ title, catSlug, loading = false, products = [] }) => {
  const limitedProducts = products.slice(0, 4);

  if (loading) return <SkeletonProductGrid count={12} cols={4} />;

  return (
    <section className="section-wrapper">
      <Container className="container-1500">
        <Reveal type="fade-up">
          <SectionHeader title={title} catSlug={catSlug} />
        </Reveal>
        <Reveal type="fade-up" delay={100}>
          <ProductGrid products={limitedProducts} loading={false} cols={4} />
        </Reveal>
      </Container>
    </section>
  );
};

export default CategorySection;
