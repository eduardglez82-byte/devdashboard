import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getStored, setStored } from '../utils/storage';

export const LayoutContext = createContext(null);

const SIDEBAR_KEY = 'devdashboard:sidebar-collapsed';

export function LayoutProvider({ children }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const stored = getStored(SIDEBAR_KEY);
        return stored === 'true';
    });

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [rightSidebar, setRightSidebar] = useState(null);

    useEffect(() => {
        setStored(SIDEBAR_KEY, String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed((c) => !c);
    }, []);

    const toggleMobileSidebar = useCallback(() => {
        setMobileSidebarOpen(o => !o);
    }, []);

    return (
        <LayoutContext.Provider
            value={{
                sidebarCollapsed,
                toggleSidebar,
                setSidebarCollapsed,
                mobileSidebarOpen,
                toggleMobileSidebar,
                setMobileSidebarOpen,
                rightSidebar,
                setRightSidebar,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
}
