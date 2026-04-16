import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                padding: '24px',
                background: 'var(--bg)',
                color: 'var(--fg)',
            }}
        >
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <div
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--acc)',
                        marginBottom: 12,
                    }}
                >
                    // 404 not_found
                </div>
                <h1
                    style={{
                        fontSize: 48,
                        fontWeight: 600,
                        letterSpacing: '-0.03em',
                        margin: '0 0 12px',
                        fontFamily: 'var(--font-mono)',
                    }}
                >
                    404
                </h1>
                <p style={{ color: 'var(--fg-muted)', marginBottom: 24 }}>
                    Esta ruta no existe en el dashboard.
                </p>
                <Link
                    to="/"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 16px',
                        background: 'var(--acc)',
                        color: 'var(--acc-fg)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        fontWeight: 500,
                    }}
                >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
