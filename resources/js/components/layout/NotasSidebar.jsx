import React, { useEffect, useState, useCallback } from 'react';
import { StickyNote, Plus, Trash2, User, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listarNotas, crearNota, eliminarNota } from '../../api/endpoints/notas';

function formatDate(str) {
    return new Date(str).toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

export default function NotasSidebar() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [notas,   setNotas]   = useState([]);
    const [nueva,   setNueva]   = useState('');
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setNotas(await listarNotas());
        } catch {
            /* silencioso */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    async function handleAdd(e) {
        e.preventDefault();
        const texto = nueva.trim();
        if (!texto) return;
        setSaving(true);
        try {
            const nota = await crearNota({ contenido: texto });
            setNotas(prev => [nota, ...prev]);
            setNueva('');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        try {
            await eliminarNota(id);
            setNotas(prev => prev.filter(n => n.id !== id));
        } catch { /* silencioso */ }
    }

    return (
        <div className="ctx-sidebar">
            {/* header */}
            <div className="ctx-sidebar__section">
                <div className="ctx-sidebar__label">// notas</div>
                <form onSubmit={handleAdd} className="nota-form">
                    <textarea
                        className="nota-form__input"
                        placeholder="Escribe una nota…"
                        value={nueva}
                        onChange={e => setNueva(e.target.value)}
                        rows={3}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd(e);
                        }}
                    />
                    <button
                        type="submit"
                        className="nota-form__btn"
                        disabled={saving || !nueva.trim()}
                    >
                        {saving
                            ? <Loader size={12} className="nota-form__spinner" />
                            : <Plus size={12} strokeWidth={2.5} />}
                        <span>Agregar nota</span>
                    </button>
                </form>
            </div>

            {/* list */}
            <div className="ctx-sidebar__section">
                {loading ? (
                    <div className="notas-empty">
                        <Loader size={16} strokeWidth={1.5} style={{ opacity: 0.4 }} />
                    </div>
                ) : notas.length === 0 ? (
                    <div className="notas-empty">
                        <StickyNote size={20} strokeWidth={1.5} />
                        <span>Sin notas aún</span>
                    </div>
                ) : (
                    <ul className="notas-list">
                        {notas.map(nota => (
                            <li key={nota.id} className="nota-item">
                                {isAdmin && nota.usuario && (
                                    <div className="nota-item__author">
                                        <User size={9} strokeWidth={2.5} />
                                        {nota.usuario.name}
                                    </div>
                                )}
                                <p className="nota-item__contenido">{nota.contenido}</p>
                                <div className="nota-item__footer">
                                    <span className="nota-item__time">{formatDate(nota.created_at)}</span>
                                    <button
                                        className="nota-item__del"
                                        onClick={() => handleDelete(nota.id)}
                                        title="Eliminar nota"
                                        type="button"
                                    >
                                        <Trash2 size={11} strokeWidth={2} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
