import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Menu, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import InstallButton from '../common/InstallButton';
import UserMenu from './UserMenu';
import { useLayout } from '../../hooks/useLayout';

const ROUTE_TITLES = {
    '/': 'Inicio',
    '/tareas': 'Tareas',
    '/kanban': 'Tablero',
    '/usuarios': 'Usuarios',
    '/empresas': 'Empresas',
    '/proyectos': 'Proyectos',
    '/configuracion': 'Configuración',
};

function getTitle(pathname) {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
    if (pathname.startsWith('/proyectos/')) return 'Detalle de proyecto';
    return 'Dashboard';
}

/* Detecta si estamos en móvil (≤ 768px) — re-evalúa al redimensionar */
function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
    );
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [breakpoint]);
    return isMobile;
}

export default function Topbar() {
    const { pathname } = useLocation();
    const isMobile = useIsMobile();
    const {
        toggleMobileSidebar,
        sidebarCollapsed, toggleSidebar,
        rightSidebarCollapsed, toggleRightSidebar,
        rightDrawerOpen, toggleRightDrawer,
    } = useLayout();

    /* En móvil el botón derecho abre/cierra el drawer overlay;
       en desktop colapsa/expande el panel lateral. */
    const handleRightToggle = () => {
        if (isMobile) toggleRightDrawer();
        else toggleRightSidebar();
    };
    const rightIsHidden = isMobile ? !rightDrawerOpen : rightSidebarCollapsed;

    return (
        <header className="topbar">
            <div className="topbar__left">
                <button
                    type="button"
                    className="topbar__hamburger"
                    onClick={toggleMobileSidebar}
                    aria-label="Menú"
                >
                    <Menu size={16} strokeWidth={2} />
                </button>

                {/* Toggle del sidebar izquierdo (desktop only) */}
                <button
                    type="button"
                    className={`topbar__panel-toggle topbar__panel-toggle--left ${sidebarCollapsed ? 'is-collapsed' : 'is-open'}`}
                    onClick={toggleSidebar}
                    aria-label={sidebarCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
                    title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                >
                    {sidebarCollapsed
                        ? <PanelLeftOpen  size={16} strokeWidth={2.2} />
                        : <PanelLeftClose size={16} strokeWidth={2.2} />}
                </button>

                <button
                    type="button"
                    className="topbar__cmd-btn"
                    aria-label="Búsqueda rápida"
                    title="Búsqueda global (próximamente)"
                >
                    <Search size={15} strokeWidth={2} />
                    <span className="topbar__cmd-hint">⌘K</span>
                </button>
                <div className="topbar__breadcrumb">
                    <span className="topbar__breadcrumb-label">
                        <Link to="/">devdashboard</Link>
                    </span>
                    <span className="topbar__breadcrumb-sep">/</span>
                    <span className="topbar__breadcrumb-current">
                        {getTitle(pathname)}
                    </span>
                </div>
            </div>

            <div className="topbar__right">
                <InstallButton />
                <ThemeToggle />

                {/* Toggle del sidebar derecho (desktop colapsa, móvil abre drawer) */}
                <button
                    type="button"
                    className={`topbar__panel-toggle topbar__panel-toggle--right ${rightIsHidden ? 'is-collapsed' : 'is-open'}`}
                    onClick={handleRightToggle}
                    aria-label={rightIsHidden ? 'Mostrar utilidades' : 'Ocultar utilidades'}
                    title={rightIsHidden ? 'Mostrar utilidades' : 'Ocultar utilidades'}
                >
                    {rightIsHidden
                        ? <PanelRightOpen  size={16} strokeWidth={2.2} />
                        : <PanelRightClose size={16} strokeWidth={2.2} />}
                </button>

                <div className="topbar__divider" aria-hidden="true" />
                <UserMenu />
            </div>
        </header>
    );
}
