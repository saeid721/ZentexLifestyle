import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PLACEHOLDER_IMG } from '../../../utils';
import '../Skeleton/Skeleton.css';

const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  width,
  height,
  loading = 'lazy',
  fetchPriority = 'auto',
  decoding = 'async',
  fallbackSrc = PLACEHOLDER_IMG,
  wrapperClassName = '',
  wrapperStyle = {},
  objectFit = 'cover',
  transition = 'opacity 300ms ease-in-out',
  eager = false,
  onError,
  ...rest
}) => {
  const [imageSrc, setImageSrc] = useState(() => src || fallbackSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);
  const imgRef = useRef(null); // ✅ NEW

  // Reset states if src changes
  useEffect(() => {
    setImageSrc(src || fallbackSrc);
    setIsLoaded(false);
    setHasErrored(false);
  }, [src, fallbackSrc]);

  // ✅ NEW: catch images the browser already served from cache.
  // If the native <img> is already "complete" by the time this effect
  // runs, the load event fired before onLoad was attached and never
  // reached React — so isLoaded would otherwise stay false forever.
  useEffect(() => {
    const node = imgRef.current;
    if (node && node.complete && node.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [imageSrc]);

  const resolvedLoading = eager ? 'eager' : loading;
  const resolvedFetchPriority = eager ? 'high' : fetchPriority;
  const resolvedDecoding = eager ? 'async' : decoding;

  const imageStyle = useMemo(() => ({
    ...style,
    objectFit,
    opacity: isLoaded ? 1 : 0,
    transition,
    willChange: 'opacity',
    width: '100%',
    height: '100%',
  }), [style, objectFit, isLoaded, transition]);

  const handleError = (event) => {
    if (hasErrored) return;
    setHasErrored(true);
    setImageSrc(fallbackSrc);
    if (onError) onError(event);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div
      className={wrapperClassName}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        ...wrapperStyle,
      }}
    >
      {!isLoaded && (
        <div
          className="sk"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            zIndex: 0,
            width: '100%',
            height: '100%',
          }}
          aria-hidden="true"
        />
      )}

      <img
        ref={imgRef} // ✅ NEW
        src={imageSrc}
        alt={alt}
        className={className}
        style={imageStyle}
        width={width}
        height={height}
        loading={resolvedLoading}
        decoding={resolvedDecoding}
        fetchPriority={resolvedFetchPriority}
        onLoad={handleLoad}
        onError={handleError}
        draggable={false}
        {...rest}
      />
    </div>
  );
};

export default React.memo(OptimizedImage);