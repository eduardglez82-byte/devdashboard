import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Kanban, GripVertical } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { useRightSidebar } from '../../hooks/useRightSidebar';
import { useAuth } from '../../hooks/useAuth';
import NotasSidebar from '../../components/layout/NotasSidebar';
import { listarTareas, crearTarea, actualizarTarea } from '../../api/endpoints/tareas';
import { listarEmpresas } from '../../api/endpoints/empresas';
import { listarUsuarios } from '../../api/endpoints/usuarios';

/* ── constants ───────────────────────────────────────────────── */
const COLUMNS = [
    { key: 'pendiente',   label: 'Pendiente',   accent: 'col--pendiente'  },
    { key: 'en_progreso', label: 'En progreso',  accent: 'col--progreso'   },
    { key: 'completado',  label: 'Completado',   accent: 'col--completado' },
];
const PRIO_CLASS  = { baja: 'prio-badge--baja', media: 'prio-badge--media', alta: 'prio-badge--alta' };
const PRIO_LABELS = { baja: 'Baja', media: 'Media', alta: 'Alta' };

/* ── tarea form modal ────────────────────────────────────────── */
function TareaFormModal({ tarea, empresas, usuarios, isAdmin, defaultEstado, onClose, onSave }) {
    const [form, setForm] = useState(tarea ? {
        titulo:      tarea.titulo,
        descripcion: tarea.descripcion ?? '',
        estado:      tarea.estado,
        prioridad:   tarea.prioridad,
        empresa_id:  tarea.empresa_id ?? '',
        asignado_a:  tarea.asignado_a ?? '',
    } : {
        titulo: '', descripcion: '', estado: defaultEstado ?? 'pendiente',
        prioridad: 'media', empresa_id: '', asignado_a: '',
    });
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

/* ── kanban card ─────────────────────────────────────────────── */
function KanbanCard({ tarea, onEdit, onDragStart, onDragEnd }) {
    const initials = name => name
        ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : '?';

    return (
        <div
            className="kanban-card"
            draggable
            onDragStart={e => onDragStart(e, tarea)}
            onDragEnd={onDragEnd}
            onClick={() => onEdit(tarea)}
        >
            <div className="kanban-card__drag-handle">
                <GripVertical size={12} strokeWidth={2} />
            </div>
            <div className="kanban-card__titulo">{tarea.titulo}</div>
            {tarea.descripcion && (
                <div className="kanban-card__desc">
                    {tarea.descripcion.length > 80 ? tarea.descripcion.substring(0, 80) + '…' : tarea.descripcion}
                </div>
            )}
            <div className="kanban-card__footer">
                <span className={`prio-badge ${PRIO_CLASS[tarea.prioridad]}`}>
                    {PRIO_LABELS[tarea.prioridad]}
                </span>
                <div className="kanban-card__meta">
                    {tarea.empresa && (
                        <span className="kanban-card__empresa">{tarea.empresa.nombre}</span>
                    )}
                    {tarea.asignado && (
                        <span className="kanban-card__assignee" title={tarea.asignado.name}>
                            {initials(tarea.asignado.name)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── kanban column ───────────────────────────────────────────── */
function KanbanColumn({ col, tareas, onAddCard, onEdit, onDragStart, onDragEnd, onDrop, onDragOver, onDragLeave, isOver }) {
    return (
        <div className={`kanban-col ${isOver ? 'kanban-col--over' : ''}`}>
            <div className={`kanban-col__header ${col.accent}`}>
                <span className="kanban-col__label">{col.label}</span>
                <span className="kanban-col__count">{tareas.length}</span>
            </div>
            <div
                className="kanban-col__body"
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragLeave={onDragLeave}
            >
                {tareas.map(t => (
                    <KanbanCard
                        key={t.id}
                        tarea={t}
                        onEdit={onEdit}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                    />
                ))}
                <button className="kanban-col__add" type="button" onClick={() => onAddCard(col.key)}>
                    <Plus size={13} strokeWidth={2.5} />
                    Agregar tarea
                </button>
            </div>
        </div>
    );
}

/* ── page ────────────────────────────────────────────────────── */
export default function KanbanIndex() {
    useRightSidebar(NotasSidebar);

    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [tareas,   setTareas]   = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [modal,    setModal]    = useState(null);
    const [overCol,  setOverCol]  = useState(null);
    const dragItem = useRef(null);

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

    /* drag handlers */
    function handleDragStart(e, tarea) {
        dragItem.current = tarea;
        e.dataTransfer.effectAllowed = 'move';
    }
    function handleDragEnd() {
        dragItem.current = null;
        setOverCol(null);
    }
    function handleDragOver(e, colKey) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverCol(colKey);
    }
    function handleDragLeave(e) {
        if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null);
    }
    async function handleDrop(e, colKey) {
        e.preventDefault();
        setOverCol(null);
        const tarea = dragItem.current;
        if (!tarea || tarea.estado === colKey) return;

        setTareas(prev => prev.map(t => t.id === tarea.id ? { ...t, estado: colKey } : t));
        try {
            const updated = await actualizarTarea(tarea.id, { estado: colKey });
            setTareas(prev => prev.map(t => t.id === updated.id ? updated : t));
        } catch {
            setTareas(prev => prev.map(t => t.id === tarea.id ? tarea : t));
        }
    }

    function handleSaved(tarea, isNew) {
        setTareas(prev => isNew ? [tarea, ...prev] : prev.map(t => t.id === tarea.id ? tarea : t));
        setModal(null);
    }

    if (loading) {
        return (
            <div className="page">
                <div className="page__header">
                    <div>
                        <span className="page__kicker">// kanban · tablero</span>
                        <h1 className="page__title">Tablero</h1>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--fg-subtle)' }}>
                    <Kanban size={32} strokeWidth={1.5} style={{ opacity: 0.3 }} />
                </div>
            </div>
        );
    }

    return (
        <div className="page page--kanban">
            <div className="page__header">
                <div>
                    <span className="page__kicker">// kanban · tablero</span>
                    <h1 className="page__title">Tablero</h1>
                    <p className="page__subtitle">Arrastra las tarjetas entre columnas para cambiar el estado.</p>
                </div>
                <Button variant="primary" onClick={() => setModal({ tarea: null, defaultEstado: 'pendiente' })}>
                    <Plus size={15} strokeWidth={2.5} /> Nueva tarea
                </Button>
            </div>

            <div className="kanban-board">
                {COLUMNS.map(col => (
                    <KanbanColumn
                        key={col.key}
                        col={col}
                        tareas={tareas.filter(t => t.estado === col.key)}
                        isOver={overCol === col.key}
                        onAddCard={estado => setModal({ tarea: null, defaultEstado: estado })}
                        onEdit={t => setModal({ tarea: t, defaultEstado: t.estado })}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => handleDragOver(e, col.key)}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, col.key)}
                    />
                ))}
            </div>

            {modal && (
                <TareaFormModal
                    tarea={modal.tarea}
                    defaultEstado={modal.defaultEstado}
                    empresas={empresas}
                    usuarios={usuarios}
                    isAdmin={isAdmin}
                    onClose={() => setModal(null)}
                    onSave={handleSaved}
                />
            )}
        </div>
    );
}
