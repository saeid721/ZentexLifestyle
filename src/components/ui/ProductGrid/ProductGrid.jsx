import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from '../ProductCard/ProductCard';
import Loader from '../Loader/Loader';

/**
 * ProductGrid — responsive grid of ProductCards.
 * cols prop controls max columns on large screens.
 */
const ProductGrid = ({ products = [], loading = false, cols = 4 }) => {
  const colProps = {
    xs: 6,
    sm: cols >= 3 ? 4 : 6,
    md: cols >= 4 ? 3 : 4,
    lg: Math.floor(12 / cols),
  };

  if (loading) return <Loader />;

  return (
    <Row className="g-3">
      {products.map((product) => (
        <Col key={product.id} {...colProps}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
};

export default ProductGrid;
