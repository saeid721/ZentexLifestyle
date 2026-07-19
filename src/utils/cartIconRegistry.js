// src/utils/cartIconRegistry.js
let cartIconEl = null;

export const registerCartIcon = (el) => {
    cartIconEl = el;
};

export const getCartIconEl = () => cartIconEl;