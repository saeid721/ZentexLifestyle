import React, { useEffect, memo } from 'react';
import { X } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import OptimizedImage from '../../components/ui/OptimizedImage';

const LazySizeGuideModal = memo(({ onClose, sizeGuideImg }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="sg-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="sg-modal" role="dialog" aria-modal="true" aria-label="Size Guide">
        <div className="sg-modal__header">
          <div className="sg-modal__header-left">
            <span className="sg-modal__icon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="8" y1="5" x2="20" y2="5"></line>
                <line x1="8" y1="19" x2="20" y2="19"></line>
                <line x1="14" y1="5" x2="14" y2="19"></line>
              </svg>
            </span>
            <div>
              <h2 className="sg-modal__title">Size Guide</h2>
              <p className="sg-modal__subtitle">Measurement chart</p>
            </div>
          </div>
          <button
            className="sg-modal__close"
            onClick={onClose}
            aria-label="Close size guide"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className="sg-modal__body">
          <div className="sg-modal__img-wrap">
            {sizeGuideImg ? (
              <OptimizedImage
                src={sizeGuideImg}
                alt="Size measurement chart"
                className="sg-modal__img"
                wrapperStyle={{ width: '100%', height: 'auto' }}
              />
            ) : null}
            <div
              className="sg-modal__img-fallback"
              style={{ display: sizeGuideImg ? 'none' : 'flex' }}
            >
              <ImageIcon size={24} stroke="#ddd" strokeWidth={1.5} />
              <p>Size chart not available.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

LazySizeGuideModal.displayName = 'LazySizeGuideModal';

export default LazySizeGuideModal;
