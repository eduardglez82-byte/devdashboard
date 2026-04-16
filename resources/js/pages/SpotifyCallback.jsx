import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCode, saveTokens } from '../utils/spotify';

export default function SpotifyCallback() {
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code   = params.get('code');
        const state  = params.get('state');
        const err    = params.get('error');

        const isPopup = !!window.opener;

        function sendResult(payload) {
            if (isPopup) {
                window.opener.postMessage({ type: 'spotify-auth-result', ...payload }, '*');
                window.close();
            }
        }

        if (err) {
            if (isPopup) { sendResult({ error: err }); return; }
            setError(`Spotify: ${err}`);
            setTimeout(() => navigate('/'), 3000);
            return;
        }

        if (!code) {
            const msg = 'No se recibio codigo de autorizacion';
            if (isPopup) { sendResult({ error: msg }); return; }
            setError(msg);
            setTimeout(() => navigate('/'), 3000);
            return;
        }

        exchangeCode(code, state)
            .then(data => {
                if (isPopup) {
                    sendResult({ tokens: data });
                } else {
                    /* Fallback: si no hay popup (acceso directo a la URL) */
                    saveTokens(data);
                    navigate('/');
                }
            })
            .catch(e => {
                if (isPopup) { sendResult({ error: e.message }); return; }
                setError(e.message);
                setTimeout(() => navigate('/'), 4000);
            });
    }, []); // eslint-disable-line

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: 16,
            fontFamily: 'var(--font-sans)',
            background: '#000',
            color: '#fff',
        }}>
            {error ? (
                <>
                    <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Cerrando...</div>
                </>
            ) : (
                <>
                    <div style={{
                        width: 40, height: 40,
                        border: '3px solid #1DB954',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <div style={{ fontSize: 14, color: '#9ca3af' }}>Conectando con Spotify...</div>
                </>
            )}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
