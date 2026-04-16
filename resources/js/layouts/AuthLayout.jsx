import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div className="auth-layout">
            <div className="auth-layout__bg" aria-hidden="true">
                <div className="auth-layout__grid" />
                <div className="auth-layout__glow auth-layout__glow--1" />
                <div className="auth-layout__glow auth-layout__glow--2" />
            </div>
            <div className="auth-layout__content">
                <Outlet />
            </div>
        </div>
    );
}
