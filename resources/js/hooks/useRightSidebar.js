import { createElement, useEffect } from 'react';
import { useLayout } from './useLayout';

/**
 * Hook para que una página inyecte un componente en el sidebar derecho.
 * Acepta una referencia a un componente (no un elemento JSX) para evitar
 * bucles de re-render infinitos por referencia inestable.
 *
 * Uso:
 *   useRightSidebar(MiSidebarComponent);  // pasa el componente, no <JSX />
 *   useRightSidebar(null);               // sin sidebar derecho
 */
export function useRightSidebar(Component) {
    const { setRightSidebar } = useLayout();

    useEffect(() => {
        setRightSidebar(Component ? createElement(Component) : null);
        return () => setRightSidebar(null);
    }, [Component, setRightSidebar]);
}
