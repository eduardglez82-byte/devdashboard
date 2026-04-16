import React from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import Sidebar from '../components/layout/Sidebar';
import RightSidebar from '../components/layout/RightSidebar';
import RightSidebarPanel from '../components/layout/RightSidebarPanel';
import { useLayout } from '../hooks/useLayout';
import { cn } from '../utils/cn';

export default function DashboardLayout() {
    const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useLayout();

    return (
        <div className={cn('dash-layout dash-layout--has-right', sidebarCollapsed && 'dash-layout--collapsed')}>
            {mobileSidebarOpen && (
                <div
                    className="sidebar-backdrop sidebar-backdrop--active"
                    onClick={() => setMobileSidebarOpen(false)}
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
                    <RightSidebar>
                        <RightSidebarPanel />
                    </RightSidebar>
                </div>
            </div>
        </div>
    );
}
