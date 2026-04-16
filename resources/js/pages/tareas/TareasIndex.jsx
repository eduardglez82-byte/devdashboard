import React, { useEffect, useState, useCallback } from 'react';
import { Plus, ListChecks, Pencil, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useRightSidebar } from '../../hooks/useRightSidebar';
import { useAuth } from '../../hooks/useAuth';
import NotasSidebar from '../../components/layout/NotasSidebar';
import { listarTareas, crearTarea, actualizarTarea, eliminarTarea } from '../../api/endpoints/tareas';
import { listarEmpresas } from '../../api/endpoints/empresas';
import { listarUsuarios } from '../../api/endpoints/usuarios';

/* ── helpers ─────────────────────────────────────────────────── */
const ESTADO_LABELS = { pendiente: 'Pendiente', en_progreso: 'En progreso', completado: 'Completado' };
const PRIO_LABELS   = { baja: 'Baja', media: 'Media', alta: 'Alta' };
const ESTADO_CLASS  = { pendiente: 'estado-badge--pendiente', en_progreso: 'estado-badge--progreso', completado: 'estado-badge--completado' };
const PRIO_CLASS    = { baja: 'prio-badge--baja', media: 'prio-badge--media', alta: 'prio-badge--alta' };
const EMPTY_FORM    = { titulo: '', descripcion: '', estado: 'pendiente', prioridad: 'media', empresa_id: '', asignado_a: '' };

/* ── tarea form modal ────────────────────────────────────────── */
function TareaFormModal({ tarea, empresas, usuarios, isAdmin, onClose, onSave }) {
    const [form, setForm] = useState(tarea ? {
        titulo:      tarea.titulo,
        descripcion: tarea.descripcion ?? '',
        estado:      tarea.estado,
        prioridad:   tarea.prioridad,
        empresa_id:  tarea.empresa_id ?? '',
        asignado_a:  tarea.asignado_a ?? '',
    } : EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.titulo.trim()) { setError('El título es obligatorio.'); return; }
        setSaving(true); setError('');
        try {
            const payload = { ...form, empresa_id: form.empresa_id || null, asignado_a: form.asignado_a || null };
            const saved = tarea ? await actualizarTarea(tarea.id, payload) : await crearTarea(payload);
            onSave(saved, !tarea);
        } catch (err) {
            const errs = err.response?.data?.errors;
            setError(errs ? Object.values(errs).flat().join(' ') : 'Error al guardar.');
            setSaving(false);
        }
    }

    return (
        <Modal open onClose={onClose} title={tarea ? 'Editar tarea' : 'Nueva tarea'} size="md">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && <div className="form-error">{error}</div>}

                <Input label="Título *" value={form.titulo} onChange={e => set('titulo', e.target.value)} autoFocus required />

                <div className="field">
                    <label className="field__label">Descripción</label>
                    <textarea
                        className="field__input field__textarea"
                        value={form.descripcion}
                        onChange={e => set('descripcion', e.target.value)}
                        rows={3}
                        placeholder="Descripción opcional…"
                    />
                </div>

                <div className="field-row">
                    <div className="field">
                        <label className="field__label">Estado</label>
                        <select className="field__select" value={form.estado} onChange={e => set('estado', e.target.value)}>
                            <option value="pendiente">Pendiente</option>
                            <option value="en_progreso">En progreso</option>
                            <option value="completado">Completado</option>
                        </select>
                    </div>
                    <div className="field">
                        <label className="field__label">Prioridad</label>
                        <select className="field__select" value={form.prioridad} onChange={e => set('prioridad', e.target.value)}>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                        </select>
                    </div>
                </div>

                {isAdmin && (
                    <div className="field">
                        <label className="field__label">Empresa</label>
                        <select className="field__select" value={form.empresa_id} onChange={e => set('empresa_id', e.target.value)}>
                            <option value="">Sin empresa</option>
                            {empresas.map(em => <option key={em.id} value={em.id}>{em.nombre}</option>)}
                        </select>
                    </div>
                )}

                <div className="field">
                    <label className="field__label">Asignado a</label>
                    <select className="field__select" value={form.asignado_a} onChange={e => set('asignado_a', e.target.value)}>
                        <option value="">Sin asignar</option>
                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="primary" loading={saving}>
                        {tarea ? 'Guardar cambios' : 'Crear tarea'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

/* ── page ────────────────────────────────────────────────────── */
export default function TareasIndex() {
    useRightSidebar(NotasSidebar);

    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [tareas,   setTareas]   = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [modal,    setModal]    = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const calls = [listarTareas(), listarUsuarios()];
            if (isAdmin) calls.push(listarEmpresas());
            const [t, u, e] = await Promise.all(calls);
            setTareas(t);
            setUsuarios(u);
            if (e) setEmpresas(e);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => { load(); }, [load]);

    function handleSaved(tarea, isNew) {
        setTareas(prev => isNew ? [tarea, ...prev] : prev.map(t => t.id === tarea.id ? tarea : t));
        setModal(null);
    }

    async function handleDelete() {
        const id = modal.tarea.id;
        setModal(null);
        try {
            await eliminarTarea(id);
            setTareas(prev => prev.filter(t => t.id !== id));
        } catch { load(); }
    }

    return (
        <div className="page">
            <div className="page__header">
                <div>
                    <span className="page__kicker">// kanban · lista</span>
                    <h1 className="page__title">Tareas</h1>
                    <p className="page__subtitle">Gestión de tareas y seguimiento de trabajo.</p>
                </div>
                <Button variant="primary" onClick={() => setModal({ type: 'form', tarea: null })}>
                    <Plus size={15} strokeWidth={2.5} /> Nueva tarea
                </Button>
            </div>

            <Card padded={false}>
                {loading ? (
                    <div className="empty" style={{ padding: '60px 40px' }}>
                        <ListChecks size={32} strokeWidth={1.5} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                        <p>Cargando tareas…</p>
                    </div>
                ) : tareas.length === 0 ? (
                    <div className="empty" style={{ padding: '60px 40px' }}>
                        <ListChecks size={32} strokeWidth={1.5} style={{ opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
                        <p>No hay tareas. Crea la primera.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Estado</th>
                                    <th>Prioridad</th>
                                    {isAdmin && <th>Empresa</th>}
                                    <th>Asignado a</th>
                                    <th style={{ width: 80 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {tareas.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <span style={{ fontWeight: 500 }}>{t.titulo}</span>
                                            {t.descripcion && (
                                                <div className="cell-sm">
                                                    {t.descripcion.length > 60 ? t.descripcion.substring(0, 60) + '…' : t.descripcion}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`estado-badge ${ESTADO_CLASS[t.estado]}`}>
                                                {ESTADO_LABELS[t.estado]}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`prio-badge ${PRIO_CLASS[t.prioridad]}`}>
                                                {PRIO_LABELS[t.prioridad]}
                                            </span>
                                        </td>
                                        {isAdmin && <td className="cell-sm">{t.empresa?.nombre ?? '—'}</td>}
                                        <td className="cell-sm">{t.asignado?.name ?? '—'}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="action-btn" title="Editar"
                                                    onClick={() => setModal({ type: 'form', tarea: t })}>
                                                    <Pencil size={14} />
                                                </button>
                                                <button className="action-btn action-btn--danger" title="Eliminar"
                                                    onClick={() => setModal({ type: 'delete', tarea: t })}>
                                                    <Trash2 size={14} />
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

            {modal?.type === 'form' && (
                <TareaFormModal
                    tarea={modal.tarea}
                    empresas={empresas}
                    usuarios={usuarios}
                    isAdmin={isAdmin}
                    onClose={() => setModal(null)}
                    onSave={handleSaved}
                />
            )}

            <Modal open={modal?.type === 'delete'} onClose={() => setModal(null)} title="Eliminar tarea" size="sm">
                <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 20 }}>
                    ¿Eliminar <strong style={{ color: 'var(--fg)' }}>{modal?.tarea?.titulo}</strong>? Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <Button variant="secondary" onClick={() => setModal(null)}>Cancelar</Button>
                    <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
                </div>
            </Modal>
        </div>
    );
}
