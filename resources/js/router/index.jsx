import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

import Login from '../pages/auth/Login';
import SpotifyCallback from '../pages/SpotifyCallback';
import Dashboard from '../pages/Dashboard';
import TareasIndex from '../pages/tareas/TareasIndex';
import KanbanIndex from '../pages/kanban/KanbanIndex';
import UsuariosIndex from '../pages/usuarios/UsuariosIndex';
import EmpresasIndex from '../pages/empresas/EmpresasIndex';
import ProyectosIndex from '../pages/proyectos/ProyectosIndex';
import ProyectoDetalle from '../pages/proyectos/ProyectoDetalle';
import ConfiguracionIndex from '../pages/configuracion/ConfiguracionIndex';
import NotFound from '../pages/NotFound';

export default function AppRouter() {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route
                element={
                    <GuestRoute>
                        <AuthLayout />
                    </GuestRoute>
                }
            >
                <Route path="/login" element={<Login />} />
            </Route>

            <Route path="/spotify/callback" element={<SpotifyCallback />} />

            {/* Rutas privadas */}
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Dashboard />} />
                <Route path="/tareas" element={<TareasIndex />} />
                <Route path="/kanban" element={<KanbanIndex />} />
                <Route path="/usuarios" element={<UsuariosIndex />} />
                <Route path="/empresas" element={<EmpresasIndex />} />
                <Route path="/proyectos" element={<ProyectosIndex />} />
                <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
                <Route path="/configuracion" element={<ConfiguracionIndex />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
            <Route path="/404" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
