import React, { memo } from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from '../ProductCard/ProductCard';
import Loader from '../Loader/Loader';

const ProductGrid = ({ products = [], loading = false, cols = 5 }) => {
  if (loading) return <Loader />;

  return (
    <Row xs={2} sm={3} md={4} lg={cols} className="g-3">
      {products.map((product) => (
        <Col key={product.id}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
};

export default memo(ProductGrid);