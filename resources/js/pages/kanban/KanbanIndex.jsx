import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Plus, Kanban, GripVertical, Search, Filter, Timer, Flame, CheckCircle2, Circle, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import PomodoroWidget from '../../components/pomodoro/PomodoroWidget';
import { useRightSidebar } from '../../hooks/useRightSidebar';
import { useAuth } from '../../hooks/useAuth';
import NotasSidebar from '../../components/layout/NotasSidebar';
import { listarTareas, crearTarea, actualizarTarea, eliminarTarea } from '../../api/endpoints/tareas';
import { listarEmpresas } from '../../api/endpoints/empresas';
import { listarUsuarios } from '../../api/endpoints/usuarios';
import { pomodoroStats } from '../../api/endpoints/pomodoro';

/* ── constants ───────────────────────────────────────────────── */
const COLUMNS = [
    { key: 'pendiente',   label: 'Pendiente',   accent: 'col--pendiente',  icon: Circle        },
    { key: 'en_progreso', label: 'En progreso', accent: 'col--progreso',   icon: Clock         },
    { key: 'completado',  label: 'Completado',  accent: 'col--completado', icon: CheckCircle2  },
];
const PRIO_CLASS  = { baja: 'prio-badge--baja', media: 'prio-badge--media', alta: 'prio-badge--alta' };
const PRIO_LABELS = { baja: 'Baja', media: 'Media', alta: 'Alta' };

function fmtDuration(s) {
    if (!s) return '0m';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    return `${m}m`;
}

/* ── tarea form modal ────────────────────────────────────────── */
function TareaFormModal({ tarea, empresas, usuarios, isAdmin, defaultEstado, onClose, onSave, onDelete }) {
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

    async function handleDelete() {
        if (!tarea) return;
        if (!confirm('¿Eliminar esta tarea?')) return;
        setSaving(true);
        try {
            await eliminarTarea(tarea.id);
            onDelete(tarea.id);
        } catch {
            setError('Error al eliminar.');
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

                <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', paddingTop: 4 }}>
                    <div>
                        {tarea && (
                            <Button type="button" variant="ghost" onClick={handleDelete} disabled={saving} style={{ color: 'var(--danger)' }}>
                                Eliminar
                            </Button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" variant="primary" loading={saving}>
                            {tarea ? 'Guardar cambios' : 'Crear tarea'}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

/* ── kanban card ─────────────────────────────────────────────── */
function KanbanCard({ tarea, focoSegundos, isDragging, onEdit, onFocus, onPointerStartDrag }) {
    const initials = name => name
        ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : '?';

    function handlePointerDown(e) {
        // Si el toque inició sobre un botón interno (Pomodoro), no arrastrar
        if (e.target.closest('button')) return;
        // Solo botón izquierdo del mouse o cualquier touch/pen
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        onPointerStartDrag(e, tarea);
    }

    return (
        <div
            className={`kanban-card kanban-card--${tarea.prioridad} ${isDragging ? 'kanban-card--dragging' : ''}`}
            onPointerDown={handlePointerDown}
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
                    {focoSegundos > 0 && (
                        <span className="kanban-card__pomo" title={`${fmtDuration(focoSegundos)} de foco`}>
                            <Timer size={9} strokeWidth={2.4} />
                            {fmtDuration(focoSegundos)}
                        </span>
                    )}
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
            <button
                type="button"
                className="kanban-card__focus-btn"
                onClick={(e) => { e.stopPropagation(); onFocus(tarea); }}
                title="Iniciar Pomodoro con esta tarea"
            >
                <Timer size={11} strokeWidth={2.4} />
            </button>
        </div>
    );
}

/* ── kanban column ───────────────────────────────────────────── */
function KanbanColumn({ col, tareas, focoMap, draggingId, onAddCard, onEdit, onFocus, onPointerStartDrag, isOver }) {
    const Icon = col.icon;
    return (
        <div className={`kanban-col ${isOver ? 'kanban-col--over' : ''}`} data-col-key={col.key}>
            <div className={`kanban-col__header ${col.accent}`}>
                <span className="kanban-col__label">
                    <Icon size={11} strokeWidth={2.4} style={{ marginRight: 5, verticalAlign: '-1px' }} />
                    {col.label}
                </span>
                <span className="kanban-col__count">{tareas.length}</span>
            </div>
            <div className="kanban-col__body" data-col-key={col.key}>
                {tareas.map(t => (
                    <KanbanCard
                        key={t.id}
                        tarea={t}
                        focoSegundos={focoMap[t.id] || 0}
                        isDragging={draggingId === t.id}
                        onEdit={onEdit}
                        onFocus={onFocus}
                        onPointerStartDrag={onPointerStartDrag}
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
    const [search,   setSearch]   = useState('');
    const [filterPrio, setFilterPrio] = useState('all');
    const [filterUser, setFilterUser] = useState('all');
    const [showPomo, setShowPomo] = useState(true);
    const [stats, setStats]       = useState(null);
    const [focoTareaId, setFocoTareaId] = useState('');
    /* Drag state — funciona con mouse y touch via Pointer Events */
    const [drag, setDrag] = useState(null); // { tarea, x, y, w, h, dx, dy } | null
    const dragStateRef = useRef(null);
    const pomoRef = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const calls = [listarTareas(), listarUsuarios(), pomodoroStats()];
            if (isAdmin) calls.push(listarEmpresas());
            const [t, u, s, e] = await Promise.all(calls);
            setTareas(t);
            setUsuarios(u);
            setStats(s);
            if (e) setEmpresas(e);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => { load(); }, [load]);

    /* ─── Drag & Drop con Pointer Events (mouse + touch) ────────── */
    /*
     * Flujo:
     *  - pointerdown sobre una card → registramos posición inicial.
     *  - en touch: long-press 200ms o move 8px → arranca drag.
     *  - en mouse: move 4px → arranca drag inmediato.
     *  - durante drag: el ghost sigue al puntero, detectamos columna debajo
     *    con elementFromPoint, prevenimos scroll global con touch-action: none.
     *  - pointerup: si hubo drag → drop en la columna; si no → tap = onEdit.
     */
    const handlePointerStartDrag = useCallback((e, tarea) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const isTouch = e.pointerType === 'touch';

        const state = {
            tarea,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            width: rect.width,
            height: rect.height,
            dragging: false,
            timer: null,
            target: e.currentTarget,
            tapped: true,
        };
        dragStateRef.current = state;

        const startDrag = (x, y) => {
            if (state.dragging) return;
            state.dragging = true;
            state.tapped = false;
            try { state.target.setPointerCapture(state.pointerId); } catch {}
            // Bloquear scroll del body durante drag
            document.body.classList.add('kanban-dragging');
            // Haptic feedback en móvil
            if (isTouch && navigator.vibrate) navigator.vibrate(15);
            setDrag({
                tarea: state.tarea,
                x, y,
                width: state.width,
                height: state.height,
                offsetX: state.offsetX,
                offsetY: state.offsetY,
            });
        };

        // En touch: long-press 200ms; en mouse: arranca con un poco de movimiento
        if (isTouch) {
            state.timer = setTimeout(() => startDrag(state.startX, state.startY), 200);
        }

        const onMove = (ev) => {
            const dx = ev.clientX - state.startX;
            const dy = ev.clientY - state.startY;
            const dist = Math.hypot(dx, dy);
            // Threshold para arrancar drag desde mouse (4px) o touch antes de timer (8px)
            if (!state.dragging && dist > (isTouch ? 8 : 4)) {
                clearTimeout(state.timer);
                startDrag(ev.clientX, ev.clientY);
            }
            if (state.dragging) {
                ev.preventDefault();
                setDrag(d => d ? { ...d, x: ev.clientX, y: ev.clientY } : d);
                // Detectar columna debajo del puntero
                const el = document.elementFromPoint(ev.clientX, ev.clientY);
                const colEl = el?.closest('[data-col-key]');
                setOverCol(colEl?.dataset.colKey ?? null);
            }
        };

        const onUp = async (ev) => {
            clearTimeout(state.timer);
            state.target.removeEventListener('pointermove', onMove);
            state.target.removeEventListener('pointerup', onUp);
            state.target.removeEventListener('pointercancel', onCancel);

            if (state.dragging) {
                document.body.classList.remove('kanban-dragging');
                try { state.target.releasePointerCapture(state.pointerId); } catch {}

                // Detectar columna destino
                const el = document.elementFromPoint(ev.clientX, ev.clientY);
                const colEl = el?.closest('[data-col-key]');
                const targetCol = colEl?.dataset.colKey;

                setDrag(null);
                setOverCol(null);

                if (targetCol && targetCol !== state.tarea.estado) {
                    const t = state.tarea;
                    // Update optimista
                    setTareas(prev => prev.map(x => x.id === t.id ? { ...x, estado: targetCol } : x));
                    try {
                        const updated = await actualizarTarea(t.id, { estado: targetCol });
                        setTareas(prev => prev.map(x => x.id === updated.id ? updated : x));
                    } catch {
                        setTareas(prev => prev.map(x => x.id === t.id ? t : x));
                    }
                }
            } else if (state.tapped) {
                // Tap simple → abrir modal de edición
                setModal({ tarea: state.tarea, defaultEstado: state.tarea.estado });
            }
            dragStateRef.current = null;
        };

        const onCancel = () => {
            clearTimeout(state.timer);
            state.target.removeEventListener('pointermove', onMove);
            state.target.removeEventListener('pointerup', onUp);
            state.target.removeEventListener('pointercancel', onCancel);
            document.body.classList.remove('kanban-dragging');
            setDrag(null);
            setOverCol(null);
            dragStateRef.current = null;
        };

        state.target.addEventListener('pointermove', onMove);
        state.target.addEventListener('pointerup', onUp);
        state.target.addEventListener('pointercancel', onCancel);
    }, []);

    // Cleanup defensivo si el componente se desmonta a media drag
    useEffect(() => () => { document.body.classList.remove('kanban-dragging'); }, []);

    function handleSaved(tarea, isNew) {
        setTareas(prev => isNew ? [tarea, ...prev] : prev.map(t => t.id === tarea.id ? tarea : t));
        setModal(null);
    }

    function handleDeleted(id) {
        setTareas(prev => prev.filter(t => t.id !== id));
        setModal(null);
    }

    function handleFocusTarea(tarea) {
        setFocoTareaId(String(tarea.id));
        setShowPomo(true);
        setTimeout(() => {
            pomoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }

    async function handlePomoComplete() {
        try {
            const s = await pomodoroStats();
            setStats(s);
        } catch {}
    }

    /* Filtered tareas + map de foco por tarea */
    const filteredTareas = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tareas.filter(t => {
            if (q && !t.titulo.toLowerCase().includes(q) && !(t.descripcion ?? '').toLowerCase().includes(q)) return false;
            if (filterPrio !== 'all' && t.prioridad !== filterPrio) return false;
            if (filterUser !== 'all') {
                if (filterUser === 'mine' && String(t.asignado_a) !== String(user?.id)) return false;
                if (filterUser !== 'mine' && String(t.asignado_a) !== String(filterUser)) return false;
            }
            return true;
        });
    }, [tareas, search, filterPrio, filterUser, user]);

    const focoMap = useMemo(() => {
        const map = {};
        (stats?.per_tarea ?? []).forEach(row => { map[row.tarea_id] = row.segundos; });
        return map;
    }, [stats]);

    const counts = useMemo(() => ({
        total:     tareas.length,
        pendiente: tareas.filter(t => t.estado === 'pendiente').length,
        progreso:  tareas.filter(t => t.estado === 'en_progreso').length,
        completado: tareas.filter(t => t.estado === 'completado').length,
        alta:      tareas.filter(t => t.prioridad === 'alta' && t.estado !== 'completado').length,
    }), [tareas]);

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
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                        variant={showPomo ? 'primary' : 'secondary'}
                        onClick={() => setShowPomo(s => !s)}
                        title="Mostrar/ocultar Pomodoro"
                    >
                        <Timer size={15} strokeWidth={2.5} /> Pomodoro
                    </Button>
                    <Button variant="primary" onClick={() => setModal({ tarea: null, defaultEstado: 'pendiente' })}>
                        <Plus size={15} strokeWidth={2.5} /> Nueva tarea
                    </Button>
                </div>
            </div>

            {/* Stats strip */}
            <div className="kanban-stats">
                <div className="kanban-stat">
                    <span className="kanban-stat__label">Total</span>
                    <span className="kanban-stat__value">{counts.total}</span>
                </div>
                <div className="kanban-stat kanban-stat--pendiente">
                    <span className="kanban-stat__label">Pendiente</span>
                    <span className="kanban-stat__value">{counts.pendiente}</span>
                </div>
                <div className="kanban-stat kanban-stat--progreso">
                    <span className="kanban-stat__label">En curso</span>
                    <span className="kanban-stat__value">{counts.progreso}</span>
                </div>
                <div className="kanban-stat kanban-stat--completado">
                    <span className="kanban-stat__label">Completado</span>
                    <span className="kanban-stat__value">{counts.completado}</span>
                </div>
                <div className="kanban-stat kanban-stat--alta">
                    <span className="kanban-stat__label"><Flame size={11} strokeWidth={2.4} /> Alta prio</span>
                    <span className="kanban-stat__value">{counts.alta}</span>
                </div>
                <div className="kanban-stat kanban-stat--foco">
                    <span className="kanban-stat__label"><Timer size={11} strokeWidth={2.4} /> Foco hoy</span>
                    <span className="kanban-stat__value">{fmtDuration(stats?.today_seconds ?? 0)}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="kanban-toolbar">
                <div className="kanban-search">
                    <Search size={13} strokeWidth={2} />
                    <input
                        type="text"
                        placeholder="Buscar tarea…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="kanban-filter">
                    <Filter size={12} strokeWidth={2} />
                    <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)}>
                        <option value="all">Todas las prioridades</option>
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                        <option value="baja">Baja</option>
                    </select>
                </div>
                <div className="kanban-filter">
                    <select value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                        <option value="all">Todos los usuarios</option>
                        <option value="mine">Mis tareas</option>
                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Pomodoro panel + Kanban */}
            <div className={`kanban-layout ${showPomo ? 'kanban-layout--with-pomo' : ''}`}>
                {showPomo && (
                    <aside className="kanban-pomo-wrap" ref={pomoRef}>
                        <PomodoroWidget
                            key={focoTareaId /* re-mount to set tareaId via prop */}
                            tareas={tareas.filter(t => t.estado !== 'completado')}
                            onSessionComplete={handlePomoComplete}
                            initialTareaId={focoTareaId}
                        />
                    </aside>
                )}

                <div className="kanban-board">
                    {COLUMNS.map(col => (
                        <KanbanColumn
                            key={col.key}
                            col={col}
                            tareas={filteredTareas.filter(t => t.estado === col.key)}
                            focoMap={focoMap}
                            draggingId={drag?.tarea?.id}
                            isOver={overCol === col.key}
                            onAddCard={estado => setModal({ tarea: null, defaultEstado: estado })}
                            onEdit={t => setModal({ tarea: t, defaultEstado: t.estado })}
                            onFocus={handleFocusTarea}
                            onPointerStartDrag={handlePointerStartDrag}
                        />
                    ))}
                </div>
            </div>

            {/* Ghost element que sigue al puntero durante drag */}
            {drag && (
                <div
                    className="kanban-ghost"
                    style={{
                        width:  drag.width,
                        height: drag.height,
                        transform: `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px) rotate(2deg)`,
                    }}
                    aria-hidden="true"
                >
                    <div className={`kanban-card kanban-card--${drag.tarea.prioridad}`}>
                        <div className="kanban-card__titulo">{drag.tarea.titulo}</div>
                        <div className="kanban-card__footer">
                            <span className={`prio-badge ${PRIO_CLASS[drag.tarea.prioridad]}`}>
                                {PRIO_LABELS[drag.tarea.prioridad]}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {modal && (
                <TareaFormModal
                    tarea={modal.tarea}
                    defaultEstado={modal.defaultEstado}
                    empresas={empresas}
                    usuarios={usuarios}
                    isAdmin={isAdmin}
                    onClose={() => setModal(null)}
                    onSave={handleSaved}
                    onDelete={handleDeleted}
                />
            )}
        </div>
    );
}
