import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../../../app/store';
import { BASE_IMAGE_URL } from '../../../utils';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const CartDrawer = ({ onClose }) => {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0);

  return (
    <>
      <div className="cart-drawer-backdrop" onClick={onClose} />
      <aside className="cart-drawer" role="dialog" aria-label="Shopping cart">
        <div className="cart-drawer__header">
          <h3 className="cart-drawer__title">Shopping Cart</h3>
          <button className="cart-drawer__close" onClick={onClose} aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <p className="cart-drawer__empty-title">Your cart is empty</p>
            <p className="cart-drawer__empty-sub">
              You may check out all the available products and buy some in the shop
            </p>
            <Link to="/shop" className="cart-drawer__return-btn" onClick={onClose}>
              Return to shop <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer__items">
              {items.map((item) => (
                <div key={item.id} className="cart-drawer__item">
                  <div className="cart-drawer__item-thumb">
                    {item.image && (
                      <img
                        src={item.image.startsWith('http') ? item.image : `${BASE_IMAGE_URL}${item.image}`}
                        alt={item.name}
                      />
                    )}
                  </div>
                  <div className="cart-drawer__item-info">
                    <span className="cart-drawer__item-name">{item.name}</span>
                    <span className="cart-drawer__item-meta">
                      {item.quantity} × ৳{Number(item.price).toLocaleString('en-US')}
                    </span>
                  </div>
                  <button
                    className="cart-drawer__item-remove"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-drawer__footer">
              <div className="cart-drawer__subtotal">
                <span>Subtotal</span>
                <strong>৳{subtotal.toLocaleString('en-US')}</strong>
              </div>
              <Link to="/cart" className="cart-drawer__return-btn" onClick={onClose}>
                View Cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;