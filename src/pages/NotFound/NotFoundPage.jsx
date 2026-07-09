import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './NotFoundPage.scss';

const NotFoundPage = () => (
  <main className="not-found-page">
    <Container className="py-5 text-center">
      <h1 className="not-found-page__code">404</h1>
      <h3 className="not-found-page__title">Page Not Found</h3>
      <p className="text-muted">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="not-found-page__btn">← Back to Home</Link>
    </Container>
  </main>
);

export default NotFoundPage;
