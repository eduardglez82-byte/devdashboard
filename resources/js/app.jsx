import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LayoutProvider } from './context/LayoutContext';
import AppRouter from './router';

function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <LayoutProvider>
                        <AppRouter />
                    </LayoutProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
