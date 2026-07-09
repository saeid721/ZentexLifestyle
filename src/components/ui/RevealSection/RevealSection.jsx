import React from 'react';

/**
 * Lightweight wrapper kept for layout compatibility.
 */
const RevealSection = ({
  children,
  className = '',
}) => {
  return <div className={className}>{children}</div>;
};

export default RevealSection;
