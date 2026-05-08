import React, { useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

const DISMISS_KEY = 'devdashboard:pwa:dismissed';

export default function InstallButton({ compact = false }) {
    const { canInstall, installed, iosPrompt, promptInstall } = usePwaInstall();
    const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
    const [showIos, setShowIos]     = useState(false);

    if (installed) return null;
    if (dismissed) return null;
    if (!canInstall && !iosPrompt) return null;

    const dismiss = () => {
        sessionStorage.setItem(DISMISS_KEY, '1');
        setDismissed(true);
    };

    const handleClick = async () => {
        if (canInstall) {
            const out = await promptInstall();
            if (out === 'dismissed') dismiss();
        } else if (iosPrompt) {
            setShowIos(true);
        }
    };

    return (
        <>
            <button
                type="button"
                className={`install-btn ${compact ? 'install-btn--compact' : ''}`}
                onClick={handleClick}
                title="Instalar como app"
            >
                <Download size={13} strokeWidth={2.4} />
                {!compact && <span>Instalar app</span>}
            </button>

            {showIos && (
                <div className="ios-install-modal" onClick={() => setShowIos(false)}>
                    <div className="ios-install-modal__card" onClick={e => e.stopPropagation()}>
                        <button
                            type="button"
                            className="ios-install-modal__close"
                            onClick={() => setShowIos(false)}
                            aria-label="Cerrar"
                        >
                            <X size={14} strokeWidth={2.4} />
                        </button>
                        <div className="ios-install-modal__icon">
                            <img src="/icons/apple-touch-icon.png" alt="DevDashboard" />
                        </div>
                        <h3>Instalar en tu iPhone / iPad</h3>
                        <p>iOS no soporta instalación automática. Sigue estos pasos:</p>
                        <ol>
                            <li>
                                <span className="ios-install-modal__step-icon">
                                    <Share size={14} strokeWidth={2.2} />
                                </span>
                                Toca el botón <strong>Compartir</strong> en Safari.
                            </li>
                            <li>
                                <span className="ios-install-modal__step-icon">
                                    <Plus size={14} strokeWidth={2.4} />
                                </span>
                                Selecciona <strong>"Añadir a pantalla de inicio"</strong>.
                            </li>
                            <li>Confirma con <strong>Añadir</strong>.</li>
                        </ol>
                        <button
                            type="button"
                            className="ios-install-modal__cta"
                            onClick={() => { dismiss(); setShowIos(false); }}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
