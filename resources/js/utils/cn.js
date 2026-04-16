/**
 * Helper minimalista para concatenar clases condicionalmente.
 * Alternativa ligera a la librería `clsx`.
 */
export function cn(...args) {
    const out = [];
    for (const arg of args) {
        if (!arg) continue;
        if (typeof arg === 'string') {
            out.push(arg);
        } else if (Array.isArray(arg)) {
            const nested = cn(...arg);
            if (nested) out.push(nested);
        } else if (typeof arg === 'object') {
            for (const key of Object.keys(arg)) {
                if (arg[key]) out.push(key);
            }
        }
    }
    return out.join(' ');
}
