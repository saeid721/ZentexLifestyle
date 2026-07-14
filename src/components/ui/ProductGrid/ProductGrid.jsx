import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from '../ProductCard/ProductCard';
import Loader from '../Loader/Loader';

/**
 * ProductGrid — responsive grid of ProductCards.
 * Mobile: 2 per row. Desktop (lg+): 5 per row.
 */
const ProductGrid = ({ products = [], loading = false }) => {
  if (loading) return <Loader />;

  return (
    <Row xs={2} sm={3} md={4} lg={5} className="g-3">
      {products.map((product) => (
        <Col key={product.id}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
};

export default ProductGrid;