// src/utils/toastBus.js
let listeners = [];

export const subscribeToast = (fn) => {
    listeners.push(fn);
    return () => { listeners = listeners.filter((l) => l !== fn); };
};

export const showGlobalToast = (message, type = 'success') => {
    listeners.forEach((fn) => fn({ message, type, id: Date.now() + Math.random() }));
};