// src/pages/CompanyPage/PageDetailPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import { usePageDetail } from '../../hooks/usePageDetail';
import { ChevronLeft } from 'lucide-react';
import Reveal from '../../components/ui/Reveal/Reveal';
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
      
      <div className="hero-section">
        <Container className="container-1500">
          <Reveal as="h1" type="fade-up" className="hero-section__title">{page.title || 'Page Details'}</Reveal>
          <nav aria-label="breadcrumb">
            <ol className="hero-section__breadcrumb">
              <li><Link to="/">Home</Link></li>
              <li><span className="hero-section__sep">&gt;</span><span>{page.title || 'Page Details'}</span></li>
            </ol>
          </nav>
        </Container>
      </div>
      <Container className="container-1500 mt-4">

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