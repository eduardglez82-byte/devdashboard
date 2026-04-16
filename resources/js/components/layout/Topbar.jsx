import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
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

export default function Topbar() {
    const { pathname } = useLocation();
    const { toggleMobileSidebar } = useLayout();

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
                <ThemeToggle />
                <div className="topbar__divider" aria-hidden="true" />
                <UserMenu />
            </div>
        </header>
    );
}
