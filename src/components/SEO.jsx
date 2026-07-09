// src/components/SEO.jsx
import { Helmet } from "react-helmet-async";

const SEO = ({
  title,
  description,
  image,
  ogImage,
  url,
  canonical,
  ogType = "website",
  twitterCard = "summary_large_image",
  keywords,
  noIndex = false,
  schemas = [],        // ✅ NEW: array of JSON-LD schema objects
}) => {

  const resolvedImage     = ogImage || image || "";
  const resolvedCanonical = canonical || url || "";

  return (
    <Helmet>
      {/* ── Basic ───────────────────────────── */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* ── Canonical ───────────────────────── */}
      {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

      {/* ── Robots ──────────────────────────── */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />

      {/* ── Open Graph ──────────────────────── */}
      <meta property="og:title"       content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={resolvedCanonical} />
      <meta property="og:type"        content={ogType} />
      {resolvedImage && <meta property="og:image"        content={resolvedImage} />}
      {resolvedImage && <meta property="og:image:alt"    content={title} />}
      {resolvedImage && <meta property="og:image:width"  content="1200" />}
      {resolvedImage && <meta property="og:image:height" content="630" />}

      {/* ── Twitter Card ────────────────────── */}
      <meta name="twitter:card"        content={twitterCard} />
      <meta name="twitter:title"       content={title} />
      <meta name="twitter:description" content={description} />
      {resolvedImage && <meta name="twitter:image"     content={resolvedImage} />}
      {resolvedImage && <meta name="twitter:image:alt" content={title} />}

      {/* ✅ NEW: JSON-LD Structured Data — injected safely via Helmet */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;