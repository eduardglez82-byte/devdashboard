import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Building2, Search, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useRightSidebar } from '../../hooks/useRightSidebar';
import * as api from '../../api/endpoints/empresas';

const EMPTY_FORM = { nombre: '', rfc: '', email: '', telefono: '', estatus: 'activo' };

export default function EmpresasIndex() {
    useRightSidebar(null);

    const [empresas, setEmpresas]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState('');
    const [modal, setModal]         = useState({ type: null, empresa: null });
    const [form, setForm]           = useState(EMPTY_FORM);
    const [saving, setSaving]       = useState(false);
    const [formError, setFormError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setEmpresas(await api.listarEmpresas());
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setForm(EMPTY_FORM); setFormError(null); setModal({ type: 'create', empresa: null }); };
    const openEdit   = (e) => {
        setForm({ nombre: e.nombre, rfc: e.rfc ?? '', email: e.email ?? '', telefono: e.telefono ?? '', estatus: e.estatus });
        setFormError(null);
        setModal({ type: 'edit', empresa: e });
    };
    const openDelete = (e) => setModal({ type: 'delete', empresa: e });
    const closeModal = ()  => setModal({ type: null, empresa: null });

    const handleChange = ({ target: { name, value } }) => setForm((f) => ({ ...f, [name]: value }));

    const handleSave = async (ev) => {
        ev.preventDefault();
        setSaving(true);
        setFormError(null);
        try {
            if (modal.type === 'create') {
                const created = await api.crearEmpresa(form);
                setEmpresas((prev) => [created, ...prev]);
            } else {
                const updated = await api.actualizarEmpresa(modal.empresa.id, form);
                setEmpresas((prev) => prev.map((x) => x.id === updated.id ? updated : x));
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
            await api.eliminarEmpresa(modal.empresa.id);
            setEmpresas((prev) => prev.filter((x) => x.id !== modal.empresa.id));
            closeModal();
        } finally {
            setSaving(false);
        }
    };

    const filtered = empresas.filter((e) => {
        const q = search.toLowerCase();
        return !q || e.nombre.toLowerCase().includes(q) || (e.rfc ?? '').toLowerCase().includes(q);
    });

    return (
        <div className="page">
            <div className="page__header">
                <div>
                    <span className="page__kicker">// gestión</span>
                    <h1 className="page__title">Empresas</h1>
                    <p className="page__subtitle">Administra las empresas del sistema.</p>
                </div>
                <Button variant="primary" onClick={openCreate}>
                    <Plus size={16} strokeWidth={2.5} />
                    <span>Nueva empresa</span>
                </Button>
            </div>

            <Card padded={false}>
                <div style={{ padding: '16px 18px' }}>
                    <div className="toolbar">
                        <Input
                            className="toolbar__search"
                            placeholder="Buscar por nombre o RFC…"
                            icon={Search}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button variant="ghost" size="sm" onClick={load} title="Recargar">
                            <RefreshCw size={14} strokeWidth={2} />
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="empty">Cargando empresas…</div>
                ) : filtered.length === 0 ? (
                    <div className="empty">
                        <Building2 size={32} strokeWidth={1.5} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                        <p>{search ? 'Sin resultados.' : 'No hay empresas registradas.'}</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>RFC</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th>Usuarios</th>
                                    <th>Estatus</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((emp) => (
                                    <tr key={emp.id}>
                                        <td style={{ fontWeight: 500 }}>{emp.nombre}</td>
                                        <td className="cell-mono">{emp.rfc ?? '—'}</td>
                                        <td className="cell-sm">{emp.email ?? '—'}</td>
                                        <td className="cell-mono">{emp.telefono ?? '—'}</td>
                                        <td className="cell-mono">{emp.usuarios_count ?? 0}</td>
                                        <td>
                                            <span className={`badge ${emp.estatus === 'activo' ? 'badge--ok' : 'badge--muted'}`}>
                                                {emp.estatus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button type="button" className="action-btn" onClick={() => openEdit(emp)} title="Editar">
                                                    <Pencil size={14} strokeWidth={2} />
                                                </button>
                                                <button type="button" className="action-btn action-btn--danger" onClick={() => openDelete(emp)} title="Eliminar">
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
                title={modal.type === 'create' ? 'Nueva empresa' : 'Editar empresa'}
                size="md"
            >
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required autoFocus />
                    <Input label="RFC" name="rfc" value={form.rfc} onChange={handleChange} placeholder="Opcional" />
                    <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Opcional" />
                    <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Opcional" />
                    <div className="field">
                        <label className="field__label">Estatus</label>
                        <select name="estatus" className="field__select" value={form.estatus} onChange={handleChange}>
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                    </div>
                    {formError && <div className="login__error">{formError}</div>}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                        <Button type="submit" variant="primary" loading={saving}>
                            {modal.type === 'create' ? 'Crear empresa' : 'Guardar cambios'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Eliminar */}
            <Modal open={modal.type === 'delete'} onClose={closeModal} title="Eliminar empresa" size="sm">
                <p style={{ color: 'var(--fg-muted)', fontSize: '13px', marginBottom: '20px' }}>
                    ¿Eliminar <strong style={{ color: 'var(--fg)' }}>{modal.empresa?.nombre}</strong>?
                    Los usuarios ligados quedarán sin empresa asignada.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                    <Button type="button" variant="danger" loading={saving} onClick={handleDelete}>Eliminar</Button>
                </div>
            </Modal>
        </div>
    );
}
