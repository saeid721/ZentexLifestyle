// src/pages/Home/sections/CategorySection.jsx
import React from 'react';
import { Container } from 'react-bootstrap';
import SectionHeader from '../../../components/ui/SectionHeader/SectionHeader';
import ProductGrid from '../../../components/ui/ProductGrid/ProductGrid';
import { SkeletonProductGrid } from '../../../components/ui/Skeleton'; // ← LINE 4: Loader import replace করো

/**
 * Generic category section for homepage.
 * Replaces SneakersSection, SandalSection, ApparelSection, AccessoriesSection.
 * Title and products come from the home API featuredCategories array.
 */
const CategorySection = ({ title, catSlug, loading = false, products = [] }) => {
  const limitedProducts = products.slice(0, 4);

  if (loading) return <SkeletonProductGrid count={12} cols={4} />; // ← LINE 18: Loader replace করো

  return (
    <section className="section-wrapper">
      <Container className="container-1500">
        <SectionHeader title={title} catSlug={catSlug} />
        <ProductGrid products={limitedProducts} loading={false} cols={4} />
      </Container>
    </section>
  );
};

export default CategorySection;
