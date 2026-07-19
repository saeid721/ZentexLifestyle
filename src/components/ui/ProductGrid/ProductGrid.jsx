import React, { memo } from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from '../ProductCard/ProductCard';
import Loader from '../Loader/Loader';

const ProductGrid = ({ products = [], loading = false, cols = 5 }) => {
  if (loading) return <Loader />;

  const isListView = cols === 1;

  return (
    <Row
      xs={isListView ? 1 : 2}
      sm={isListView ? 1 : 3}
      md={isListView ? 1 : 4}
      lg={cols}
      className={`g-3${isListView ? ' product-grid--list' : ''}`}
    >
      {products.map((product) => (
        <Col key={product.id}>
          <ProductCard product={product} listView={isListView} />
        </Col>
      ))}
    </Row>
  );
};

export default memo(ProductGrid);