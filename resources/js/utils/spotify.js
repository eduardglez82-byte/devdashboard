/* ─── Storage keys ─────────────────────────────────────────── */
const LS_CLIENT_ID = 'devdashboard:spotify:client_id';
const LS_TOKENS    = 'devdashboard:spotify:tokens';

/*
 * REDIRECT_URI: normaliza localhost → 127.0.0.1.
 * Spotify solo acepta 127.x.x.x en modo desarrollo.
 */
export const REDIRECT_URI = (() => {
    const url = new URL('/spotify/callback', window.location.origin);
    if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
    return url.toString();
})();

export const SCOPES = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'user-read-private',
    'user-read-email',
].join(' ');

/* ─── Client ID ────────────────────────────────────────────── */
export function getClientId()   { return localStorage.getItem(LS_CLIENT_ID) || ''; }
export function setClientId(id) { localStorage.setItem(LS_CLIENT_ID, id.trim()); }
export function clearClientId() { localStorage.removeItem(LS_CLIENT_ID); }

/* ─── Tokens ────────────────────────────────────────────────── */
export function getTokens() {
    try { return JSON.parse(localStorage.getItem(LS_TOKENS)); } catch { return null; }
}
export function saveTokens(data) {
    localStorage.setItem(LS_TOKENS, JSON.stringify({
        ...data,
        expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
    }));
}
export function clearTokens() { localStorage.removeItem(LS_TOKENS); }
export function isExpired() {
    const t = getTokens();
    return !t || Date.now() > t.expires_at - 60_000;
}

/* ─── PKCE helpers ──────────────────────────────────────────── */
function randomString(len) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(len));
    return values.reduce((acc, x) => acc + chars[x % chars.length], '');
}

async function sha256Base64url(str) {
    const data   = new TextEncoder().encode(str);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* ─── Auth flow (popup) ─────────────────────────────────────── */
/*
 * Usamos un popup en lugar de navegar la pestaña actual.
 * Ventajas:
 *   1. El dashboard mantiene su origen (localhost) → no pierde cookies de CSRF
 *   2. El popup maneja el redirect en 127.0.0.1 → no hay cross-origin storage
 *   3. verifier + clientId viajan en el state → el popup no necesita localStorage
 *
 * Formato state: "nonce|verifier|clientId"
 * El separador "|" no aparece en base64url ni en hex (clientId de Spotify).
 */
export async function startAuth() {
    const clientId = getClientId();
    if (!clientId) throw new Error('Client ID no configurado');

    const verifier  = randomString(64);
    const challenge = await sha256Base64url(verifier);
    const nonce     = randomString(16);
    const state     = `${nonce}|${verifier}|${clientId}`;

    const params = new URLSearchParams({
        client_id:             clientId,
        response_type:         'code',
        redirect_uri:          REDIRECT_URI,
        scope:                 SCOPES,
        code_challenge_method: 'S256',
        code_challenge:        challenge,
        state,
    });

    const popup = window.open(
        `https://accounts.spotify.com/authorize?${params}`,
        'spotify-auth',
        'width=480,height=700,top=80,left=80,resizable=yes,scrollbars=yes',
    );

    if (!popup) throw new Error('El navegador bloqueó el popup. Permite popups para este sitio.');

    return new Promise((resolve, reject) => {
        function onMessage(e) {
            if (!e.data || e.data.type !== 'spotify-auth-result') return;
            cleanup();
            if (e.data.error) reject(new Error(e.data.error));
            else { saveTokens(e.data.tokens); resolve(e.data.tokens); }
        }

        const poll = setInterval(() => {
            if (popup.closed) { cleanup(); reject(new Error('Login cancelado')); }
        }, 600);

        function cleanup() {
            clearInterval(poll);
            window.removeEventListener('message', onMessage);
        }

        window.addEventListener('message', onMessage);
    });
}

/* ─── Token exchange (corre en el popup, 127.0.0.1) ─────────── */
/*
 * Extrae verifier y clientId del state param — no necesita localStorage.
 * Devuelve los tokens sin guardarlos (el opener los guarda vía postMessage).
 */
export async function exchangeCode(code, stateParam) {
    if (!stateParam || !stateParam.includes('|')) {
        throw new Error('State invalido — intenta iniciar sesion de nuevo');
    }

    const [, verifier, clientId] = stateParam.split('|');

    if (!verifier || !clientId) {
        throw new Error('Datos incompletos en el state — intenta iniciar sesion de nuevo');
    }

    const body = new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        client_id:     clientId,
        code_verifier: verifier,
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error_description || `Token exchange failed (${res.status})`);
    }

    return res.json(); // el caller (popup) envía por postMessage; el opener guarda
}

/* ─── Token refresh ─────────────────────────────────────────── */
async function refreshAccessToken() {
    const tokens = getTokens();
    if (!tokens?.refresh_token) { clearTokens(); throw new Error('No refresh token'); }

    const body = new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id:     getClientId(),
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
    });

    if (!res.ok) { clearTokens(); throw new Error('Token refresh failed'); }

    const data = await res.json();
    saveTokens({ ...tokens, ...data });
    return data;
}

/* ─── Authenticated fetch ───────────────────────────────────── */
export async function spFetch(path, options = {}) {
    if (isExpired()) await refreshAccessToken();
    const tokens = getTokens();
    if (!tokens) throw new Error('Not authenticated');

    const res = await fetch(`https://api.spotify.com/v1${path}`, {
        ...options,
        headers: {
            Authorization:  `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: options.body
            ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
            : undefined,
    });

    if (res.status === 204) return null;
    if (res.status === 401) { clearTokens(); throw new Error('Sesion expirada'); }
    if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error?.message || `Spotify API ${res.status}`);
    }

    const ct = res.headers.get('content-type') ?? '';
    return ct.includes('json') ? res.json() : null;
}
