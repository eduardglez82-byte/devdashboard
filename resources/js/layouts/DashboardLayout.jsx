import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import RightSidebar from '../components/layout/RightSidebar';
import RightSidebarPanel from '../components/layout/RightSidebarPanel';
import FloatingChat from '../components/ai/FloatingChat';
import { useLayout } from '../hooks/useLayout';
import { cn } from '../utils/cn';

export default function DashboardLayout() {
    const {
        sidebarCollapsed,
        rightSidebarCollapsed,
        mobileSidebarOpen, setMobileSidebarOpen,
        rightDrawerOpen,   setRightDrawerOpen,
    } = useLayout();

    const { pathname } = useLocation();

    /* Cerrar drawers al cambiar de ruta */
    useEffect(() => {
        setMobileSidebarOpen(false);
        setRightDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    /* Bloquear scroll del body cuando hay un drawer abierto en móvil */
    useEffect(() => {
        const open = mobileSidebarOpen || rightDrawerOpen;
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileSidebarOpen, rightDrawerOpen]);

    return (
        <div className={cn(
            'dash-layout',
            'dash-layout--has-right',
            sidebarCollapsed && 'dash-layout--collapsed',
            rightSidebarCollapsed && 'dash-layout--right-collapsed',
            rightDrawerOpen && 'dash-layout--right-drawer-open',
        )}>
            {(mobileSidebarOpen || rightDrawerOpen) && (
                <div
                    className="sidebar-backdrop sidebar-backdrop--active"
                    onClick={() => { setMobileSidebarOpen(false); setRightDrawerOpen(false); }}
                    aria-hidden="true"
                />
            )}
            <Sidebar />
            <div className="dash-layout__main">
                <Topbar />
                <div className="dash-layout__body">
                    <main className="dash-layout__content">
                        <Outlet />
                    </main>
                    <RightSidebar collapsed={rightSidebarCollapsed} mobileOpen={rightDrawerOpen}>
                        <RightSidebarPanel />
                    </RightSidebar>
                </div>
            </div>
            <FloatingChat />
        </div>
    );
}
