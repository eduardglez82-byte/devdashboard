import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getStored, setStored } from '../utils/storage';

export const ThemeContext = createContext(null);

const THEME_KEY = 'devdashboard:theme';

function getInitialTheme() {
    const stored = getStored(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }
    return 'light';
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.setAttribute('data-theme', theme);
        setStored(THEME_KEY, theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
