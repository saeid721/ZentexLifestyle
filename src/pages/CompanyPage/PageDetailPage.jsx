// src/pages/CompanyPage/PageDetailPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import { usePageDetail } from '../../hooks/usePageDetail';
import './PageDetailPage.scss';

const PageDetailPage = () => {
  const { slug } = useParams();
  const { data: page, loading, error } = usePageDetail(slug);

  if (loading) {
    return (
      <main className="pdp pdp--loading">
        <Container className="container-1500 pdp__loading">
          <div className="spinner-border pdp__spinner" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </Container>
      </main>
    );
  }

  // Handle 404 or error state
  if (error) {
    return (
      <main className="pdp pdp--error">
        <Container className="container-1500 py-5 text-center">
          <Alert variant="danger" className="d-inline-block">
            <Alert.Heading>⚠️ {error}</Alert.Heading>
            <p className="mb-0">
              <Link to="/" className="pdp__back-btn">← Back to Home</Link>
            </p>
          </Alert>
        </Container>
      </main>
    );
  }

  // Show nothing while loading (for quick first paint)
  if (!page) {
    return null;
  }

  return (
    <main className="pdp">
      <Container className="container-1500 py-3">
      
      {/* ── Breadcrumb + Back ── */}
      <div className="pdp__topbar d-flex align-items-center justify-content-between mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb pdp__breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {page.title || 'Page Details'}
            </li>
          </ol>
        </nav>
          <Link to="/" className="pdp__back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back To Home
          </Link>
      </div>

        {/* ── Main Content Layout ── */}
        <article className="details-page__form-card">
          {page.title && (
            <header className="pdp__header mb-4">
              <h1 className="pdp__title h3">{page.title}</h1>
              {page.meta?.excerpt && (
                <p className="pdp__excerpt text-muted">{page.meta.excerpt}</p>
              )}
            </header>
          )}
          
          <div 
            className="pdp__body"
            dangerouslySetInnerHTML={{ 
              __html: page.description || page.content || '' 
            }} 
          />
        </article>
      </Container>
    </main>
  );
};

export default PageDetailPage;