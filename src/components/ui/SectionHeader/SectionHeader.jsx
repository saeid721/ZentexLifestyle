// src/components/common/SectionHeader/SectionHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './SectionHeader.scss';

const SectionHeader = ({
  title,
  catSlug,
  viewAllLink,
  viewAllText = 'See All',
}) => {
  const resolvedLink = catSlug
    ? `/products/${catSlug}`
    : (viewAllLink || null);

  return (
    <div className="section-header d-flex align-items-center justify-content-between mb-3">
      <h2 className="section-header__title">{title}</h2>
      {resolvedLink && (
        <Link to={resolvedLink} className="section-header__badge">
          {viewAllText}
        </Link>
      )}
    </div>
  );
};

export default SectionHeader;