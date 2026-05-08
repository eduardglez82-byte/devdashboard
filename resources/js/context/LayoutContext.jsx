import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getStored, setStored } from '../utils/storage';

export const LayoutContext = createContext(null);

const SIDEBAR_KEY       = 'devdashboard:sidebar-collapsed';
const RIGHT_SIDEBAR_KEY  = 'devdashboard:right-sidebar-collapsed';

export function LayoutProvider({ children }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        return getStored(SIDEBAR_KEY) === 'true';
    });

    const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(() => {
        return getStored(RIGHT_SIDEBAR_KEY) === 'true';
    });

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [rightDrawerOpen,   setRightDrawerOpen]   = useState(false);
    const [rightSidebar, setRightSidebar] = useState(null);

    useEffect(() => {
        setStored(SIDEBAR_KEY, String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    useEffect(() => {
        setStored(RIGHT_SIDEBAR_KEY, String(rightSidebarCollapsed));
    }, [rightSidebarCollapsed]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed((c) => !c);
    }, []);

    const toggleRightSidebar = useCallback(() => {
        setRightSidebarCollapsed((c) => !c);
    }, []);

    const toggleMobileSidebar = useCallback(() => {
        setMobileSidebarOpen(o => !o);
    }, []);

    const toggleRightDrawer = useCallback(() => {
        setRightDrawerOpen(o => !o);
    }, []);

    return (
        <LayoutContext.Provider
            value={{
                sidebarCollapsed,
                toggleSidebar,
                setSidebarCollapsed,
                rightSidebarCollapsed,
                toggleRightSidebar,
                setRightSidebarCollapsed,
                mobileSidebarOpen,
                toggleMobileSidebar,
                setMobileSidebarOpen,
                rightDrawerOpen,
                toggleRightDrawer,
                setRightDrawerOpen,
                rightSidebar,
                setRightSidebar,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
}
