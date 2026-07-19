// src/components/common/GlobalToast/GlobalToast.jsx
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleAlert } from 'lucide-react';
import { subscribeToast } from '../../../utils/toastBus';
import { getCartIconEl } from '../../../utils/cartIconRegistry';
import './GlobalToast.scss';

const GlobalToast = () => {
    const [toast, setToast] = useState(null);
    const [style, setStyle] = useState({});
    const hideTimerRef = useRef(null);

    useEffect(() => {
        const unsubscribe = subscribeToast((next) => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

            const isDesktop = window.matchMedia('(min-width: 992px)').matches;
            const cartEl = isDesktop ? getCartIconEl() : null;

            if (cartEl) {
                const rect = cartEl.getBoundingClientRect();
                setStyle({
                    position: 'fixed',
                    top: `${rect.bottom + 10}px`,
                    right: `${Math.max(12, window.innerWidth - rect.right - 4)}px`,
                    left: 'auto',
                    bottom: 'auto',
                });
            } else if (isDesktop) {
                setStyle({
                    position: 'fixed',
                    top: '84px',
                    right: '24px',
                    left: 'auto',
                    bottom: 'auto',
                });
            } else {
                // Mobile: sit just above the fixed bottom nav bar
                setStyle({
                    position: 'fixed',
                    bottom: '74px',
                    left: '50%',
                    right: 'auto',
                    top: 'auto',
                    transform: 'translateX(-50%)',
                });
            }

            setToast(next);
            hideTimerRef.current = setTimeout(() => setToast(null), 2600);
        });

        return () => {
            unsubscribe();
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    if (!toast) return null;

    return createPortal(
        <div className={`global-toast global-toast--${toast.type}`} style={style}>
            <span className="global-toast__icon">
                {toast.type === 'success' ? (
                    <Check size={16} strokeWidth={2.5} />
                ) : (
                    <CircleAlert size={16} strokeWidth={2.5} />
                )}
            </span>
            {toast.message}
        </div>,
        document.body
    );
};

export default GlobalToast;