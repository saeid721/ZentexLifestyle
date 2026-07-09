import './Skeleton.css';

/**
 * Skeleton — base shimmer block
 *
 * Props:
 *  variant  — 'line-xs' | 'line-sm' | 'line' | 'line-lg' | 'line-xl'
 *             | 'circle' | 'badge' | 'btn' | 'card-img' | 'block'
 *  width    — CSS string, e.g. '80%' or '120px'
 *  height   — CSS string (overrides variant height)
 *  delay    — 0 | 1 | 2 | 3  (stagger index)
 *  style    — extra inline styles
 *  className
 */
export function Skeleton({
  variant = 'line',
  width,
  height,
  delay = 0,
  style = {},
  className = '',
}) {
  const classes = [
    'sk',
    `sk-${variant}`,
    delay > 0 ? `sk-delay-${delay}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}
