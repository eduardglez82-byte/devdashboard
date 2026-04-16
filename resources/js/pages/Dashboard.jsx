import React, { useEffect, useState } from 'react';
import {
    Activity,
    GitBranch,
    Package,
    CheckCircle2,
    Clock,
    Loader,
    Building2,
    Users,
    ListChecks,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { useRightSidebar } from '../hooks/useRightSidebar';
import { getDashboardStats } from '../api/endpoints/dashboard';

const ESTADO_LABELS = { pendiente: 'Pendiente', en_progreso: 'En progreso', completado: 'Completado' };

function StatCard({ label, value, icon: Icon, accent }) {
    return (
        <Card className="stat">
            <div className="stat__head">
                <span className="stat__icon" style={accent ? { background: accent + '22', color: accent } : {}}>
                    <Icon size={16} strokeWidth={2} />
                </span>
            </div>
            <div className="stat__value">{value ?? '—'}</div>
            <div className="stat__label">{label}</div>
        </Card>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    useRightSidebar(null);

    const [stats,   setStats]   = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getDashboardStats()
            .then(data => { if (!cancelled) setStats(data); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const isAdmin = user?.role === 'admin';

    return (
        <div className="page">
            <div className="page__header">
                <div>
                    <span className="page__kicker">// overview</span>
                    <h1 className="page__title">
                        Hola, {user?.name?.split(' ')[0] || 'dev'}
                    </h1>
                    <p className="page__subtitle">
                        {stats?.empresa_nombre
                            ? `Empresa: ${stats.empresa_nombre}`
                            : 'Resumen general del sistema.'}
                    </p>
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--fg-subtle)' }}>
                    <Loader size={24} strokeWidth={1.5} style={{ opacity: 0.4 }} />
                </div>
            ) : (
                <>
                    <div className="stats-grid">
                        {isAdmin && (
                            <StatCard
                                label="Empresas"
                                value={stats?.empresas ?? 0}
                                icon={Building2}
                            />
                        )}
                        <StatCard
                            label="Usuarios"
                            value={stats?.usuarios ?? 0}
                            icon={Users}
                        />
                        <StatCard
                            label="Tareas totales"
                            value={stats?.tareas_total ?? 0}
                            icon={ListChecks}
                        />
                        <StatCard
                            label="Completadas"
                            value={stats?.tareas_completado ?? 0}
                            icon={CheckCircle2}
                        />
                    </div>

                    <div className="panels-grid" style={{ marginTop: 16 }}>
                        {/* Estado de tareas */}
                        <Card>
                            <div className="panel__head">
                                <div>
                                    <div className="panel__kicker">// tareas · estado</div>
                                    <h3 className="panel__title">
                                        <Activity size={14} strokeWidth={2} />
                                        Estado de tareas
                                    </h3>
                                </div>
                            </div>
                            <div className="dash-tareas-estados">
                                {[
                                    { key: 'tareas_pendiente',   label: 'Pendiente',    cls: 'estado-badge--pendiente' },
                                    { key: 'tareas_en_progreso', label: 'En progreso',  cls: 'estado-badge--progreso' },
                                    { key: 'tareas_completado',  label: 'Completado',   cls: 'estado-badge--completado' },
                                ].map(({ key, label, cls }) => (
                                    <div key={key} className="dash-estado-row">
                                        <span className={`estado-badge ${cls}`}>{label}</span>
                                        <span className="dash-estado-val">{stats?.[key] ?? 0}</span>
                                        <div className="dash-estado-bar">
                                            <div
                                                className={`dash-estado-bar__fill dash-estado-bar__fill--${cls.replace('estado-badge--','')}`}
                                                style={{ width: stats?.tareas_total > 0 ? `${Math.round(((stats?.[key] ?? 0) / stats.tareas_total) * 100)}%` : '0%' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Info del usuario */}
                        <Card>
                            <div className="panel__head">
                                <div>
                                    <div className="panel__kicker">// sesión activa</div>
                                    <h3 className="panel__title">
                                        <Clock size={14} strokeWidth={2} />
                                        Tu cuenta
                                    </h3>
                                </div>
                            </div>
                            <div className="dash-user-info">
                                <div className="dash-user-avatar">
                                    {user?.name?.charAt(0).toUpperCase() ?? '?'}
                                </div>
                                <div className="dash-user-details">
                                    <div className="dash-user-name">{user?.name}</div>
                                    <div className="dash-user-email">{user?.email}</div>
                                    <div style={{ marginTop: 10 }}>
                                        <span className={`role-badge role-badge--${user?.role}`}>
                                            {{ admin: 'Administrador', admin_empresa: 'Admin Empresa', usuario_empresa: 'Usuario' }[user?.role] ?? user?.role}
                                        </span>
                                    </div>
                                    {stats?.empresa_nombre && (
                                        <div className="dash-user-empresa">
                                            <Building2 size={12} strokeWidth={2} />
                                            {stats.empresa_nombre}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
