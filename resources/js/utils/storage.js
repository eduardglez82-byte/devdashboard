/**
 * Wrapper de localStorage tolerante a SSR y navegadores con storage deshabilitado.
 */

export function getStored(key) {
    try {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function setStored(key, value) {
    try {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(key, value);
    } catch {
        // ignore
    }
}

export function removeStored(key) {
    try {
        if (typeof window === 'undefined') return;
        window.localStorage.removeItem(key);
    } catch {
        // ignore
    }
}
