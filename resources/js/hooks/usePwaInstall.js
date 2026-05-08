import { useEffect, useState, useCallback } from 'react';

/**
 * Maneja el flujo de "Instalar como app":
 *  - Captura el evento `beforeinstallprompt` (Chrome / Edge / Android).
 *  - Detecta iOS Safari (no soporta el prompt → mostramos instrucciones manuales).
 *  - Detecta si ya está instalada (display-mode: standalone).
 */
export function usePwaInstall() {
    const [deferred, setDeferred]     = useState(null);
    const [installed, setInstalled]   = useState(false);
    const [iosPrompt, setIosPrompt]   = useState(false);

    useEffect(() => {
        // Detección de instalación
        const standalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        if (standalone) setInstalled(true);

        // iOS / Safari móvil
        const ua = window.navigator.userAgent;
        const isIos     = /iPad|iPhone|iPod/.test(ua);
        const isSafari  = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
        if (isIos && isSafari && !standalone) setIosPrompt(true);

        function onBeforeInstallPrompt(e) {
            e.preventDefault();
            setDeferred(e);
        }
        function onInstalled() {
            setInstalled(true);
            setDeferred(null);
        }

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const promptInstall = useCallback(async () => {
        if (!deferred) return null;
        deferred.prompt();
        const result = await deferred.userChoice.catch(() => null);
        setDeferred(null);
        return result?.outcome ?? null;
    }, [deferred]);

    return {
        canInstall: !!deferred,
        installed,
        iosPrompt,
        promptInstall,
    };
}
