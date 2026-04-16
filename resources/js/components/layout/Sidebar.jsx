import React from 'react';
import {
    LayoutDashboard,
    CheckSquare,
    LayoutTemplate,
    Users,
    Building2,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import SidebarItem from './SidebarItem';
import Logo from '../common/Logo';
import { useLayout } from '../../hooks/useLayout';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, toggleMobileSidebar } = useLayout();
    const { user } = useAuth();
    const role = user?.role;
    const isAdmin        = role === 'admin';
    const isAdminEmpresa = role === 'admin_empresa';

    return (
        <aside className={cn('sidebar', sidebarCollapsed && 'sidebar--collapsed', mobileSidebarOpen && 'sidebar--mobile-open')}>
            <div className="sidebar__header">
                <Logo collapsed={sidebarCollapsed} />
            </div>

            {/* Inicio — siempre visible */}
            <div className="sidebar__pinned">
                <SidebarItem
                    to="/"
                    icon={LayoutDashboard}
                    label="Inicio"
                    end={true}
                    collapsed={sidebarCollapsed}
                />
            </div>

            {/* Secciones desplazables */}
            <nav className="sidebar__sections">

                {/* Kanban — todos los roles */}
                <div className="sidebar__section">
                    {!sidebarCollapsed && (
                        <div className="sidebar__section-label">Kanban</div>
                    )}
                    <SidebarItem to="/tareas"  icon={CheckSquare}   label="Tareas"   collapsed={sidebarCollapsed} />
                    <SidebarItem to="/kanban"  icon={LayoutTemplate} label="Tablero"  collapsed={sidebarCollapsed} />
                </div>

                {/* Gestión — admin y admin_empresa */}
                {(isAdmin || isAdminEmpresa) && (
                    <div className="sidebar__section">
                        {!sidebarCollapsed && (
                            <div className="sidebar__section-label">Gestión</div>
                        )}
                        <SidebarItem to="/usuarios" icon={Users}     label="Usuarios" collapsed={sidebarCollapsed} />
                        {isAdmin && (
                            <SidebarItem to="/empresas" icon={Building2} label="Empresas" collapsed={sidebarCollapsed} />
                        )}
                    </div>
                )}

            </nav>

            <button
                type="button"
                className="sidebar__collapse"
                onClick={() => window.innerWidth <= 768 ? toggleMobileSidebar() : toggleSidebar()}
                aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                title={sidebarCollapsed ? 'Expandir' : 'Colapsar'}
            >
                {sidebarCollapsed ? (
                    <ChevronsRight size={16} strokeWidth={2.5} />
                ) : (
                    <>
                        <ChevronsLeft size={16} strokeWidth={2.5} />
                        <span>Colapsar</span>
                    </>
                )}
            </button>
        </aside>
    );
}
