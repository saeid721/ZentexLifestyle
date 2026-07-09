// ─── Barrel export ───────────────────────────────────
export { Skeleton } from './Skeleton';
export {
  SkeletonProductCard,
  SkeletonProductGrid,
  SkeletonListRow,
  SkeletonFeedList,
  SkeletonStatCard,
  SkeletonStatGrid,
  SkeletonArticle,
} from './SkeletonPatterns';


// ─────────────────────────────────────────────────────
// USAGE EXAMPLES
// ─────────────────────────────────────────────────────

/*
  1. SWAP BASED ON LOADING STATE (most common pattern)
  ──────────────────────────────────────────────────────

  import { SkeletonProductGrid } from './skeleton';

  function ProductsPage() {
    const { data, isLoading } = useProducts();

    return isLoading
      ? <SkeletonProductGrid count={8} />
      : <ProductGrid products={data} />;
  }


  2. INLINE CUSTOM SKELETON (one-off layout)
  ──────────────────────────────────────────────────────

  import { Skeleton } from './skeleton';

  function ProfileSkeleton() {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Skeleton variant="circle" width="48px" height="48px" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton variant="line-lg" width="140px" />
          <Skeleton variant="line-sm" width="90px" />
        </div>
      </div>
    );
  }


  3. STAGGER IN A LOOP (feed)
  ──────────────────────────────────────────────────────

  import { SkeletonListRow } from './skeleton';

  function FeedSkeleton() {
    return (
      <div role="status" aria-label="Loading feed…">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonListRow key={i} delay={i % 4} />
        ))}
      </div>
    );
  }


  4. AVAILABLE VARIANTS (Skeleton variant prop)
  ──────────────────────────────────────────────────────

  variant="line-xs"   // 8px  — timestamps, captions
  variant="line-sm"   // 10px — secondary labels
  variant="line"      // 12px — body text (default)
  variant="line-lg"   // 16px — subheadings
  variant="line-xl"   // 22px — headings / numbers
  variant="circle"    // set width + height for size
  variant="badge"     // 22px pill (64px default width)
  variant="btn"       // 36px button block
  variant="card-img"  // full-width 1:1 aspect image
  variant="block"     // raw block, supply your own height


  5. DELAY VALUES (stagger animation phase)
  ──────────────────────────────────────────────────────

  delay={0}  // immediate (default)
  delay={1}  // +150ms
  delay={2}  // +300ms
  delay={3}  // +450ms


  6. CUSTOM SIZES
  ──────────────────────────────────────────────────────

  <Skeleton variant="block" width="200px" height="120px" />
  <Skeleton variant="circle" width="64px" height="64px" />
  <Skeleton variant="line" width="75%" />
*/
