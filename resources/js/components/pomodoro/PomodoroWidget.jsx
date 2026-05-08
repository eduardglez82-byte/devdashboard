import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Settings as Cog } from 'lucide-react';
import { guardarPomodoro } from '../../api/endpoints/pomodoro';

const PRESETS = {
    focus:       { label: 'Foco',         seconds: 25 * 60, icon: Brain,  cls: 'pomo--focus'  },
    short_break: { label: 'Pausa corta',  seconds: 5  * 60, icon: Coffee, cls: 'pomo--short'  },
    long_break:  { label: 'Pausa larga',  seconds: 15 * 60, icon: Coffee, cls: 'pomo--long'   },
};

const SETTINGS_KEY = 'devdashboard:pomo:settings';

function fmtTime(s) {
    const m  = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) return { ...defaults(), ...JSON.parse(raw) };
    } catch {}
    return defaults();
}

function defaults() {
    return { focus: 25, short_break: 5, long_break: 15, autoNext: false, sound: true };
}

function beep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        osc.start();
        osc.stop(ctx.currentTime + 1.3);
    } catch {}
}

export default function PomodoroWidget({ tareas = [], onSessionComplete, initialTareaId = '' }) {
    const [settings, setSettings] = useState(loadSettings);
    const [tipo, setTipo]         = useState('focus');
    const [secondsLeft, setSecondsLeft] = useState(() => loadSettings().focus * 60);
    const [running, setRunning]   = useState(false);
    const [tareaId, setTareaId]   = useState(initialTareaId || '');
    const [sessions, setSessions] = useState(0);
    const [showCfg, setShowCfg]   = useState(false);
    const startedAtRef = useRef(null);
    const tickRef = useRef(null);

    const totalSeconds = settings[tipo] * 60;
    const progress = 1 - secondsLeft / totalSeconds;

    /* Persist settings */
    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    /* Re-sync timer when tipo or settings.duration change AND not running */
    useEffect(() => {
        if (!running) {
            setSecondsLeft(settings[tipo] * 60);
        }
    }, [tipo, settings, running]);

    /* Tick */
    useEffect(() => {
        if (!running) {
            if (tickRef.current) clearInterval(tickRef.current);
            return;
        }
        tickRef.current = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) {
                    clearInterval(tickRef.current);
                    handleComplete();
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running]);

    const handleStart = useCallback(() => {
        if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
        setRunning(true);
    }, []);

    const handlePause = useCallback(() => setRunning(false), []);

    const handleReset = useCallback(() => {
        setRunning(false);
        setSecondsLeft(settings[tipo] * 60);
        startedAtRef.current = null;
    }, [tipo, settings]);

    function nextTipo() {
        if (tipo === 'focus') {
            const isLong = (sessions + 1) % 4 === 0;
            return isLong ? 'long_break' : 'short_break';
        }
        return 'focus';
    }

    async function handleComplete() {
        setRunning(false);
        if (settings.sound) beep();

        const duracion = settings[tipo] * 60;
        try {
            await guardarPomodoro({
                tarea_id: tareaId || null,
                tipo,
                duracion_segundos: duracion,
                completado: true,
                iniciada_en: startedAtRef.current,
            });
            onSessionComplete?.({ tipo, duracion, tareaId });
        } catch {
            /* silencioso, no bloquear UX */
        }

        if (tipo === 'focus') setSessions(s => s + 1);

        // Browser notification
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Pomodoro terminado', {
                    body: tipo === 'focus' ? '¡Buen foco! Toma una pausa.' : 'Pausa terminada, vamos a enfocarnos.',
                });
            }
        } catch {}

        const next = nextTipo();
        setTipo(next);
        setSecondsLeft(settings[next] * 60);
        startedAtRef.current = null;

        if (settings.autoNext) {
            setTimeout(() => setRunning(true), 600);
        }
    }

    function handleSkip() {
        if (!confirm('¿Terminar la sesión actual sin completarla?')) return;
        setRunning(false);
        const next = nextTipo();
        setTipo(next);
        setSecondsLeft(settings[next] * 60);
        startedAtRef.current = null;
    }

    function requestNotifications() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    useEffect(() => { requestNotifications(); }, []);

    /* SVG ring */
    const R = 52;
    const C = 2 * Math.PI * R;
    const dashOffset = C * (1 - progress);

    const tareaSeleccionada = tareas.find(t => String(t.id) === String(tareaId));
    const Icon = PRESETS[tipo].icon;

    return (
        <div className={`pomo ${PRESETS[tipo].cls} ${running ? 'pomo--running' : ''}`}>
            {/* Header con tabs */}
            <div className="pomo__tabs">
                {Object.entries(PRESETS).map(([key, def]) => (
                    <button
                        key={key}
                        type="button"
                        className={`pomo__tab ${tipo === key ? 'pomo__tab--active' : ''}`}
                        onClick={() => { if (!running) setTipo(key); }}
                        disabled={running}
                    >
                        {def.label}
                    </button>
                ))}
                <button
                    type="button"
                    className="pomo__cfg"
                    onClick={() => setShowCfg(s => !s)}
                    title="Ajustes"
                >
                    <Cog size={13} strokeWidth={2.2} />
                </button>
            </div>

            {/* Settings */}
            {showCfg && (
                <div className="pomo__settings">
                    <div className="pomo__cfg-row">
                        <label>Foco (min)
                            <input type="number" min={1} max={120} value={settings.focus}
                                onChange={e => setSettings(s => ({ ...s, focus: Math.max(1, +e.target.value || 1) }))} />
                        </label>
                        <label>Pausa corta
                            <input type="number" min={1} max={60} value={settings.short_break}
                                onChange={e => setSettings(s => ({ ...s, short_break: Math.max(1, +e.target.value || 1) }))} />
                        </label>
                        <label>Pausa larga
                            <input type="number" min={1} max={60} value={settings.long_break}
                                onChange={e => setSettings(s => ({ ...s, long_break: Math.max(1, +e.target.value || 1) }))} />
                        </label>
                    </div>
                    <div className="pomo__cfg-row pomo__cfg-row--checks">
                        <label className="pomo__check">
                            <input type="checkbox" checked={settings.autoNext}
                                onChange={e => setSettings(s => ({ ...s, autoNext: e.target.checked }))} />
                            Auto siguiente
                        </label>
                        <label className="pomo__check">
                            <input type="checkbox" checked={settings.sound}
                                onChange={e => setSettings(s => ({ ...s, sound: e.target.checked }))} />
                            Sonido
                        </label>
                    </div>
                </div>
            )}

            {/* Ring + tiempo */}
            <div className="pomo__ring-wrap">
                <svg className="pomo__ring" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={R} className="pomo__ring-bg" />
                    <circle cx="60" cy="60" r={R} className="pomo__ring-fg"
                        strokeDasharray={C}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 60 60)"
                    />
                </svg>
                <div className="pomo__center">
                    <Icon size={14} strokeWidth={2.4} className="pomo__center-icon" />
                    <div className="pomo__time">{fmtTime(secondsLeft)}</div>
                    <div className="pomo__phase">{PRESETS[tipo].label}</div>
                </div>
            </div>

            {/* Selector tarea */}
            <div className="pomo__tarea">
                <label className="pomo__tarea-label">Enfocando:</label>
                <select
                    className="pomo__tarea-select"
                    value={tareaId}
                    onChange={e => setTareaId(e.target.value)}
                    disabled={running}
                >
                    <option value="">— Sin tarea específica —</option>
                    {tareas.map(t => (
                        <option key={t.id} value={t.id}>
                            {t.titulo.length > 50 ? t.titulo.slice(0, 50) + '…' : t.titulo}
                        </option>
                    ))}
                </select>
            </div>
            {tareaSeleccionada && (
                <div className="pomo__tarea-hint">
                    {tareaSeleccionada.empresa?.nombre || ''}
                </div>
            )}

            {/* Controles */}
            <div className="pomo__controls">
                {!running ? (
                    <button type="button" className="pomo__btn pomo__btn--primary" onClick={handleStart}>
                        <Play size={14} strokeWidth={2.5} fill="currentColor" />
                        <span>Iniciar</span>
                    </button>
                ) : (
                    <button type="button" className="pomo__btn pomo__btn--primary" onClick={handlePause}>
                        <Pause size={14} strokeWidth={2.5} fill="currentColor" />
                        <span>Pausar</span>
                    </button>
                )}
                <button type="button" className="pomo__btn" onClick={handleReset} title="Reiniciar">
                    <RotateCcw size={13} strokeWidth={2.4} />
                </button>
                <button type="button" className="pomo__btn" onClick={handleSkip} title="Saltar">
                    <SkipForward size={13} strokeWidth={2.4} />
                </button>
            </div>

            {/* Sesiones */}
            <div className="pomo__sessions">
                <span className="pomo__sessions-label">Sesiones de hoy</span>
                <div className="pomo__sessions-dots">
                    {[0,1,2,3].map(i => (
                        <span key={i} className={`pomo__dot ${i < (sessions % 4) ? 'pomo__dot--on' : ''}`} />
                    ))}
                </div>
                <span className="pomo__sessions-count">{sessions}</span>
            </div>
        </div>
    );
}
