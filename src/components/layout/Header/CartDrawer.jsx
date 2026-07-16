import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useCartStore from '../../../app/store';
import { BASE_IMAGE_URL } from '../../../utils';
import { X, Trash2 } from "lucide-react";

const CloseIcon = () => <X size={20} strokeWidth={2} />;

const TrashIcon = () => <Trash2 size={16} strokeWidth={2} />;

const CartDrawer = ({ onClose }) => {
  const items = useCartStore((s) => s.items);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const updateQty = useCartStore((s) => s.updateQty);

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
                      ৳{Number(item.price).toLocaleString('en-US')}
                    </span>
                    <div className="cart-drawer__qty-ctrl" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button
                        type="button"
                        onClick={() => item.quantity > 1 ? updateQty(item.id, item.quantity - 1) : removeFromCart(item.id)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="cart-drawer__item-remove"
                    onClick={() => removeFromCart(item.id)}
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
              <div className="cart-drawer__footer-actions">
                <Link to="/cart" className="cart-drawer__return-btn cart-drawer__return-btn--outline" onClick={onClose}>
                  View Cart
                </Link>
                <Link to="/checkout" className="cart-drawer__return-btn" onClick={onClose}>
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;