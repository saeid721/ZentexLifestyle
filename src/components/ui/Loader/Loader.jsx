import React from 'react';
import { Row, Col } from 'react-bootstrap';
import './Loader.scss';

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-card__img skeleton-pulse" />
    <div className="skeleton-card__body">
      <div className="skeleton-pulse skeleton-line w-90" />
      <div className="skeleton-pulse skeleton-line w-60" />
      <div className="skeleton-pulse skeleton-line w-40" />
      <div className="skeleton-card__btns">
        <div className="skeleton-pulse skeleton-btn" />
        <div className="skeleton-pulse skeleton-btn" />
      </div>
    </div>
  </div>
);

const Loader = ({ count = 4, cols = 4 }) => {
  const colProps = {
    xs: 6,
    sm: cols >= 3 ? 4 : 6,
    md: cols >= 4 ? 3 : 4,
    lg: Math.floor(12 / cols),
  };

  return (
    <Row className="g-3">
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i} {...colProps}>
          <SkeletonCard />
        </Col>
      ))}
    </Row>
  );
};

export default Loader;
