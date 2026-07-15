import React from 'react';
import { useInViewOnce } from '../../../hooks/useInViewOnce';
import './Reveal.scss';

/**
 * type: 'fade' | 'fade-up' | 'fade-down' | 'scale' | 'slide-left' | 'slide-right'
 * delay: ms, applied only after the element becomes visible
 */
const Reveal = ({
  children,
  as: Tag = 'div',
  type = 'fade-up',
  delay = 0,
  className = '',
  ...rest
}) => {
  const [ref, isVisible] = useInViewOnce();

  return (
    <Tag
      ref={ref}
      className={`reveal reveal--${type} ${isVisible ? 'reveal--visible' : ''} ${className}`.trim()}
      style={{ transitionDelay: isVisible ? `${delay}ms` : '0ms' }}
      {...rest}
    >
      {children}
    </Tag>
  );
};

export default Reveal;