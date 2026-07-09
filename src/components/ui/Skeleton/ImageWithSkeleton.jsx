import React, { useState } from 'react';
import './Skeleton.css';

/**
 * ImageWithSkeleton
 * Props: src, alt, className, style, width, height, loading, fetchPriority, onError
 * Image load না হওয়া পর্যন্ত shimmer দেখাবে
 */
const ImageWithSkeleton = ({
  src,
  alt = '',
  className = '',
  style = {},
  width,
  height,
  loading = 'lazy',
  fetchPriority = 'auto',
  onError,
  ...rest
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Skeleton — image load হওয়া পর্যন্ত দেখাবে */}
      {!loaded && (
        <div
          className="sk"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            zIndex: 1,
          }}
        />
      )}

      {/* Real image */}
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        style={{
          ...style,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          setLoaded(true);
          if (onError) onError(e);
        }}
        {...rest}
      />
    </div>
  );
};

export default ImageWithSkeleton;