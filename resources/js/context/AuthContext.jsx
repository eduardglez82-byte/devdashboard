import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, me } from '../api/endpoints/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Al montar la app, intentamos recuperar la sesión
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await me();
                if (!cancelled) setUser(data);
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const login = useCallback(async (email, password) => {
        await apiLogin(email, password);
        const data = await me();
        setUser(data);
        return data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiLogout();
        } finally {
            setUser(null);
        }
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
