import { Row, Col } from 'react-bootstrap';
import { Skeleton } from './Skeleton';
import './Skeleton.css';

/* ─────────────────────────────────────────
   1. PRODUCT CARD
   ───────────────────────────────────────── */
export function SkeletonProductCard({ delay = 0 }) {
  return (
    <div className="sk-product-card" aria-hidden="true">
      <Skeleton variant="card-img" delay={delay} />
      <div className="sk-product-card__body">
        <div className="sk-product-card__badges">
          <Skeleton variant="badge" delay={delay} />
          <Skeleton variant="badge" width="48px" delay={delay} />
        </div>
        <div className="sk-product-card__lines">
          <Skeleton variant="line-lg" width="85%" delay={delay} />
          <Skeleton variant="line" width="55%" delay={delay} />
          <Skeleton variant="line-sm" width="40%" delay={delay} />
        </div>
        <div className="sk-product-card__btns">
          <Skeleton variant="btn" style={{ flex: 1 }} delay={delay} />
          <Skeleton variant="btn" width="36px" delay={delay} />
        </div>
      </div>
    </div>
  );
}

/**
 * ProductCard grid — renders `count` staggered cards
 * Usage: <SkeletonProductGrid count={4} />
 */
export function SkeletonProductGrid({ count = 4, cols = 4 }) {
  const colProps = {
    xs: 6,
    sm: cols >= 3 ? 4 : 6,
    md: cols >= 4 ? 3 : 4,
    lg: Math.floor(12 / cols),
  };

  return (
    <Row className="g-3" role="status" aria-label="Loading products…">
      {Array.from({ length: count }, (_, i) => (
        <Col key={i} {...colProps}>
          <SkeletonProductCard delay={i % 4} />
        </Col>
      ))}
    </Row>
  );
}

/* ─────────────────────────────────────────
   2. LIST / FEED ROW
   ───────────────────────────────────────── */
export function SkeletonListRow({ delay = 0 }) {
  return (
    <div className="sk-list-row" aria-hidden="true">
      <Skeleton
        variant="circle"
        width="36px"
        height="36px"
        style={{ flexShrink: 0 }}
        delay={delay}
      />
      <div className="sk-list-row__content">
        <div className="sk-list-row__meta">
          <Skeleton variant="line" width="110px" delay={delay} />
          <Skeleton variant="line-xs" width="56px" delay={delay} />
        </div>
        <Skeleton variant="line" width="90%" delay={delay} />
        <Skeleton variant="line" width="65%" delay={delay} />
      </div>
      <div className="sk-list-row__actions">
        <Skeleton variant="btn" width="28px" height="28px" delay={delay} />
        <Skeleton variant="btn" width="28px" height="28px" delay={delay} />
      </div>
    </div>
  );
}

/**
 * Feed list — renders `count` staggered rows
 * Usage: <SkeletonFeedList count={5} />
 */
export function SkeletonFeedList({ count = 5 }) {
  return (
    <div role="status" aria-label="Loading feed…">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonListRow key={i} delay={i % 4} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   3. STAT / METRIC CARD
   ───────────────────────────────────────── */
export function SkeletonStatCard({ delay = 0 }) {
  return (
    <div className="sk-stat-card" aria-hidden="true">
      <Skeleton variant="line-sm" width="60%" delay={delay} />
      <Skeleton variant="line-xl" width="75%" delay={delay} />
      <Skeleton variant="line-xs" width="40%" delay={delay} />
    </div>
  );
}

/**
 * Metric grid — renders `count` staggered stat cards
 * Usage: <SkeletonStatGrid count={4} />
 */
export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '10px',
      }}
      role="status"
      aria-label="Loading metrics…"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonStatCard key={i} delay={i % 4} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   4. ARTICLE / DETAIL
   ───────────────────────────────────────── */
export function SkeletonArticle() {
  return (
    <div
      className="sk-article"
      role="status"
      aria-label="Loading article…"
    >
      {/* Byline */}
      <div className="sk-article__header">
        <Skeleton variant="circle" width="32px" height="32px" style={{ flexShrink: 0 }} />
        <div className="sk-article__byline">
          <Skeleton variant="line" width="120px" />
          <Skeleton variant="line-xs" width="80px" />
        </div>
        <Skeleton variant="badge" width="72px" />
      </div>

      {/* Title */}
      <Skeleton variant="line-xl" width="72%" />
      <Skeleton variant="line-lg" width="52%" />

      <div style={{ height: '8px' }} />

      {/* Body paragraphs */}
      <Skeleton variant="line" width="100%" />
      <Skeleton variant="line" width="97%" delay={1} />
      <Skeleton variant="line" width="88%" delay={1} />
      <Skeleton variant="line" width="100%" delay={2} />
      <Skeleton variant="line" width="74%" delay={2} />

      <div style={{ height: '8px' }} />

      <Skeleton variant="line" width="100%" delay={1} />
      <Skeleton variant="line" width="95%" delay={2} />
      <Skeleton variant="line" width="62%" delay={3} />

      {/* CTAs */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <Skeleton variant="btn" width="110px" />
        <Skeleton variant="btn" width="88px" delay={1} />
      </div>
    </div>
  );
}
