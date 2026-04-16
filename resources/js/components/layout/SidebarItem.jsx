import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useLayout } from '../../hooks/useLayout';

export default function SidebarItem({ to, icon: Icon, label, collapsed, end = false }) {
    const { setMobileSidebarOpen } = useLayout();

    function handleClick() {
        // Close mobile sidebar drawer on navigation
        setMobileSidebarOpen(false);
    }

    return (
        <NavLink
            to={to}
            end={end}
            onClick={handleClick}
            className={({ isActive }) =>
                cn('sidebar-item', isActive && 'sidebar-item--active')
            }
            title={collapsed ? label : undefined}
        >
            <span className="sidebar-item__icon">
                <Icon size={18} strokeWidth={2} />
            </span>
            {!collapsed && <span className="sidebar-item__label">{label}</span>}
            <span className="sidebar-item__indicator" aria-hidden="true" />
        </NavLink>
    );
}
