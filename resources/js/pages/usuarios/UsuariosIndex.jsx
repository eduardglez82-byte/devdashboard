import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Users, Search, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useRightSidebar } from '../../hooks/useRightSidebar';
import { useAuth } from '../../hooks/useAuth';
import * as api from '../../api/endpoints/usuarios';
import { listarEmpresas } from '../../api/endpoints/empresas';

const ROLE_LABELS = { admin: 'Admin', admin_empresa: 'Admin Empresa', usuario_empresa: 'Usuario' };
const ROLE_CLASS  = { admin: 'role-badge--admin', admin_empresa: 'role-badge--admin_empresa', usuario_empresa: 'role-badge--usuario_empresa' };
const EMPTY_FORM  = { name: '', email: '', password: '', role: 'usuario_empresa', empresa_id: '' };
const getInitial  = name => (name || '?').charAt(0).toUpperCase();

export default function UsuariosIndex() {
    useRightSidebar(null);

    const { user: authUser } = useAuth();
    const isAdmin = authUser?.role === 'admin';

    const [usuarios, setUsuarios]   = useState([]);
    const [empresas, setEmpresas]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [modal, setModal]         = useState({ type: null, user: null });
    const [form, setForm]           = useState(EMPTY_FORM);
    const [saving, setSaving]       = useState(false);
    const [formError, setFormError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const calls = [api.listarUsuarios()];
            if (isAdmin) calls.push(listarEmpresas());
            const [users, emps] = await Promise.all(calls);
            setUsuarios(users);
            if (emps) setEmpresas(emps);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, empresa_id: isAdmin ? '' : (authUser?.empresa_id ?? '') });
        setFormError(null);
        setModal({ type: 'create', user: null });
    };
    const openEdit   = u => {
        setForm({ name: u.name, email: u.email, password: '', role: u.role, empresa_id: u.empresa_id ?? '' });
        setFormError(null);
        setModal({ type: 'edit', user: u });
    };
    const openDelete = u => setModal({ type: 'delete', user: u });
    const closeModal = ()  => setModal({ type: null, user: null });

    const handleChange = ({ target: { name, value } }) => setForm(f => ({ ...f, [name]: value }));

    const handleSave = async ev => {
        ev.preventDefault();
        setSaving(true);
        setFormError(null);
        try {
            const payload = {
                ...form,
                empresa_id: isAdmin ? (form.empresa_id || null) : (authUser?.empresa_id ?? null),
                role: isAdmin ? form.role : 'usuario_empresa',
            };
            if (modal.type === 'create') {
                const created = await api.crearUsuario(payload);
                setUsuarios(prev => [created, ...prev]);
            } else {
                if (!payload.password) delete payload.password;
                const updated = await api.actualizarUsuario(modal.user.id, payload);
                setUsuarios(prev => prev.map(x => x.id === updated.id ? updated : x));
            }
            closeModal();
        } catch (err) {
            setFormError(
                err?.response?.data?.message ||
                Object.values(err?.response?.data?.errors ?? {})?.[0]?.[0] ||
                'Error al guardar.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            await api.eliminarUsuario(modal.user.id);
            setUsuarios(prev => prev.filter(x => x.id !== modal.user.id));
            closeModal();
        } finally {
            setSaving(false);
        }
    };

    const filtered = usuarios.filter(u => {
        const q = search.toLowerCase();
        return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    return (
        <div className="page">
            <div className="page__header">
                <div>
                    <span className="page__kicker">// gestión</span>
                    <h1 className="page__title">Usuarios</h1>
                    <p className="page__subtitle">
                        {isAdmin ? 'Administra accesos y roles del sistema.' : 'Usuarios de tu empresa.'}
                    </p>
                </div>
                <Button variant="primary" onClick={openCreate}>
                    <Plus size={16} strokeWidth={2.5} />
                    <span>Nuevo usuario</span>
                </Button>
            </div>

            <Card padded={false}>
                <div style={{ padding: '16px 18px' }}>
                    <div className="toolbar">
                        <Input
                            className="toolbar__search"
                            placeholder="Buscar por nombre o email…"
                            icon={Search}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <Button variant="ghost" size="sm" onClick={load} title="Recargar">
                            <RefreshCw size={14} strokeWidth={2} />
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="empty">Cargando usuarios…</div>
                ) : filtered.length === 0 ? (
                    <div className="empty">
                        <Users size={32} strokeWidth={1.5} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                        <p>{search ? 'Sin resultados.' : 'No hay usuarios registrados.'}</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Rol</th>
                                    {isAdmin && <th>Empresa</th>}
                                    <th>Creado</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="user-avatar-sm">{getInitial(u.name)}</div>
                                                <div className="user-cell__info">
                                                    <span className="user-cell__name">{u.name}</span>
                                                    <span className="user-cell__email">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`role-badge ${ROLE_CLASS[u.role] ?? ''}`}>
                                                {ROLE_LABELS[u.role] ?? u.role}
                                            </span>
                                        </td>
                                        {isAdmin && <td className="cell-mono">{u.empresa?.nombre ?? '—'}</td>}
                                        <td className="cell-mono cell-sm">
                                            {new Date(u.created_at).toLocaleDateString('es-MX')}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button type="button" className="action-btn" onClick={() => openEdit(u)} title="Editar">
                                                    <Pencil size={14} strokeWidth={2} />
                                                </button>
                                                <button type="button" className="action-btn action-btn--danger" onClick={() => openDelete(u)} title="Eliminar">
                                                    <Trash2 size={14} strokeWidth={2} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Modal Crear / Editar */}
            <Modal
                open={modal.type === 'create' || modal.type === 'edit'}
                onClose={closeModal}
                title={modal.type === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
                size="md"
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input label="Nombre" name="name" value={form.name} onChange={handleChange} required autoFocus />
                    <Input label="Correo electrónico" name="email" type="email" value={form.email} onChange={handleChange} required />
                    <Input
                        label={modal.type === 'edit' ? 'Nueva contraseña (vacío = sin cambios)' : 'Contraseña'}
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required={modal.type === 'create'}
                        placeholder="••••••••"
                    />

                    {/* Solo admin puede asignar rol y empresa manualmente */}
                    {isAdmin ? (
                        <>
                            <div className="field-row">
                                <div className="field">
                                    <label className="field__label">Rol</label>
                                    <select name="role" className="field__select" value={form.role} onChange={handleChange} required>
                                        <option value="admin">Administrador</option>
                                        <option value="admin_empresa">Admin Empresa</option>
                                        <option value="usuario_empresa">Usuario</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label className="field__label">Empresa</label>
                                    <select name="empresa_id" className="field__select" value={form.empresa_id} onChange={handleChange}>
                                        <option value="">Sin empresa</option>
                                        {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* admin_empresa: rol y empresa fijos */
                        <div className="field">
                            <label className="field__label">Rol asignado</label>
                            <div style={{ padding: '8px 12px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--fg-muted)' }}>
                                Usuario de empresa (fijo)
                            </div>
                        </div>
                    )}

                    {formError && <div className="form-error">{formError}</div>}

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                        <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                        <Button type="submit" variant="primary" loading={saving}>
                            {modal.type === 'create' ? 'Crear usuario' : 'Guardar cambios'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Eliminar */}
            <Modal open={modal.type === 'delete'} onClose={closeModal} title="Eliminar usuario" size="sm">
                <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 20 }}>
                    ¿Eliminar a <strong style={{ color: 'var(--fg)' }}>{modal.user?.name}</strong>? Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                    <Button type="button" variant="danger" loading={saving} onClick={handleDelete}>Eliminar</Button>
                </div>
            </Modal>
        </div>
    );
}
