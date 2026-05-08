import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, X, Sparkles, Minimize2, Trash2, Loader2 } from 'lucide-react';
import { aiChat } from '../../api/endpoints/ai';

const STORAGE_KEY = 'devdashboard:ai-chat:history';

const SUGGESTIONS = [
    'Dame 3 ideas para organizar mi semana',
    'Resume las técnicas de Pomodoro',
    'Cómo priorizar tareas urgentes',
    'Escribe un commit message claro',
];

export default function FloatingChat() {
    const [open, setOpen]         = useState(false);
    const [messages, setMessages] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    });
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [unread, setUnread]     = useState(0);
    const endRef   = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))); }
        catch {}
    }, [messages]);

    useEffect(() => {
        if (open) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
            setUnread(0);
            setTimeout(() => inputRef.current?.focus(), 240);
        }
    }, [open, messages]);

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape' && open) setOpen(false);
            // Ctrl/Cmd + K to toggle
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen(o => !o);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const send = useCallback(async (text) => {
        const content = (text ?? input).trim();
        if (!content || loading) return;
        const userMsg = { role: 'user', content };
        const next = [...messages, userMsg];
        setMessages(next);
        setInput('');
        setLoading(true);
        setError('');
        try {
            const res = await aiChat(next.map(m => ({ role: m.role, content: m.content })));
            if (res.error) {
                setError(res.error);
            } else {
                const reply = (res.content || '').trim() || 'Sin respuesta.';
                setMessages(p => [...p, { role: 'assistant', content: reply, model: res.model }]);
                if (!open) setUnread(u => u + 1);
            }
        } catch (err) {
            const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Error de conexión.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, open]);

    function clearAll() {
        if (!confirm('¿Borrar la conversación?')) return;
        setMessages([]);
        setError('');
    }

    function handleSubmit(e) {
        e.preventDefault();
        send();
    }

    return (
        <>
            {/* Backdrop blur cuando está abierto */}
            <div
                className={`fchat-backdrop ${open ? 'fchat-backdrop--on' : ''}`}
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />

            {/* Container que hace morph entre pill y card */}
            <div className={`fchat ${open ? 'fchat--open' : 'fchat--closed'}`}>
                {!open ? (
                    <button
                        type="button"
                        className="fchat__orb"
                        onClick={() => setOpen(true)}
                        title="Asistente IA  ·  Ctrl+K"
                        aria-label="Abrir asistente IA"
                    >
                        {/* Halos exteriores */}
                        <span className="fchat__orb-ring fchat__orb-ring--1" aria-hidden="true" />
                        <span className="fchat__orb-ring fchat__orb-ring--2" aria-hidden="true" />

                        {/* Núcleo del orbe — capas de gradiente */}
                        <span className="fchat__orb-core" aria-hidden="true">
                            <span className="fchat__orb-conic" />
                            <span className="fchat__orb-blob fchat__orb-blob--a" />
                            <span className="fchat__orb-blob fchat__orb-blob--b" />
                            <span className="fchat__orb-blob fchat__orb-blob--c" />
                            <span className="fchat__orb-shine" />
                        </span>

                        {/* Icono y label flotante */}
                        <span className="fchat__orb-icon">
                            <Bot size={20} strokeWidth={2.2} />
                        </span>
                        <span className="fchat__orb-tooltip">
                            <Sparkles size={11} strokeWidth={2.5} />
                            <span>Pregúntame algo</span>
                            <kbd>Ctrl·K</kbd>
                        </span>

                        {unread > 0 && <span className="fchat__orb-badge">{unread}</span>}
                    </button>
                ) : (
                    <div className="fchat__card" role="dialog" aria-label="Asistente IA">
                        <header className="fchat__head">
                            <div className="fchat__head-left">
                                <div className="fchat__avatar">
                                    <Bot size={14} strokeWidth={2.4} />
                                </div>
                                <div className="fchat__head-titles">
                                    <span className="fchat__head-title">Asistente IA</span>
                                    <span className="fchat__head-sub">
                                        <span className="fchat__dot" />
                                        OpenRouter · gpt-oss-20b
                                    </span>
                                </div>
                            </div>
                            <div className="fchat__head-actions">
                                {messages.length > 0 && (
                                    <button
                                        type="button"
                                        className="fchat__icon-btn"
                                        onClick={clearAll}
                                        title="Limpiar"
                                    >
                                        <Trash2 size={13} strokeWidth={2} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="fchat__icon-btn"
                                    onClick={() => setOpen(false)}
                                    title="Minimizar"
                                >
                                    <Minimize2 size={13} strokeWidth={2} />
                                </button>
                                <button
                                    type="button"
                                    className="fchat__icon-btn"
                                    onClick={() => setOpen(false)}
                                    title="Cerrar"
                                >
                                    <X size={13} strokeWidth={2.4} />
                                </button>
                            </div>
                        </header>

                        <div className="fchat__body">
                            {messages.length === 0 && (
                                <div className="fchat__empty">
                                    <div className="fchat__empty-icon">
                                        <Sparkles size={22} strokeWidth={1.8} />
                                    </div>
                                    <p className="fchat__empty-title">¿En qué te ayudo?</p>
                                    <p className="fchat__empty-sub">
                                        Pregúntame lo que sea sobre tus tareas, proyectos o productividad.
                                    </p>
                                    <div className="fchat__suggestions">
                                        {SUGGESTIONS.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                className="fchat__suggestion"
                                                onClick={() => send(s)}
                                                disabled={loading}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <div key={i} className={`fchat__msg fchat__msg--${m.role}`}>
                                    {m.role === 'assistant' && (
                                        <div className="fchat__msg-avatar">
                                            <Bot size={11} strokeWidth={2.4} />
                                        </div>
                                    )}
                                    <div className="fchat__bubble">
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="fchat__msg fchat__msg--assistant">
                                    <div className="fchat__msg-avatar">
                                        <Bot size={11} strokeWidth={2.4} />
                                    </div>
                                    <div className="fchat__bubble fchat__typing">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            )}
                            {error && <div className="fchat__error">{error}</div>}
                            <div ref={endRef} />
                        </div>

                        <form className="fchat__form" onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                className="fchat__input"
                                placeholder="Escribe un mensaje…"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                className="fchat__send"
                                disabled={loading || !input.trim()}
                                title="Enviar"
                            >
                                {loading
                                    ? <Loader2 size={14} strokeWidth={2.4} className="fchat__spin" />
                                    : <Send size={14} strokeWidth={2.4} />}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </>
    );
}
