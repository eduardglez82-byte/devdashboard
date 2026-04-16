import React, {
    useState, useEffect, useRef, useCallback, memo,
} from 'react';
import {
    StickyNote, CloudSun, Clock3, Bot, KeyRound,
    Newspaper, Music2,
    Plus, Trash2, Copy, Check, RefreshCw, Send,
    Wind, Thermometer, User, Loader, ExternalLink,
    Globe, Search,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listarNotas, crearNota, eliminarNota } from '../../api/endpoints/notas';
import { claudeChat } from '../../api/endpoints/claude';
import {
    getClientId, setClientId as saveSpClientId, clearClientId,
    getTokens, clearTokens, startAuth, spFetch, REDIRECT_URI,
} from '../../utils/spotify';

/* ─────────────────────────────────────────────────────────────
   TABS CONFIG
───────────────────────────────────────────────────────────── */
const TABS = [
    { id: 'notes',    icon: StickyNote,  label: 'Notas'   },
    { id: 'weather',  icon: CloudSun,    label: 'Clima'   },
    { id: 'clock',    icon: Clock3,      label: 'Reloj'   },
    { id: 'chat',     icon: Bot,         label: 'IA'      },
    { id: 'password', icon: KeyRound,    label: 'Clave'   },
    { id: 'news',     icon: Newspaper,   label: 'Noticias'},
    { id: 'spotify',  icon: Music2,      label: 'Spotify' },
];

/* ─────────────────────────────────────────────────────────────
   TAB: NOTES
───────────────────────────────────────────────────────────── */
function NotesTab() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [notas,   setNotas]   = useState([]);
    const [nueva,   setNueva]   = useState('');
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);

    useEffect(() => {
        listarNotas().then(setNotas).catch(() => {}).finally(() => setLoading(false));
    }, []);

    async function handleAdd(e) {
        e.preventDefault();
        const texto = nueva.trim();
        if (!texto) return;
        setSaving(true);
        try {
            const nota = await crearNota({ contenido: texto });
            setNotas(p => [nota, ...p]);
            setNueva('');
        } finally { setSaving(false); }
    }

    async function handleDel(id) {
        await eliminarNota(id).catch(() => {});
        setNotas(p => p.filter(n => n.id !== id));
    }

    return (
        <div className="rs-panel">
            <form onSubmit={handleAdd} className="nota-form" style={{ marginBottom: 16 }}>
                <textarea
                    className="nota-form__input"
                    placeholder="Escribe una nota… (Ctrl+Enter para guardar)"
                    value={nueva}
                    onChange={e => setNueva(e.target.value)}
                    rows={3}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd(e); }}
                />
                <button type="submit" className="nota-form__btn" disabled={saving || !nueva.trim()}>
                    {saving ? <Loader size={12} className="nota-form__spinner" /> : <Plus size={12} strokeWidth={2.5} />}
                    <span>Agregar nota</span>
                </button>
            </form>

            {loading ? (
                <div className="notas-empty"><Loader size={16} style={{ opacity: 0.4 }} /></div>
            ) : notas.length === 0 ? (
                <div className="notas-empty"><StickyNote size={20} strokeWidth={1.5} /><span>Sin notas aún</span></div>
            ) : (
                <ul className="notas-list">
                    {notas.map(n => (
                        <li key={n.id} className="nota-item">
                            {isAdmin && n.usuario && (
                                <div className="nota-item__author"><User size={9} strokeWidth={2.5} />{n.usuario.name}</div>
                            )}
                            <p className="nota-item__contenido">{n.contenido}</p>
                            <div className="nota-item__footer">
                                <span className="nota-item__time">
                                    {new Date(n.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                                </span>
                                <button className="nota-item__del" onClick={() => handleDel(n.id)} title="Eliminar" type="button">
                                    <Trash2 size={11} strokeWidth={2} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   TAB: WEATHER
───────────────────────────────────────────────────────────── */
const WMO = {
    0:'Despejado', 1:'Casi despejado', 2:'Parcialmente nublado', 3:'Cubierto',
    45:'Niebla', 48:'Niebla helada',
    51:'Llovizna leve', 53:'Llovizna', 55:'Llovizna densa',
    61:'Lluvia leve', 63:'Lluvia', 65:'Lluvia fuerte',
    71:'Nieve leve', 73:'Nieve', 75:'Nieve fuerte',
    80:'Chubascos leves', 81:'Chubascos', 82:'Chubascos fuertes',
    85:'Nieve intermitente', 86:'Nieve intensa',
    95:'Tormenta', 96:'Tormenta c/ granizo', 99:'Tormenta severa',
};

function WeatherTab() {
    const [weather,  setWeather]  = useState(null);
    const [city,     setCity]     = useState('');
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');

    const fetch_weather = useCallback(() => {
        setLoading(true); setError('');
        if (!navigator.geolocation) { setError('Geolocalización no disponible.'); setLoading(false); return; }
        navigator.geolocation.getCurrentPosition(
            async ({ coords: { latitude: lat, longitude: lon } }) => {
                try {
                    const [wRes, gRes] = await Promise.all([
                        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&forecast_days=1&timezone=auto`),
                        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
                    ]);
                    const wData = await wRes.json();
                    const gData = await gRes.json();
                    setWeather(wData.current_weather);
                    setCity(gData.address?.city || gData.address?.town || gData.address?.village || gData.address?.state || '');
                } catch { setError('Error al obtener el clima.'); }
                finally { setLoading(false); }
            },
            () => { setError('Acceso a ubicación denegado.'); setLoading(false); }
        );
    }, []);

    useEffect(() => { fetch_weather(); }, [fetch_weather]);

    const wmo = WMO[weather?.weathercode] ?? 'Desconocido';

    return (
        <div className="rs-panel">
            {loading && <div className="rs-center"><Loader size={24} style={{ opacity: 0.4 }} /></div>}
            {error && <div className="rs-error">{error}</div>}
            {weather && !loading && (
                <>
                    <div className="weather-main">
                        <div className="weather-temp">{Math.round(weather.temperature)}<span>°C</span></div>
                        <div className="weather-desc">{wmo}</div>
                        {city && <div className="weather-city">{city}</div>}
                    </div>
                    <div className="weather-details">
                        <div className="weather-detail">
                            <Wind size={13} strokeWidth={2} />
                            <span>Viento</span>
                            <strong>{Math.round(weather.windspeed)} km/h</strong>
                        </div>
                        <div className="weather-detail">
                            <Thermometer size={13} strokeWidth={2} />
                            <span>Código</span>
                            <strong>WMO {weather.weathercode}</strong>
                        </div>
                    </div>
                </>
            )}
            <button className="rs-refresh-btn" onClick={fetch_weather} disabled={loading} title="Actualizar">
                <RefreshCw size={12} strokeWidth={2.5} />
                <span>Actualizar clima</span>
            </button>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   TAB: WORLD CLOCK
───────────────────────────────────────────────────────────── */
const ZONES = [
    { label: 'Local',      tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { label: 'Mexico DF',  tz: 'America/Mexico_City' },
    { label: 'Nueva York', tz: 'America/New_York'     },
    { label: 'Londres',    tz: 'Europe/London'        },
    { label: 'Madrid',     tz: 'Europe/Madrid'        },
    { label: 'Tokio',      tz: 'Asia/Tokyo'           },
    { label: 'Dubai',      tz: 'Asia/Dubai'           },
];

function ClockTab() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const fmt = (tz) => now.toLocaleTimeString('es', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const fmtDate = (tz) => now.toLocaleDateString('es', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });

    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <div className="rs-panel">
            <div className="clock-main">
                <div className="clock-time">{fmt(localTz)}</div>
                <div className="clock-date">{fmtDate(localTz)}</div>
                <div className="clock-tz">{localTz}</div>
            </div>

            <div className="rs-section-label"><Globe size={11} />Zonas horarias</div>
            <ul className="clock-zones">
                {ZONES.filter(z => z.tz !== localTz).map(({ label, tz }) => (
                    <li key={tz} className="clock-zone">
                        <span className="clock-zone__label">{label}</span>
                        <span className="clock-zone__time">{fmt(tz)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   TAB: CLAUDE CHAT
───────────────────────────────────────────────────────────── */
function ChatTab() {
    const [messages, setMessages] = useState([]);
    const [input,    setInput]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const endRef = useRef(null);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    async function handleSend(e) {
        e.preventDefault();
        const text = input.trim();
        if (!text || loading) return;
        const userMsg = { role: 'user', content: text };
        setMessages(p => [...p, userMsg]);
        setInput('');
        setLoading(true);
        setError('');
        try {
            const history = [...messages, userMsg];
            const res = await claudeChat(history);
            if (res.error) { setError(res.error); }
            else {
                const assistantText = res.content?.[0]?.text ?? 'Sin respuesta.';
                setMessages(p => [...p, { role: 'assistant', content: assistantText }]);
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rs-panel rs-panel--chat">
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <Bot size={28} strokeWidth={1.5} />
                        <span>Hola, soy Claude. En que te puedo ayudar?</span>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`chat-msg chat-msg--${m.role}`}>
                        <div className="chat-msg__bubble">{m.content}</div>
                    </div>
                ))}
                {loading && (
                    <div className="chat-msg chat-msg--assistant">
                        <div className="chat-msg__bubble chat-msg__typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}
                {error && <div className="rs-error">{error}</div>}
                <div ref={endRef} />
            </div>
            <form onSubmit={handleSend} className="chat-form">
                <input
                    className="chat-form__input"
                    placeholder="Escribe un mensaje..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                />
                <button type="submit" className="chat-form__send" disabled={loading || !input.trim()} title="Enviar">
                    <Send size={13} strokeWidth={2.5} />
                </button>
            </form>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   TAB: PASSWORD GENERATOR
───────────────────────────────────────────────────────────── */
const CHARS = {
    upper:   'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lower:   'abcdefghjkmnpqrstuvwxyz',
    numbers: '23456789',
    symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

function generatePassword(len, opts) {
    let pool = '';
    if (opts.upper)   pool += CHARS.upper;
    if (opts.lower)   pool += CHARS.lower;
    if (opts.numbers) pool += CHARS.numbers;
    if (opts.symbols) pool += CHARS.symbols;
    if (!pool) pool = CHARS.lower + CHARS.numbers;
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr, v => pool[v % pool.length]).join('');
}

function strength(pwd) {
    let s = 0;
    if (pwd.length >= 12) s++;
    if (pwd.length >= 20) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    if (s <= 1) return { label: 'Debil',   cls: 'str--weak'   };
    if (s <= 3) return { label: 'Media',   cls: 'str--medium' };
    return              { label: 'Fuerte', cls: 'str--strong'  };
}

function PasswordTab() {
    const [len,  setLen]  = useState(20);
    const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
    const [pwd,  setPwd]  = useState('');
    const [copied, setCopied] = useState(false);

    const generate = useCallback(() => setPwd(generatePassword(len, opts)), [len, opts]);

    useEffect(() => { generate(); }, [generate]);

    async function copy() {
        await navigator.clipboard.writeText(pwd).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const str = pwd ? strength(pwd) : null;

    return (
        <div className="rs-panel">
            <div className="pwd-display">
                <span className="pwd-text">{pwd || '-'}</span>
                <button className="pwd-copy" onClick={copy} title="Copiar" type="button">
                    {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
                </button>
            </div>

            {str && (
                <div className={`pwd-strength ${str.cls}`}>
                    <div className="pwd-strength__bar">
                        <div className="pwd-strength__fill" />
                    </div>
                    <span>{str.label}</span>
                </div>
            )}

            <div className="pwd-controls">
                <label className="pwd-label">
                    Longitud: <strong>{len}</strong>
                </label>
                <input
                    type="range" min={8} max={64} value={len}
                    onChange={e => setLen(+e.target.value)}
                    className="pwd-slider"
                />
            </div>

            <div className="pwd-options">
                {[
                    ['upper',   'Mayusculas (A-Z)'],
                    ['lower',   'Minusculas (a-z)'],
                    ['numbers', 'Numeros (0-9)'],
                    ['symbols', 'Simbolos (!@#...)'],
                ].map(([key, lbl]) => (
                    <label key={key} className="pwd-opt">
                        <input
                            type="checkbox"
                            checked={opts[key]}
                            onChange={e => setOpts(o => ({ ...o, [key]: e.target.checked }))}
                        />
                        {lbl}
                    </label>
                ))}
            </div>

            <button className="rs-refresh-btn" onClick={generate}>
                <RefreshCw size={12} strokeWidth={2.5} />
                <span>Generar nueva</span>
            </button>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   TAB: TECH NEWS (Hacker News)
───────────────────────────────────────────────────────────── */
function NewsTab() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r => r.json());
            const top12 = ids.slice(0, 12);
            const items = await Promise.all(
                top12.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()))
            );
            setStories(items.filter(Boolean));
        } catch { setError('Error al cargar noticias.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="rs-panel">
            <div className="rs-section-header">
                <span className="rs-section-label" style={{ marginBottom: 0 }}>
                    <Newspaper size={11} />Hacker News - Top
                </span>
                <button className="rs-icon-btn" onClick={load} disabled={loading} title="Actualizar">
                    <RefreshCw size={13} strokeWidth={2} className={loading ? 'spinning' : ''} />
                </button>
            </div>

            {loading && <div className="rs-center"><Loader size={20} style={{ opacity: 0.4 }} /></div>}
            {error   && <div className="rs-error">{error}</div>}

            <ul className="news-list">
                {stories.map((s, i) => (
                    <li key={s.id} className="news-item">
                        <span className="news-item__num">{i + 1}</span>
                        <div className="news-item__body">
                            <a
                                href={s.url || `https://news.ycombinator.com/item?id=${s.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-item__title"
                            >
                                {s.title}
                                <ExternalLink size={10} strokeWidth={2.5} />
                            </a>
                            <div className="news-item__meta">
                                <span>+{s.score}</span>
                                <span>{s.descendants ?? 0} comentarios</span>
                                {s.by && <span>@{s.by}</span>}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   TAB: SPOTIFY  (OAuth PKCE + embed player)
───────────────────────────────────────────────────────────── */
const SP_SEL_KEY = 'devdashboard:spotify:selected';

function getInitialPhase() {
    if (!getClientId()) return 'setup';
    if (!getTokens())   return 'login';
    return 'library';
}

function SpotifyTab() {
    const [phase,       setPhase]       = useState(getInitialPhase);
    const [clientInput, setClientInput] = useState('');
    const [user,        setUser]        = useState(null);
    const [playlists,   setPlaylists]   = useState([]);
    const [selected,    setSelected]    = useState(() => localStorage.getItem(SP_SEL_KEY) || '');
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState('');
    const [searchQ,     setSearchQ]     = useState('');

    /* Cargar perfil + playlists al entrar en fase library */
    useEffect(() => {
        if (phase !== 'library') return;
        setLoading(true);
        setError('');
        Promise.all([
            spFetch('/me'),
            spFetch('/me/playlists?limit=50'),
        ])
            .then(([u, p]) => {
                setUser(u);
                const items = p?.items ?? [];
                setPlaylists(items);
                if (!localStorage.getItem(SP_SEL_KEY) && items.length) {
                    setSelected(items[0].id);
                    localStorage.setItem(SP_SEL_KEY, items[0].id);
                }
            })
            .catch(e => {
                if (e.message === 'Sesion expirada') { clearTokens(); setPhase('login'); }
                else setError(e.message);
            })
            .finally(() => setLoading(false));
    }, [phase]);

    /* Detectar cuando el callback guarda los tokens (storage event) */
    useEffect(() => {
        function onStorage(e) {
            if (e.key === 'devdashboard:spotify:tokens' && e.newValue) {
                setPhase('library');
            }
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    function handleSaveClientId() {
        const val = clientInput.trim();
        if (val.length < 20) { setError('El Client ID parece incorrecto.'); return; }
        saveSpClientId(val);
        setError('');
        setPhase('login');
    }

    function handleLogout() {
        clearTokens();
        setUser(null);
        setPlaylists([]);
        setPhase('login');
    }

    function handleResetSetup() {
        clearClientId();
        clearTokens();
        setUser(null);
        setPlaylists([]);
        setClientInput('');
        setError('');
        setPhase('setup');
    }

    function selectPlaylist(id) {
        setSelected(id);
        localStorage.setItem(SP_SEL_KEY, id);
    }

    const filtered = searchQ
        ? playlists.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()))
        : playlists;

    const embedSrc = selected
        ? `https://open.spotify.com/embed/playlist/${selected}?utm_source=generator&theme=0`
        : '';

    /* Fase 1: Configurar Client ID */
    if (phase === 'setup') {
        return (
            <div className="sp-setup">
                <div className="sp-setup__logo">&#127925;</div>
                <p className="sp-setup__title">Conectar Spotify</p>
                <p className="sp-setup__desc">
                    Crea una app gratuita en Spotify for Developers y pega tu Client ID aqui.
                </p>
                <ol className="sp-setup__steps">
                    <li>Ve a <strong>developer.spotify.com</strong> y crea una app.</li>
                    <li>En <strong>Redirect URIs</strong> agrega esta URL exactamente y haz clic en <em>Agregar</em>:</li>
                </ol>
                <code className="sp-setup__uri">{REDIRECT_URI}</code>
                <ol className="sp-setup__steps" start="3">
                    <li>Marca <strong>Web API</strong>, guarda y copia tu <strong>Client ID</strong>:</li>
                </ol>
                {error && <div className="rs-error">{error}</div>}
                <div className="sp-setup__row">
                    <input
                        className="rs-input"
                        placeholder="Client ID..."
                        value={clientInput}
                        onChange={e => { setClientInput(e.target.value); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleSaveClientId()}
                    />
                    <button className="rs-btn rs-btn--primary" onClick={handleSaveClientId} type="button">
                        Guardar
                    </button>
                </div>
            </div>
        );
    }

    /* Fase 2: Login */
    if (phase === 'login') {
        return (
            <div className="sp-login">
                <div className="sp-login__icon">&#127925;</div>
                <p className="sp-login__title">Spotify</p>
                <p className="sp-login__desc">
                    Inicia sesion con tu cuenta para ver tus playlists.
                </p>
                <button
                    className="sp-login__btn"
                    type="button"
                    onClick={() => {
                        setError('');
                        startAuth()
                            .then(() => setPhase('library'))
                            .catch(e => setError(e.message));
                    }}
                >
                    Iniciar sesion con Spotify
                </button>
                {error && (
                    <div className="sp-login__error">
                        <div className="rs-error">{error}</div>
                        <p className="sp-login__uri-label">
                            Verifica que esta URI este registrada <strong>exactamente</strong> en tu app de Spotify:
                        </p>
                        <code className="sp-setup__uri">{REDIRECT_URI}</code>
                    </div>
                )}
                <button
                    className="rs-icon-btn"
                    type="button"
                    onClick={handleResetSetup}
                    style={{ marginTop: 4, fontSize: 11, color: 'var(--fg-subtle)' }}
                >
                    Cambiar Client ID
                </button>
            </div>
        );
    }

    /* Fase 3: Biblioteca + Reproductor */
    return (
        <div className="sp-lib">
            {/* Header usuario */}
            <div className="sp-lib__header">
                {user?.images?.[0]?.url
                    ? <img className="sp-lib__avatar" src={user.images[0].url} alt="" />
                    : <div className="sp-lib__avatar sp-lib__avatar--fallback">
                        {user?.display_name?.[0] ?? '?'}
                    </div>
                }
                <div className="sp-lib__user-info">
                    <span className="sp-lib__username">{user?.display_name ?? 'Cargando...'}</span>
                    <span className="sp-lib__count">{playlists.length} playlists</span>
                </div>
                <button
                    className="rs-icon-btn"
                    type="button"
                    title="Cerrar sesion"
                    onClick={handleLogout}
                    style={{ flexShrink: 0 }}
                >
                    <User size={13} strokeWidth={2} />
                </button>
            </div>

            {/* Buscador de playlists */}
            {playlists.length > 5 && (
                <div className="sp-lib__search">
                    <Search size={11} strokeWidth={2} className="sp-lib__search-icon" />
                    <input
                        className="sp-lib__search-input"
                        placeholder="Buscar playlist..."
                        value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                    />
                </div>
            )}

            {error && <div className="rs-error" style={{ padding: '4px 10px' }}>{error}</div>}

            {loading && !user && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                    <Loader size={16} strokeWidth={2} style={{ animation: 'spin 0.8s linear infinite' }} />
                </div>
            )}

            {/* Lista de playlists */}
            {filtered.length > 0 && (
                <ul className="sp-lib__list">
                    {filtered.map(pl => (
                        <li key={pl.id}>
                            <button
                                type="button"
                                className={`sp-lib__item${selected === pl.id ? ' sp-lib__item--active' : ''}`}
                                onClick={() => selectPlaylist(pl.id)}
                            >
                                {pl.images?.[0]?.url
                                    ? <img className="sp-lib__item-img" src={pl.images[0].url} alt="" />
                                    : <div className="sp-lib__item-img sp-lib__item-img--empty">
                                        <Music2 size={14} strokeWidth={2} />
                                    </div>
                                }
                                <div className="sp-lib__item-body">
                                    <span className="sp-lib__item-name">{pl.name}</span>
                                    <span className="sp-lib__item-meta">{pl.tracks?.total ?? 0} canciones</span>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Reproductor embed */}
            {embedSrc && (
                <iframe
                    key={embedSrc}
                    src={embedSrc}
                    className="sp-lib__frame"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="Spotify"
                />
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PANEL
───────────────────────────────────────────────────────────── */
const TAB_COMPONENTS = {
    notes:    NotesTab,
    weather:  WeatherTab,
    clock:    ClockTab,
    chat:     ChatTab,
    password: PasswordTab,
    news:     NewsTab,
    spotify:  SpotifyTab,
};

export default function RightSidebarPanel() {
    const [active,  setActive]  = useState('notes');
    const [mounted, setMounted] = useState(new Set(['notes']));

    function openTab(id) {
        setActive(id);
        setMounted(prev => new Set([...prev, id]));
    }

    return (
        <div className="rs-panel-root">
            {/* Tab bar */}
            <div className="rs-tabs">
                {TABS.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        type="button"
                        className={`rs-tab ${active === id ? 'rs-tab--active' : ''}`}
                        onClick={() => openTab(id)}
                        title={label}
                    >
                        <Icon size={14} strokeWidth={active === id ? 2.5 : 2} />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

            {/* Tab panels - mounted once, hidden via CSS */}
            <div className="rs-panels">
                {TABS.map(({ id }) => {
                    const Comp = TAB_COMPONENTS[id];
                    return (
                        <div
                            key={id}
                            className="rs-panel-wrap"
                            style={{ display: active === id ? 'block' : 'none' }}
                        >
                            {mounted.has(id) && <Comp />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
