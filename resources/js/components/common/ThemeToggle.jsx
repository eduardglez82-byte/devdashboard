import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
            <span className="theme-toggle__icon" data-active={!isDark}>
                <Sun size={16} strokeWidth={2} />
            </span>
            <span className="theme-toggle__icon" data-active={isDark}>
                <Moon size={16} strokeWidth={2} />
            </span>
        </button>
    );
}
