import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1,
    Shuffle, Repeat, Repeat1, Music2, AlertCircle, Loader2,
} from 'lucide-react';
import { getAccessToken, loadSpotifySDK, transferPlayback, playOn, spFetch, clearTokens } from '../../utils/spotify';

/* ── helpers ─────────────────────────────────────────────────── */
function fmtMs(ms) {
    if (!ms || ms < 0) ms = 0;
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

/* ── SpotifyPlayer component ─────────────────────────────────── */
export default function SpotifyPlayer({ playlistUri, onTrackChange }) {
    const playerRef         = useRef(null);
    const [deviceId,    setDeviceId]    = useState('');
    const [ready,       setReady]       = useState(false);
    const [premium,     setPremium]     = useState(true);
    const [error,       setError]       = useState('');
    const [state,       setState]       = useState(null);  // estado del player (track, paused, position…)
    const [position,    setPosition]    = useState(0);
    const [volume,      setVolume]      = useState(0.6);
    const [seeking,     setSeeking]     = useState(false);
    const [activatedHere, setActivatedHere] = useState(false);

    /* Inicializar SDK (una sola vez) */
    useEffect(() => {
        let cancelled = false;
        let player    = null;

        async function init() {
            try {
                const Spotify = await loadSpotifySDK();
                if (cancelled) return;

                player = new Spotify.Player({
                    name: 'DevDashboard Player',
                    getOAuthToken: cb => { getAccessToken().then(cb).catch(() => cb('')); },
                    volume: 0.6,
                });

                player.addListener('ready', ({ device_id }) => {
                    if (cancelled) return;
                    setDeviceId(device_id);
                    setReady(true);
                });
                player.addListener('not_ready', () => setReady(false));
                player.addListener('player_state_changed', (s) => {
                    if (!s) return;
                    setState(s);
                    setPosition(s.position);
                    if (onTrackChange && s.track_window?.current_track) {
                        onTrackChange(s.track_window.current_track);
                    }
                });
                player.addListener('initialization_error', ({ message }) => setError(message));
                player.addListener('authentication_error',  ({ message }) => {
                    setError('Sesión inválida (probablemente faltan nuevos permisos). Se cerrará Spotify para reconectar…');
                    setTimeout(() => { clearTokens(); window.location.reload(); }, 1800);
                });
                player.addListener('account_error',         ({ message }) => {
                    setPremium(false);
                    setError('Se necesita Spotify Premium: ' + message);
                });
                player.addListener('playback_error',        ({ message }) => setError('Playback: ' + message));

                const ok = await player.connect();
                if (!ok) setError('No se pudo conectar el reproductor');
                playerRef.current = player;
            } catch (e) {
                if (!cancelled) setError(e.message);
            }
        }

        init();

        return () => {
            cancelled = true;
            if (player) {
                try { player.disconnect(); } catch {}
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* Tick de progreso (1s) cuando está reproduciendo */
    useEffect(() => {
        if (!state || state.paused || seeking) return;
        const id = setInterval(() => {
            setPosition(p => Math.min(p + 1000, state.duration || 0));
        }, 1000);
        return () => clearInterval(id);
    }, [state, seeking]);

    /* Cambio de playlist → reproducir */
    useEffect(() => {
        if (!playlistUri || !ready || !deviceId || !premium) return;
        (async () => {
            try {
                if (!activatedHere) {
                    await transferPlayback(deviceId, false);
                    setActivatedHere(true);
                    // pequeño delay para que Spotify tome el device como activo
                    await new Promise(r => setTimeout(r, 350));
                }
                await playOn(deviceId, { context_uri: playlistUri });
            } catch (e) {
                setError(e.message || 'No se pudo iniciar reproducción');
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playlistUri, ready, deviceId, premium]);

    /* Controles */
    const togglePlay = useCallback(async () => {
        const p = playerRef.current;
        if (!p) return;
        try { await p.togglePlay(); } catch {}
    }, []);

    const next = useCallback(async () => {
        const p = playerRef.current;
        if (!p) return;
        try { await p.nextTrack(); } catch {}
    }, []);

    const prev = useCallback(async () => {
        const p = playerRef.current;
        if (!p) return;
        try { await p.previousTrack(); } catch {}
    }, []);

    const handleSeek = useCallback(async (ms) => {
        const p = playerRef.current;
        if (!p) return;
        setPosition(ms);
        try { await p.seek(ms); } catch {}
    }, []);

    const handleVolume = useCallback(async (v) => {
        setVolume(v);
        const p = playerRef.current;
        if (!p) return;
        try { await p.setVolume(v); } catch {}
    }, []);

    const toggleShuffle = useCallback(async () => {
        if (!state) return;
        try {
            await spFetch(`/me/player/shuffle?state=${!state.shuffle}&device_id=${deviceId}`, { method: 'PUT' });
        } catch (e) { setError(e.message); }
    }, [state, deviceId]);

    const cycleRepeat = useCallback(async () => {
        if (!state) return;
        const next = state.repeat_mode === 0 ? 'context' : state.repeat_mode === 1 ? 'track' : 'off';
        try {
            await spFetch(`/me/player/repeat?state=${next}&device_id=${deviceId}`, { method: 'PUT' });
        } catch (e) { setError(e.message); }
    }, [state, deviceId]);

    /* Render ─────────────────────────────────────────────────── */
    if (!premium) {
        return (
            <div className="sp-player sp-player--error">
                <AlertCircle size={28} strokeWidth={1.6} />
                <p className="sp-player__err-title">Se necesita Spotify Premium</p>
                <p className="sp-player__err-sub">El reproductor en navegador solo funciona con cuentas Premium. Tu cuenta actual no lo es.</p>
            </div>
        );
    }

    if (error && !state) {
        return (
            <div className="sp-player sp-player--error">
                <AlertCircle size={24} strokeWidth={1.6} />
                <p className="sp-player__err-title">Reproductor no disponible</p>
                <p className="sp-player__err-sub">{error}</p>
            </div>
        );
    }

    if (!ready) {
        return (
            <div className="sp-player sp-player--loading">
                <Loader2 size={22} className="sp-player__spin" />
                <span>Conectando reproductor…</span>
            </div>
        );
    }

    const track    = state?.track_window?.current_track;
    const duration = state?.duration ?? 0;
    const paused   = state?.paused ?? true;
    const VolIcon  = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
    const RepeatIcon = state?.repeat_mode === 1 ? Repeat1 : Repeat;

    return (
        <div className="sp-player">
            {/* Cover + info */}
            <div className="sp-player__hero">
                {track?.album?.images?.[0]?.url ? (
                    <img className="sp-player__cover" src={track.album.images[0].url} alt={track.album.name} />
                ) : (
                    <div className="sp-player__cover sp-player__cover--empty">
                        <Music2 size={36} strokeWidth={1.4} />
                    </div>
                )}
            </div>

            <div className="sp-player__meta">
                <div className="sp-player__title" title={track?.name}>
                    {track?.name ?? 'Sin reproducción'}
                </div>
                <div className="sp-player__artists" title={track?.artists?.map(a => a.name).join(', ')}>
                    {track?.artists?.map(a => a.name).join(', ') ?? '—'}
                </div>
            </div>

            {/* Seek bar */}
            <div className="sp-player__seek">
                <span className="sp-player__time">{fmtMs(position)}</span>
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={Math.min(position, duration || 0)}
                    onMouseDown={() => setSeeking(true)}
                    onTouchStart={() => setSeeking(true)}
                    onChange={(e) => setPosition(Number(e.target.value))}
                    onMouseUp={(e) => { setSeeking(false); handleSeek(Number(e.target.value)); }}
                    onTouchEnd={(e) => { setSeeking(false); handleSeek(Number(e.target.value)); }}
                    className="sp-player__seek-input"
                    style={{ '--progress': `${duration ? (position / duration) * 100 : 0}%` }}
                    disabled={!track}
                />
                <span className="sp-player__time">{fmtMs(duration)}</span>
            </div>

            {/* Controls */}
            <div className="sp-player__controls">
                <button
                    type="button"
                    className={`sp-player__ctl ${state?.shuffle ? 'sp-player__ctl--active' : ''}`}
                    onClick={toggleShuffle}
                    title="Aleatorio"
                    disabled={!track}
                >
                    <Shuffle size={14} strokeWidth={2.2} />
                </button>
                <button
                    type="button"
                    className="sp-player__ctl"
                    onClick={prev}
                    title="Anterior"
                    disabled={!track}
                >
                    <SkipBack size={16} strokeWidth={2.2} fill="currentColor" />
                </button>
                <button
                    type="button"
                    className="sp-player__ctl sp-player__ctl--main"
                    onClick={togglePlay}
                    title={paused ? 'Reproducir' : 'Pausar'}
                    disabled={!track}
                >
                    {paused
                        ? <Play  size={18} strokeWidth={2} fill="currentColor" />
                        : <Pause size={18} strokeWidth={2} fill="currentColor" />}
                </button>
                <button
                    type="button"
                    className="sp-player__ctl"
                    onClick={next}
                    title="Siguiente"
                    disabled={!track}
                >
                    <SkipForward size={16} strokeWidth={2.2} fill="currentColor" />
                </button>
                <button
                    type="button"
                    className={`sp-player__ctl ${state?.repeat_mode > 0 ? 'sp-player__ctl--active' : ''}`}
                    onClick={cycleRepeat}
                    title="Repetir"
                    disabled={!track}
                >
                    <RepeatIcon size={14} strokeWidth={2.2} />
                </button>
            </div>

            {/* Volume */}
            <div className="sp-player__volume">
                <button
                    type="button"
                    className="sp-player__vol-btn"
                    onClick={() => handleVolume(volume === 0 ? 0.6 : 0)}
                    title="Mute"
                >
                    <VolIcon size={13} strokeWidth={2} />
                </button>
                <input
                    type="range" min={0} max={1} step={0.01}
                    value={volume}
                    onChange={e => handleVolume(Number(e.target.value))}
                    className="sp-player__vol-input"
                    style={{ '--progress': `${volume * 100}%` }}
                />
            </div>

            {error && <div className="sp-player__msg">{error}</div>}
        </div>
    );
}
