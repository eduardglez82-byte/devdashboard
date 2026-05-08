import React from 'react';
import { cn } from '../../utils/cn';

export default function RightSidebar({ children, collapsed = false, mobileOpen = false }) {
    return (
        <aside
            className={cn(
                'right-sidebar',
                collapsed && 'right-sidebar--collapsed',
                mobileOpen && 'right-sidebar--mobile-open',
            )}
            aria-hidden={collapsed && !mobileOpen}
        >
            {children}
        </aside>
    );
}
